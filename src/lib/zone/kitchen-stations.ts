/**
 * Açık mutfağın istasyon içerikleri — **menüden türetilir**, slug listesi gömülmez.
 *
 * · Her ürün tam olarak bir istasyonda (28/28): sipariş tahtasının "hızlı 15'i" değil,
 *   menünün tamamı. Tahta sipariş yüzeyi, mutfak tanıtım yüzeyi.
 * · Tezgâhta 3D olarak duranlar yalnız **gerçek şeffaf kesiti olan** ürünler
 *   (`image` `.png` ile biten). Kesiti olmayan ürün tezgâhta sahte bir görselle
 *   durmaz (karar 2026-11-15) — istasyon tabelasından açılan listede yer alır.
 *   Yeni kesit `public/burgers/` altına girip `menu.ts`'te görsel bağlanınca tezgâha
 *   kendiliğinden çıkar.
 */
import { products, type CategoryId, type Product } from "@/data/menu";
import type { StationId } from "@/lib/zone/kitchen";

const STATION_CATEGORIES: Record<StationId, readonly CategoryId[]> = {
  burgers: ["burgers"],
  sides: ["fries", "snacks", "sauces", "extras"],
  drinks: ["drinks", "dessert"],
};

export function stationProducts(id: StationId): Product[] {
  const cats = STATION_CATEGORIES[id];
  return products
    .filter((p) => cats.includes(p.category))
    .sort((a, b) => cats.indexOf(a.category) - cats.indexOf(b.category));
}

/** Tezgâhta kesitiyle duranlar. Görsel olarak webp (≈45 kB) — PNG 900 kB. */
export const COUNTER_DISHES: readonly { slug: string; url: string }[] = products
  .filter((p) => p.category === "burgers" && p.image?.endsWith(".png"))
  .map((p) => ({ slug: p.slug, url: p.image!.replace(/\.png$/, ".webp") }));

export const stationOf = (slug: string): StationId | null => {
  for (const id of Object.keys(STATION_CATEGORIES) as StationId[]) {
    if (stationProducts(id).some((p) => p.slug === slug)) return id;
  }
  return null;
};
