/**
 * Sipariş gönderme **adaptörü** — tek dışa açık yol (Kural 66).
 *
 * Bugünkü gerçeklemesi WhatsApp bağlantısıdır. Yarın işletme sahibiyle konuşulan gerçek
 * sipariş sistemi (veritabanı + panel + kurye bildirimi) geldiğinde **değişmesi gereken tek
 * dosya budur** — sipariş tahtası ve site sepeti değil.
 *
 * Bu yüzden burada tutulanlar:
 *   · kanalın **uygun olup olmadığı** (`orderChannel().available`)
 *   · gönder düğmesinin **metin anahtarı** ("WHATSAPP'TAN GÖNDER" yarın "SİPARİŞİ GÖNDER" olur)
 *   · mesajın **biçimi** ve hangi i18n anahtarlarını kullandığı
 *   · gönderimin **nasıl yürütüldüğü** (bugün: bağlantı açmak)
 *
 * Tüketiciler yalnızca `submitOrder()` çağırır ve sonucu gösterir. Hiçbir tüketici
 * "WhatsApp" kelimesini bilmez.
 */
import { getProduct } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import type { CartLine } from "@/lib/cart-store";
import { site } from "@/lib/site";

/** Çeviri erişimi dışarıdan verilir: adaptör React'e bağımlı değil, anahtarları kendi seçer. */
export type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface OrderChannel {
  /** Kanal şu an sipariş alabiliyor mu? (WhatsApp numarası yoksa hayır.) */
  available: boolean;
  /** Gönder düğmesinin metin anahtarı — bileşene gömülmez. */
  labelKey: string;
}

export type OrderResult =
  | { ok: true }
  | { ok: false; reason: "empty" | "unavailable" };

export function orderChannel(): OrderChannel {
  return {
    available: Boolean(site.contact.whatsapp),
    labelKey: "Order.send",
  };
}

/**
 * Sepet satırlarının toplam tutarı. **Fiyatı bilinmeyen ürün toplama girmez** — uydurma bir
 * rakamla toplamı şişirmektense o satır 0 sayılır (karar 2026-09-18; içecek fiyatları teyit
 * bekliyor). Arayüz zaten böyle bir satırı sepete eklettirmiyor.
 */
export function orderTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => {
    const price = getProduct(l.slug)?.price;
    return price == null ? sum : sum + price * l.qty;
  }, 0);
}

function buildMessage(lines: CartLine[], locale: Locale, t: Translate): string {
  const total = orderTotal(lines);
  return [
    t("Order.intro"),
    ...lines.map((l) => {
      const p = getProduct(l.slug);
      const price = p?.price != null ? ` — ${p.price * l.qty} TL` : "";
      return `• ${l.qty}× ${p?.name[locale] ?? l.slug}${price}`;
    }),
    t("Order.total", { total }),
  ].join("\n");
}

/**
 * Siparişi gönderir. Bugün: WhatsApp bağlantısını yeni sekmede açar.
 * Yarın: sunucuya POST atıp sipariş numarası döndürebilir — imza aynı kalır.
 */
export function submitOrder(lines: CartLine[], locale: Locale, t: Translate): OrderResult {
  if (lines.length === 0) return { ok: false, reason: "empty" };
  const number = site.contact.whatsapp;
  if (!number) return { ok: false, reason: "unavailable" };

  const url = `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
    buildMessage(lines, locale, t),
  )}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return { ok: true };
}

// Dev/QA: sabotaj ve uçtan uca kontroller adaptörü buradan görür.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__ORDER__ = { orderChannel, orderTotal };
}
