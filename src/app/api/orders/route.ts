import { getProduct } from "@/data/menu";
import { istanbulDay } from "@/lib/hours";
import { getEffectivePrices } from "@/lib/menu-prices";
import { clockFrom, getOrderStatus } from "@/lib/order/status";
import { clientIp } from "@/lib/request-ip";
import { getStore, type OrderItem, type StoredOrder } from "@/lib/store";

/**
 * Sitenin gönderdiği sepeti panele KAYDEDER. Sipariş yine WhatsApp'tan yürür; bu kayıt
 * sahibin "sipariş akışını" görmesi için.
 *
 * GÜVEN SINIRI — istemciden gelen hiçbir şeye güvenilmez:
 *   · tutar istemciden ALINMAZ, sunucu etkin fiyatlarla yeniden hesaplar
 *   · ürün adı istemciden alınmaz, menu.ts'ten okunur (panele zararlı metin sızamaz)
 *   · bilinmeyen ürün / fiyatsız ürün / geçersiz adet → 400
 *   · sipariş kapalıyken (elle ya da saat) → 409, kayıt yazılmaz
 *   · IP başına 10 dk'da 20, TÜM IP'ler toplamı 10 dk'da 80 kayıt (panel sahte kayıtla
 *     boğulmasın; küresel sınır IP döndürmeye karşı — gerçek hacmin çok üstünde)
 *   · sipariş başına toplam adet ≤ 60 (ciro sayacı uydurma büyük siparişle şişmesin)
 * Kişisel veri YOK: ad, telefon, adres, IP kayda yazılmaz (KVKK yükü doğmasın).
 */
export const dynamic = "force-dynamic";

const ID = /^[A-Z0-9]{6,10}$/;
const MAX_LINES = 40;
const MAX_QTY = 99;
const MAX_ITEMS = 60;

export async function POST(req: Request) {
  const store = getStore();
  if (store.kind === "none") return Response.json({ error: "store" }, { status: 503 });

  // Gövdeyi OKUMADAN önce bildirilen boyuta bak — büyük gövde belleğe alınmasın.
  if (Number(req.headers.get("content-length") ?? 0) > 8_000) return Response.json({ error: "too-large" }, { status: 413 });
  const raw = await req.text();
  if (raw.length > 8_000) return Response.json({ error: "too-large" }, { status: 413 });

  if ((await store.hit(`orders:${clientIp(req.headers)}`, 600)) > 20 || (await store.hit("orders:all", 600)) > 80) {
    return Response.json({ error: "rate" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "json" }, { status: 400 });
  }
  const { id, locale, lines } = (body ?? {}) as { id?: unknown; locale?: unknown; lines?: unknown };
  if (typeof id !== "string" || !ID.test(id)) return Response.json({ error: "id" }, { status: 400 });
  if (locale !== "tr" && locale !== "en") return Response.json({ error: "locale" }, { status: 400 });
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) {
    return Response.json({ error: "lines" }, { status: 400 });
  }

  const status = await getOrderStatus(clockFrom(req));
  if (!status.open) return Response.json({ error: "closed", status }, { status: 409 });

  let prices;
  try {
    prices = await getEffectivePrices();
  } catch {
    // Fiyat okunamadı: menu.ts'e düşüp yanlış tutarla kayıt yazmak yerine reddet.
    return Response.json({ error: "prices" }, { status: 503 });
  }
  const items: OrderItem[] = [];
  for (const l of lines as Array<{ slug?: unknown; qty?: unknown }>) {
    const product = typeof l?.slug === "string" ? getProduct(l.slug) : undefined;
    const qty = l?.qty;
    if (!product || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return Response.json({ error: "line" }, { status: 400 });
    }
    const unit = prices[product.slug];
    if (unit == null) return Response.json({ error: "unpriced", slug: product.slug }, { status: 400 });
    items.push({ slug: product.slug, name: product.name.tr, qty, unit });
  }

  if (items.reduce((n, i) => n + i.qty, 0) > MAX_ITEMS) return Response.json({ error: "too-many" }, { status: 400 });

  const order: StoredOrder = {
    id,
    at: new Date().toISOString(),
    locale,
    items,
    total: items.reduce((s, i) => s + i.unit * i.qty, 0),
  };
  const added = await store.addOrder(order, istanbulDay(new Date()));
  return Response.json({ id, duplicate: !added }, { status: added ? 201 : 200 });
}
