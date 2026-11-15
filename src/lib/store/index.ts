import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { neon } from "@neondatabase/serverless";

/**
 * Yönetim paneli deposu — TEK arayüz, dört gerçekleme.
 *
 * · **postgres** — Vercel Marketplace'ten bağlanan **Neon (ücretsiz plan, `free_v3`)**.
 *   Production'da kullanılan bu (karar 2026-11-15): bu Vercel hesabında yeni bir Upstash
 *   veritabanı yalnız ücretli planlarla açılabiliyordu, Neon'un ücretsiz planı var.
 *   Vercel bağlanınca `DATABASE_URL`'i kendisi ekler. HTTP sürücüsü (`@neondatabase/serverless`),
 *   bağlantı havuzu yok — sunucusuz fonksiyonda doğru model. Tablolar ilk kullanımda kurulur.
 * · **redis** — Vercel Marketplace'ten bağlanan Upstash Redis. REST üzerinden konuşulur
 *   (`fetch`), yeni paket yok. Vercel bağlanınca env'i kendisi ekler: `KV_REST_API_URL` +
 *   `KV_REST_API_TOKEN` (ya da Upstash'in kendi adlarıyla `UPSTASH_REDIS_REST_*`).
 * · **file** — geliştirme ve yerel testler: `.data/admin-store.json` (gitignore'da).
 *   Production'da yalnız `ADMIN_STORE=file` ile açılır (yerel prod build testi).
 * · **none** — production'da depo bağlı değil. Okumalar varsayılan döner (fiyat ezmesi
 *   yok, sipariş açık), yazmalar `StoreNotConfigured` atar. **Site bozulmaz** — panel
 *   "veritabanı bağlı değil" der. Depo henüz kurulmadan yapılan bir push deploy'u
 *   kırmamalı; o yüzden build'de değil, kullanımda konuşur (Kural 57'nin tersi bilerek:
 *   orada yanlış canonical sessizce yayına çıkıyordu, burada eksik depo yalnız paneli kapatır).
 */

export interface OrderItem {
  slug: string;
  name: string;
  qty: number;
  unit: number;
}

export interface StoredOrder {
  /** İstemcinin ürettiği kısa kimlik — WhatsApp mesajında da geçer, panelle eşleşir. */
  id: string;
  /** ISO zaman damgası (sunucu saati). */
  at: string;
  locale: string;
  items: OrderItem[];
  total: number;
}

/** slug → fiyat. `null` = "YAKINDA" (sipariş edilemez). Anahtar yoksa menu.ts'deki fiyat geçerli. */
export type PriceOverrides = Record<string, number | null>;

export interface AdminStore {
  kind: "postgres" | "redis" | "file" | "none";
  getPrices(): Promise<PriceOverrides>;
  setPrice(slug: string, price: number | null): Promise<void>;
  getOrderingEnabled(): Promise<boolean>;
  setOrderingEnabled(enabled: boolean): Promise<void>;
  /** false → aynı kimlik zaten kayıtlı (çift gönderim). `day` İstanbul günü (günlük sayaç). */
  addOrder(order: StoredOrder, day: string): Promise<boolean>;
  /** Günlük sayaç — listeden TÜRETİLMEZ (liste 60 kayıtta kesiliyor, sayaç kesilmez). */
  getDayStats(day: string): Promise<{ count: number; total: number }>;
  listOrders(limit: number): Promise<StoredOrder[]>;
  /** Hız sınırı sayacı: penceredeki deneme sayısı (bu deneme dahil). */
  hit(key: string, windowSec: number): Promise<number>;
  reset(key: string): Promise<void>;
}

export class StoreNotConfigured extends Error {
  constructor() {
    super("Yönetim deposu bağlı değil (DATABASE_URL ya da KV_REST_API_URL / KV_REST_API_TOKEN).");
  }
}

const MAX_ORDERS = 500;
const K = {
  prices: "manch:prices",
  settings: "manch:settings",
  orders: "manch:orders",
  orderId: (id: string) => `manch:order-id:${id}`,
  day: (d: string) => `manch:day:${d}`,
  rl: (key: string) => `manch:rl:${key}`,
};

/* --------------------------------------------------------------- postgres */

/**
 * Redis gerçeklemesindeki her garanti burada da TEK SQL ifadesiyle, atomik:
 * · `hit` — `INSERT … ON CONFLICT DO UPDATE … RETURNING n`: sayaç satır kilidiyle artar,
 *   paralel 15 deneme 15 ayrı değer görür (Kural 80: önce say, sonra dene). Pencere
 *   dolmuşsa aynı ifadede 1'e döner — ayrı bir EXPIRE çağrısı yok, süresiz kalma riski yok.
 * · `addOrder` — kimlik kaydı `ON CONFLICT … WHERE at < now() − 2 gün`: Redis'teki
 *   `SET NX EX 172800`'ün karşılığı. Kısa kimlikler zamanla tekrar edebilir; 2 günden eski
 *   kimlik yeniden kullanılabilir, yenisi reddedilir. Eşzamanlı çift tıklama da tek satır yazar.
 * · Sipariş satırı + günlük sayaç tek işlemde (transaction).
 *
 * `prefix`: tablo adı öneki. Production `manch_`; bekçi gerçek veritabanında `manchtest_`
 * ile koşar ve tablolarını siler — canlı veriye dokunmaz.
 */
function postgresStore(url: string, prefix: string): AdminStore {
  if (!/^[a-z_]+$/.test(prefix)) throw new Error("ADMIN_PG_PREFIX yalnız küçük harf ve _");
  const sql = neon(url, { fetchOptions: { cache: "no-store" } });
  const T = {
    prices: `${prefix}prices`,
    settings: `${prefix}settings`,
    orders: `${prefix}orders`,
    ids: `${prefix}order_ids`,
    days: `${prefix}days`,
    hits: `${prefix}hits`,
  };

  let ready: Promise<unknown> | null = null;
  const schema = () =>
    (ready ??= sql
      .transaction([
        sql.query(`CREATE TABLE IF NOT EXISTS ${T.prices} (slug text PRIMARY KEY, price integer)`),
        sql.query(`CREATE TABLE IF NOT EXISTS ${T.settings} (key text PRIMARY KEY, value text NOT NULL)`),
        sql.query(`CREATE TABLE IF NOT EXISTS ${T.orders} (seq bigserial PRIMARY KEY, id text NOT NULL, at text NOT NULL, locale text NOT NULL, items jsonb NOT NULL, total integer NOT NULL)`),
        sql.query(`CREATE TABLE IF NOT EXISTS ${T.ids} (id text PRIMARY KEY, at timestamptz NOT NULL)`),
        sql.query(`CREATE TABLE IF NOT EXISTS ${T.days} (day text PRIMARY KEY, count integer NOT NULL, total bigint NOT NULL)`),
        sql.query(`CREATE TABLE IF NOT EXISTS ${T.hits} (key text PRIMARY KEY, n integer NOT NULL, until timestamptz NOT NULL)`),
      ])
      // Kurulum düşerse bir sonraki çağrı yeniden denesin (önbellekte reddedilmiş söz kalmasın).
      .catch((e) => {
        ready = null;
        throw e;
      }));
  const q = async <R = Record<string, unknown>>(text: string, params: unknown[] = []) => {
    await schema();
    return (await sql.query(text, params)) as R[];
  };

  return {
    kind: "postgres",
    async getPrices() {
      const rows = await q<{ slug: string; price: number | null }>(`SELECT slug, price FROM ${T.prices}`);
      return Object.fromEntries(rows.map((r) => [r.slug, r.price]));
    },
    async setPrice(slug, price) {
      await q(
        `INSERT INTO ${T.prices} (slug, price) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price`,
        [slug, price],
      );
    },
    async getOrderingEnabled() {
      const rows = await q<{ value: string }>(`SELECT value FROM ${T.settings} WHERE key = 'ordering'`);
      return rows[0]?.value !== "0";
    },
    async setOrderingEnabled(enabled) {
      await q(
        `INSERT INTO ${T.settings} (key, value) VALUES ('ordering', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [enabled ? "1" : "0"],
      );
    },
    async addOrder(order, day) {
      const fresh = await q(
        `INSERT INTO ${T.ids} (id, at) VALUES ($1, now())
         ON CONFLICT (id) DO UPDATE SET at = now() WHERE ${T.ids}.at < now() - interval '2 days'
         RETURNING id`,
        [order.id],
      );
      if (fresh.length === 0) return false;
      await sql.transaction([
        sql.query(`INSERT INTO ${T.orders} (id, at, locale, items, total) VALUES ($1, $2, $3, $4::jsonb, $5)`, [
          order.id,
          order.at,
          order.locale,
          JSON.stringify(order.items),
          order.total,
        ]),
        sql.query(
          `INSERT INTO ${T.days} (day, count, total) VALUES ($1, 1, $2)
           ON CONFLICT (day) DO UPDATE SET count = ${T.days}.count + 1, total = ${T.days}.total + EXCLUDED.total`,
          [day, order.total],
        ),
      ]);
      return true;
    },
    async getDayStats(day) {
      const rows = await q<{ count: number; total: string | number }>(`SELECT count, total FROM ${T.days} WHERE day = $1`, [day]);
      return { count: Number(rows[0]?.count ?? 0), total: Number(rows[0]?.total ?? 0) };
    },
    async listOrders(limit) {
      const rows = await q<{ id: string; at: string; locale: string; items: OrderItem[]; total: number }>(
        `SELECT id, at, locale, items, total FROM ${T.orders} ORDER BY seq DESC LIMIT $1`,
        [limit],
      );
      return rows.map((r) => ({ id: r.id, at: r.at, locale: r.locale, items: r.items, total: Number(r.total) }));
    },
    async hit(key, windowSec) {
      const rows = await q<{ n: number }>(
        `INSERT INTO ${T.hits} (key, n, until) VALUES ($1, 1, now() + make_interval(secs => $2))
         ON CONFLICT (key) DO UPDATE SET
           n = CASE WHEN ${T.hits}.until <= now() THEN 1 ELSE ${T.hits}.n + 1 END,
           until = CASE WHEN ${T.hits}.until <= now() THEN now() + make_interval(secs => $2) ELSE ${T.hits}.until END
         RETURNING n`,
        [key, windowSec],
      );
      return Number(rows[0]?.n ?? 0);
    },
    async reset(key) {
      await q(`DELETE FROM ${T.hits} WHERE key = $1`, [key]);
    },
  };
}

/* ------------------------------------------------------------------ redis */

function redisStore(url: string, token: string): AdminStore {
  async function cmd<T = unknown>(...args: (string | number)[]): Promise<T> {
    const r = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`redis ${args[0]} → HTTP ${r.status}`);
    const j = (await r.json()) as { result?: T; error?: string };
    if (j.error) throw new Error(`redis ${args[0]} → ${j.error}`);
    return j.result as T;
  }

  return {
    kind: "redis",
    async getPrices() {
      const flat = (await cmd<string[]>("HGETALL", K.prices)) ?? [];
      const out: PriceOverrides = {};
      for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1] === "null" ? null : Number(flat[i + 1]);
      return out;
    },
    async setPrice(slug, price) {
      await cmd("HSET", K.prices, slug, price === null ? "null" : String(price));
    },
    async getOrderingEnabled() {
      return (await cmd<string | null>("HGET", K.settings, "ordering")) !== "0";
    },
    async setOrderingEnabled(enabled) {
      await cmd("HSET", K.settings, "ordering", enabled ? "1" : "0");
    },
    async addOrder(order, day) {
      // Çift gönderimi kimlikle ele: aynı id 2 gün içinde ikinci kez yazılmaz.
      const yeni = await cmd<string | null>("SET", K.orderId(order.id), "1", "NX", "EX", 172800);
      if (yeni !== "OK") return false;
      await cmd("LPUSH", K.orders, JSON.stringify(order));
      await cmd("LTRIM", K.orders, 0, MAX_ORDERS - 1);
      await cmd("HINCRBY", K.day(day), "count", 1);
      await cmd("HINCRBY", K.day(day), "total", order.total);
      await cmd("EXPIRE", K.day(day), 60 * 60 * 24 * 40);
      return true;
    },
    async getDayStats(day) {
      const flat = (await cmd<string[]>("HGETALL", K.day(day))) ?? [];
      const m: Record<string, number> = {};
      for (let i = 0; i < flat.length; i += 2) m[flat[i]] = Number(flat[i + 1]);
      return { count: m.count ?? 0, total: m.total ?? 0 };
    },
    async listOrders(limit) {
      const raw = (await cmd<string[]>("LRANGE", K.orders, 0, limit - 1)) ?? [];
      return raw.flatMap((s) => {
        try { return [JSON.parse(s) as StoredOrder]; } catch { return []; }
      });
    },
    async hit(key, windowSec) {
      const k = K.rl(key);
      const n = await cmd<number>("INCR", k);
      // INCR ile EXPIRE iki ayrı çağrı: EXPIRE düşerse anahtar SÜRESİZ kalır ve kilit hiç
      // kalkmaz (sahip panelden kalıcı kilitlenir). Süre yoksa (-1) her denemede yeniden kur.
      if (n === 1 || (await cmd<number>("TTL", k)) === -1) await cmd("EXPIRE", k, windowSec);
      return n;
    },
    async reset(key) {
      await cmd("DEL", K.rl(key));
    },
  };
}

/* ------------------------------------------------------------------- file */

interface FileShape {
  prices: PriceOverrides;
  ordering: boolean;
  orders: StoredOrder[];
  hits: Record<string, { n: number; until: number }>;
  days: Record<string, { count: number; total: number }>;
}

function fileStore(): AdminStore {
  const file = path.join(process.cwd(), ".data", "admin-store.json");
  const empty = (): FileShape => ({ prices: {}, ordering: true, orders: [], hits: {}, days: {} });

  async function load(): Promise<FileShape> {
    try {
      return { ...empty(), ...(JSON.parse(await fs.readFile(file, "utf8")) as Partial<FileShape>) };
    } catch {
      return empty();
    }
  }
  /* Yazımlar tek kuyrukta: iki istek aynı anda oku-değiştir-yaz yaparsa biri ötekini ezer. */
  let queue: Promise<unknown> = Promise.resolve();
  function mutate<T>(fn: (d: FileShape) => T): Promise<T> {
    const run = queue.then(async () => {
      const d = await load();
      const out = fn(d);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(d, null, 2));
      return out;
    });
    queue = run.catch(() => {});
    return run;
  }
  const live = (h: FileShape["hits"][string] | undefined) => (h && h.until > Date.now() ? h.n : 0);

  return {
    kind: "file",
    async getPrices() { return (await load()).prices; },
    setPrice: (slug, price) => mutate((d) => { d.prices[slug] = price; }),
    async getOrderingEnabled() { return (await load()).ordering; },
    setOrderingEnabled: (enabled) => mutate((d) => { d.ordering = enabled; }),
    addOrder: (order, day) => mutate((d) => {
      if (d.orders.some((o) => o.id === order.id)) return false;
      d.orders.unshift(order);
      d.orders = d.orders.slice(0, MAX_ORDERS);
      const g = (d.days[day] ??= { count: 0, total: 0 });
      g.count += 1;
      g.total += order.total;
      return true;
    }),
    async getDayStats(day) { return (await load()).days[day] ?? { count: 0, total: 0 }; },
    async listOrders(limit) { return (await load()).orders.slice(0, limit); },
    hit: (key, windowSec) => mutate((d) => {
      const n = live(d.hits[key]) + 1;
      d.hits[key] = { n, until: n === 1 ? Date.now() + windowSec * 1000 : d.hits[key].until };
      return n;
    }),
    reset: (key) => mutate((d) => { delete d.hits[key]; }),
  };
}

/* ------------------------------------------------------------------- none */

const noneStore: AdminStore = {
  kind: "none",
  async getPrices() { return {}; },
  async setPrice() { throw new StoreNotConfigured(); },
  async getOrderingEnabled() { return true; },
  async setOrderingEnabled() { throw new StoreNotConfigured(); },
  async addOrder() { throw new StoreNotConfigured(); },
  async listOrders() { return []; },
  async getDayStats() { return { count: 0, total: 0 }; },
  async hit() { return 0; },
  async reset() {},
};

/* ----------------------------------------------------------------- seçici */

let cached: AdminStore | null = null;

export function getStore(): AdminStore {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  const pg = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  // `ADMIN_STORE=file` her şeyin ÖNÜNDE: yerel testte ortamda bir DATABASE_URL dursa bile
  // test gerçek veritabanına yazmasın.
  if (process.env.ADMIN_STORE === "file") cached = fileStore();
  else if (url && token) cached = redisStore(url.replace(/\/+$/, ""), token);
  else if (pg) cached = postgresStore(pg, process.env.ADMIN_PG_PREFIX ?? "manch_");
  else if (process.env.NODE_ENV !== "production") cached = fileStore();
  else cached = noneStore;
  return cached;
}
