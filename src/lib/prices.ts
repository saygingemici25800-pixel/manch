import { products } from "@/data/menu";

/**
 * Etkin fiyat tablosu: slug → fiyat (`null` = "YAKINDA", sipariş edilemez).
 *
 * Kaynak sırası: **panel ezmesi** varsa o, yoksa `menu.ts`. Ürünün adı, açıklaması,
 * görseli menu.ts'te kalır — panel yalnız fiyata dokunur (karar 2026-11-13, kullanıcı:
 * "menü fiyat yeterli şu an").
 *
 * Bu modül istemci ve sunucu ortaktır; depo okuması `menu-prices.ts`'te (yalnız sunucu).
 */
export type PriceMap = Record<string, number | null>;

export function mergePrices(overrides: Record<string, number | null>): PriceMap {
  const out: PriceMap = {};
  for (const p of products) out[p.slug] = p.slug in overrides ? overrides[p.slug] : p.price;
  return out;
}

/** JSON-LD `priceRange` — ETKİN fiyatlardan (panelde değişen fiyat Google'a da yansır). */
export function priceRangeOf(prices: PriceMap): { min: number; max: number } | null {
  const v = Object.values(prices).filter((n): n is number => n != null);
  return v.length ? { min: Math.min(...v), max: Math.max(...v) } : null;
}

/**
 * Fiyat tablosunun kısa sürüm imzası (FNV-1a). Sunucu `/api/order-status` cevabında
 * gönderir; istemci kendi tablosunun imzasıyla karşılaştırır. Farklıysa sekme panelden
 * önce açılmış demektir → sayfa verisi tazelenir, gönder o sırada kapalı tutulur. Böylece
 * WhatsApp mesajındaki tutar ile panel kaydındaki tutar AYRIŞAMAZ.
 */
export function priceVersion(prices: PriceMap): string {
  const s = JSON.stringify(Object.keys(prices).sort().map((k) => [k, prices[k]]));
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
