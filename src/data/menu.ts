// Tek doğruluk kaynağı: menü sadece burada (Kural 6). Basılı menüden birebir (docs/source/menu-print.png, 2026-09-17).
// Fiyatlar TL. `price: null` → menüde fiyat yok (Crispy Triangle).

import type { Locale } from "@/i18n/routing";

export type Localized = Record<Locale, string>;

export type CategoryId = "burgers" | "sauces" | "extras" | "fries" | "snacks" | "dessert";

export type Tag = "spicy" | "new" | "signature";

export type Spice = "mild" | "medium" | "hot";

export interface Category {
  id: CategoryId;
  name: Localized;
  /** kategori kapak görseli (/menu başlığı) */
  cover?: string;
}

export interface Product {
  slug: string;
  category: CategoryId;
  name: Localized;
  desc: Localized;
  ingredients: Record<Locale, string[]>;
  /** TL — null: menüde fiyat yok */
  price: number | null;
  tags: Tag[];
  /** `/burgers/<slug>.png` (şeffaf kesit) veya `/images/*.jpg` — null: Placeholder (Kural 7) */
  image: string | null;
  quick: {
    /** dakika */
    time: number;
    bun: Localized;
    patty: Localized;
    spice: Spice;
  };
  /** Ana sayfa "The Hits" (6 ürün) */
  featured?: boolean;
}

export const categories: Category[] = [
  { id: "burgers", name: { tr: "Burgers", en: "Burgers" } },
  { id: "sauces", name: { tr: "Soslar", en: "Sauces" } },
  { id: "extras", name: { tr: "Extras", en: "Extras" } },
  { id: "fries", name: { tr: "Fries", en: "Fries" } },
  { id: "snacks", name: { tr: "Atıştırmalıklar", en: "Snacks" }, cover: "/images/crispy-triangle.jpg" },
  { id: "dessert", name: { tr: "Tatlı", en: "Dessert" }, cover: "/images/tiramisu.jpg" },
];

const BRIOCHE: Localized = { tr: "El yapımı brioche", en: "Handmade brioche" };
const DOUBLE: Localized = { tr: "2 × 60 g dana", en: "2 × 60 g beef" };
const CHICKEN: Localized = { tr: "Çıtır tavuk", en: "Crispy chicken" };
const NONE: Localized = { tr: "—", en: "—" };
const SERVED: Localized = {
  tr: "El yapımı brioche ekmeği, el yapımı patates kızartması ile servis edilir.",
  en: "Handmade brioche bun, served with handmade fries.",
};

const burger = (
  slug: string,
  name: string,
  price: number,
  tr: string[],
  en: string[],
  opts: { tags?: Tag[]; image?: boolean; time?: number; spice?: Spice; featured?: boolean; desc?: Localized; patty?: Localized } = {},
): Product => ({
  slug,
  category: "burgers",
  name: { tr: name, en: name },
  desc: opts.desc ?? SERVED,
  ingredients: { tr, en },
  price,
  tags: opts.tags ?? [],
  image: opts.image === false ? null : `/burgers/${slug}.png`,
  quick: { time: opts.time ?? 12, bun: BRIOCHE, patty: opts.patty ?? DOUBLE, spice: opts.spice ?? "mild" },
  featured: opts.featured,
});

const simple = (
  slug: string,
  category: CategoryId,
  name: Localized,
  price: number | null,
  desc: Localized,
  ingredients: Record<Locale, string[]> = { tr: [], en: [] },
  image: string | null = null,
  time = 5,
): Product => ({
  slug,
  category,
  name,
  desc,
  ingredients,
  price,
  tags: [],
  image,
  quick: { time, bun: NONE, patty: NONE, spice: "mild" },
});

export const products: Product[] = [
  // ---------- BURGERS ----------
  burger("classic-manch", "Classic Manch Burger", 570,
    ["2 adet 60 gr burger köftesi", "Manch sos", "Iceberg marul", "Salatalık turşusu", "Cheddar peyniri"],
    ["2 × 60 g smash patties", "Manch sauce", "Iceberg lettuce", "Pickled cucumber", "Cheddar"],
    { tags: ["signature"], featured: true, desc: { tr: "Tarzına yakışan smash! El yapımı brioche + el yapımı patates kızartması ile.", en: "A smash that suits your style. Handmade brioche + handmade fries." } }),
  burger("truffle-manch", "Truffle Manch Burger", 730,
    ["2 adet 60 gr burger köftesi", "Truffle aioli", "Çıtır soğan", "Cheddar peyniri"],
    ["2 × 60 g smash patties", "Truffle aioli", "Crispy onions", "Cheddar"],
    { tags: ["signature"], featured: true, time: 13 }),
  burger("chilli-manch", "Chilli Manch Burger", 590,
    ["2 adet 60 gr burger köftesi", "Chili aioli", "Jalapeno turşusu", "Cheddar peyniri"],
    ["2 × 60 g smash patties", "Chili aioli", "Pickled jalapeños", "Cheddar"],
    { tags: ["spicy"], featured: true, spice: "hot" }),
  burger("fig-jam", "Fig Jam Burger", 650,
    ["2 adet 60 gr burger köftesi", "Roquefort aioli", "İncir reçeli", "Kuzu kulağı", "Cheddar peyniri"],
    ["2 × 60 g smash patties", "Roquefort aioli", "Fig jam", "Sorrel", "Cheddar"],
    { tags: ["signature"], featured: true, time: 13 }),
  burger("manch-tiftik", "Manch Tiftik Burger", 790,
    ["2 adet 60 gr burger köftesi", "Manch sos", "Cheddar peyniri", "Ağır ateşte pişmiş tiftik kaburga"],
    ["2 × 60 g smash patties", "Manch sauce", "Cheddar", "Slow-cooked pulled short rib"],
    { tags: ["new"], featured: true, time: 15 }),
  burger("guacamole", "Guacamole Burger", 690,
    ["2 adet 60 gr burger köftesi", "Romesco aioli", "Guacamole", "Cheddar peyniri", "Çıtır kapari"],
    ["2 × 60 g smash patties", "Romesco aioli", "Guacamole", "Cheddar", "Crispy capers"],
    { image: false, time: 13 }),
  burger("morel", "Morel Burger", 790,
    ["2 adet 60 gr burger köftesi", "Manch sos", "Karamelize morel ve portobello mantarı", "Cheddar peyniri"],
    ["2 × 60 g smash patties", "Manch sauce", "Caramelized morel & portobello mushrooms", "Cheddar"],
    { tags: ["signature"], featured: true, time: 15 }),
  burger("chicken-manch", "Chicken Manch Burger", 430,
    ["Çıtır tavuk", "Ranch aioli", "Iceberg marul", "Salatalık turşusu"],
    ["Crispy chicken", "Ranch aioli", "Iceberg lettuce", "Pickled cucumber"],
    { patty: CHICKEN, time: 12 }),

  // ---------- SOSLAR ----------
  simple("ranch-sauce", "sauces", { tr: "Ranch Sauce", en: "Ranch Sauce" }, 40, { tr: "Ekstra sos.", en: "Extra sauce." }),
  simple("garlic-aioli", "sauces", { tr: "Sarımsaklı Aioli", en: "Garlic Aioli" }, 40, { tr: "Ekstra sos.", en: "Extra sauce." }),
  simple("manch-sauce", "sauces", { tr: "Manch Sos", en: "Manch Sauce" }, 40, { tr: "Evin sosu. Hazır soslara biraz uzağız.", en: "The house sauce. We like our sauces handmade." }),
  simple("truffle-aioli", "sauces", { tr: "Trüf Aioli", en: "Truffle Aioli" }, 45, { tr: "Ekstra sos.", en: "Extra sauce." }),
  simple("chilli-aioli", "sauces", { tr: "Chilli Aioli", en: "Chilli Aioli" }, 45, { tr: "Ekstra sos.", en: "Extra sauce." }),
  simple("roquefort-aioli", "sauces", { tr: "Rokfor Aioli", en: "Roquefort Aioli" }, 45, { tr: "Ekstra sos.", en: "Extra sauce." }),

  // ---------- EXTRAS ----------
  simple("extra-tiftik", "extras", { tr: "Tiftik Kaburga", en: "Pulled Short Rib" }, 180, { tr: "Burgerine ekle.", en: "Add to your burger." }),
  simple("extra-smash", "extras", { tr: "Smash Et", en: "Extra Smash Patty" }, 180, { tr: "Burgerine ekle.", en: "Add to your burger." }),
  simple("extra-truffle-parmesan", "extras", { tr: "Truffle Parmesan", en: "Truffle Parmesan" }, 90, { tr: "Burgerine ekle.", en: "Add to your burger." }),
  simple("extra-cheddar", "extras", { tr: "Cheddar", en: "Cheddar" }, 35, { tr: "Burgerine ekle.", en: "Add to your burger." }),

  // ---------- FRIES ----------
  simple("classic-fries", "fries", { tr: "Classic Manch Fries", en: "Classic Manch Fries" }, 160, { tr: "El yapımı patates kızartması.", en: "Handmade fries." }, { tr: ["Patates"], en: ["Potatoes"] }, null, 6),
  simple("truffle-fries", "fries", { tr: "Truffle Manch Fries", en: "Truffle Manch Fries" }, 260, { tr: "El yapımı patates, trüf ve parmesan.", en: "Handmade fries, truffle and parmesan." }, { tr: ["Patates", "Trüf", "Parmesan"], en: ["Potatoes", "Truffle", "Parmesan"] }, null, 7),

  // ---------- ATIŞTIRMALIKLAR ----------
  simple("corn-ribs", "snacks", { tr: "Corn Ribs", en: "Corn Ribs" }, 290, { tr: "Garlic aioli ile servis edilir.", en: "Served with garlic aioli." }, { tr: ["Mısır", "Garlic aioli"], en: ["Corn", "Garlic aioli"] }, null, 8),
  simple("chicken-tenders", "snacks", { tr: "Crispy Chicken Tenders", en: "Crispy Chicken Tenders" }, 290, { tr: "Ranch aioli ile servis edilir.", en: "Served with ranch aioli." }, { tr: ["Çıtır tavuk", "Ranch aioli"], en: ["Crispy chicken", "Ranch aioli"] }, null, 8),
  simple("mushroom-arancini", "snacks", { tr: "6 Mantarlı Arancini", en: "Six-Mushroom Arancini" }, 360,
    { tr: "Parmesan peyniri ile servis edilir. Kültür, shiitake, morel, portobello, istiridye ve trüf mantarı içermektedir. Porsiyonda 2 adet bulunur.", en: "Served with parmesan. Button, shiitake, morel, portobello, oyster and truffle mushrooms. Two per portion." },
    { tr: ["Kültür mantarı", "Shiitake", "Morel", "Portobello", "İstiridye mantarı", "Trüf", "Parmesan"], en: ["Button mushroom", "Shiitake", "Morel", "Portobello", "Oyster mushroom", "Truffle", "Parmesan"] }, null, 10),
  simple("crispy-triangle", "snacks", { tr: "Crispy Triangle", en: "Crispy Triangle" }, null, { tr: "Good things come in triangles. Parmesan ve dip sos ile.", en: "Good things come in triangles. With parmesan and dip." }, { tr: ["Çıtır üçgen", "Parmesan", "Dip sos"], en: ["Crispy triangles", "Parmesan", "Dip"] }, "/images/crispy-triangle.jpg", 8),

  // ---------- TATLI ----------
  simple("tiramisu", "dessert", { tr: "Tiramisu", en: "Tiramisu" }, 360, { tr: "Tiramisu konusunda biraz iddialıyız. Gerçek mascarpone.", en: "We take tiramisu seriously. Real mascarpone." }, { tr: ["Mascarpone", "Kahve", "Kakao"], en: ["Mascarpone", "Coffee", "Cocoa"] }, "/images/tiramisu.jpg", 2),
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getFeatured(): Product[] {
  return products.filter((p) => p.featured);
}

export function getProductsByCategory(category: CategoryId): Product[] {
  return products.filter((p) => p.category === category);
}
