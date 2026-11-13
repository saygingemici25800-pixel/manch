/**
 * Sipariş gönderme **adaptörü** — tek dışa açık yol (Kural 66).
 *
 * Bugün iki iş yapar:
 *   ① siparişi **panele kaydeder** (`POST /api/orders`) — sahip "sipariş akışını" görür
 *   ② **WhatsApp**'ı açar — sipariş yine oradan yürür; mesajda **sipariş no** vardır,
 *      sahip WhatsApp'taki mesajı paneldeki kayıtla eşleştirir
 *
 * Tüketiciler (site sepeti, Zone sipariş tahtası) yalnız `orderChannel()` /
 * `submitOrder()` çağırır; "WhatsApp" kelimesini de kayıt adresini de bilmez.
 *
 * Sipariş durumu (açık/kapalı) ve etkin fiyatlar DIŞARIDAN verilir — adaptör React'e
 * bağımlı değil, sunucu otoritesini kendisi çağırmaz.
 */
import { getProduct } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import type { CartLine } from "@/lib/cart-store";
import type { OrderStatus } from "@/lib/order/status-core";
import type { PriceMap } from "@/lib/prices";
import { site } from "@/lib/site";

/** Çeviri erişimi dışarıdan verilir: adaptör React'e bağımlı değil, anahtarları kendi seçer. */
export type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface OrderChannel {
  /** Şu an gönderilebilir mi? (numara var VE sipariş açık) */
  available: boolean;
  /** Gönder düğmesinin metin anahtarı — bileşene gömülmez. */
  labelKey: string;
  /** Kapalıysa kullanıcıya gösterilecek açıklama (anahtar + değerler); açıksa null. */
  notice: { key: string; values?: Record<string, string> } | null;
}

export type OrderResult =
  | { ok: true; id: string }
  | { ok: false; reason: "empty" | "unavailable" | "closed" | "unpriced" | "stale" };

/** Sepetle ilgili kapı bilgisi — verilmezse yalnız sipariş durumuna bakılır. */
export interface CartContext {
  lines: CartLine[];
  prices: PriceMap;
  /** Sekmedeki fiyat tablosu sunucununkinden eski mi (panel arada değiştirdi). */
  pricesStale: boolean;
}

/** Sepette fiyatı artık olmayan (panelden "YAKINDA" yapılmış) satırlar. */
export function unpricedLines(lines: CartLine[], prices: PriceMap): CartLine[] {
  return lines.filter((l) => prices[l.slug] == null);
}

/**
 * Gönder açık mı, değilse NEDEN. Öncelik: sipariş kapalı → fiyatlar tazeleniyor →
 * sepette satıştan kalkmış ürün. Son ikisi inceleme bulgusu (2026-11-13): fiyatsız satır
 * varken gönderim açıktı, kayıt 400 ile tümden düşüyor ama WhatsApp yine gidiyordu; bayat
 * sekmede de WhatsApp tutarı ile panel kaydı ayrışıyordu.
 */
export function orderChannel(status: OrderStatus, cart?: CartContext): OrderChannel {
  const hasNumber = Boolean(site.contact.whatsapp);
  if (!status.open) {
    return {
      available: false,
      labelKey: "Order.closed",
      notice:
        status.reason === "hours" && status.opensAt
          ? { key: status.opensToday ? "Order.opensToday" : "Order.opensTomorrow", values: { time: status.opensAt } }
          : { key: "Order.pausedNow" },
    };
  }
  if (cart?.pricesStale) {
    return { available: false, labelKey: "Order.send", notice: { key: "Order.pricesUpdating" } };
  }
  const yok = cart ? unpricedLines(cart.lines, cart.prices).length : 0;
  if (yok > 0) {
    return { available: false, labelKey: "Order.send", notice: { key: "Order.unpricedLines", values: { n: String(yok) } } };
  }
  return { available: hasNumber, labelKey: "Order.send", notice: null };
}

/**
 * Sepet satırlarının toplam tutarı — **etkin** fiyatlarla (panel ezmesi dahil).
 * Fiyatı bilinmeyen ürün toplama girmez; arayüz zaten sepete eklettirmiyor.
 */
export function orderTotal(lines: CartLine[], prices: PriceMap): number {
  return lines.reduce((sum, l) => {
    const price = prices[l.slug];
    return price == null ? sum : sum + price * l.qty;
  }, 0);
}

/** Karışmayan harflerle 6 karakter (0/O, 1/I/L yok) — telefonda okunup yazılabilsin. */
function newOrderId(): string {
  const ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => ABC[b % ABC.length]).join("");
}

function buildMessage(id: string, lines: CartLine[], locale: Locale, t: Translate, prices: PriceMap): string {
  return [
    t("Order.intro"),
    ...lines.map((l) => {
      const p = getProduct(l.slug);
      const price = prices[l.slug];
      return `• ${l.qty}× ${p?.name[locale] ?? l.slug}${price != null ? ` — ${price * l.qty} TL` : ""}`;
    }),
    t("Order.total", { total: orderTotal(lines, prices) }),
    t("Order.ref", { id }),
  ].join("\n");
}

/**
 * Siparişi gönderir. SIRA ÖNEMLİ:
 *   · Kayıt isteği `keepalive` ile ateşlenir ve **beklenmez** — sekme WhatsApp'a geçse de
 *     tamamlanır. Sunucu kapalı saatte kaydı reddeder, fiyatı kendisi yeniden hesaplar
 *     (istemcinin yolladığı tutara güvenilmez).
 *   · WhatsApp penceresi **senkron** açılır. `await`'ten sonra açılan pencere mobil
 *     Safari'de açılır pencere engelleyicisine takılır — sipariş hiç gitmezdi.
 */
export function submitOrder(
  lines: CartLine[],
  locale: Locale,
  t: Translate,
  prices: PriceMap,
  status: OrderStatus,
): OrderResult {
  if (lines.length === 0) return { ok: false, reason: "empty" };
  if (!status.open) return { ok: false, reason: "closed" };
  if (unpricedLines(lines, prices).length > 0) return { ok: false, reason: "unpriced" };
  const number = site.contact.whatsapp;
  if (!number) return { ok: false, reason: "unavailable" };

  const id = newOrderId();
  try {
    void fetch("/api/orders", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, locale, lines: lines.map(({ slug, qty }) => ({ slug, qty })) }),
    }).catch(() => {});
  } catch {
    /* kayıt isteğe bağlı — WhatsApp yine açılır */
  }

  const url = `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
    buildMessage(id, lines, locale, t, prices),
  )}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return { ok: true, id };
}

// Dev/QA: sabotaj ve uçtan uca kontroller adaptörü buradan görür.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__ORDER__ = { orderChannel, orderTotal };
}
