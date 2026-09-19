// Tek doğruluk kaynağı: menü sadece burada (Kural 6). Basılı menüden birebir (docs/source/menu-print.png, 2026-09-17).
// Fiyatlar TL. `price: null` → menüde fiyat yok (Crispy Triangle).

import type { Locale } from "@/i18n/routing";

export type Localized = Record<Locale, string>;

export type CategoryId = "burgers" | "sauces" | "extras" | "fries" | "snacks" | "dessert" | "drinks";

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
  { id: "drinks", name: { tr: "İçecekler", en: "Drinks" } },
  { id: "dessert", name: { tr: "Tatlı", en: "Dessert" }, cover: "/images/tiramisu.jpg" },
];

const BRIOCHE: Localized = { tr: "El yapımı brioche", en: "Handmade brioche" };
const DOUBLE: Localized = { tr: "2 × 60 g dana", en: "2 × 60 g beef" };
const CHICKEN: Localized = { tr: "Çıtır tavuk", en: "Crispy chicken" };
const NONE: Localized = { tr: "—", en: "—" };
/** Ürün açıklamaları — müşteri onayı bekliyor; kayıt: `src/content-status.ts`. */
const DESC: Record<string, Localized> = {
  "classic-manch": { tr: "Tarzına yakışan smash. Fazlası yok, eksiği hiç yok.", en: "The smash that suits you. Nothing extra, nothing missing." },
  "truffle-manch": { tr: "Trüf konusunda ölçüyü biraz kaçırdık. Pişman değiliz.", en: "We may have overdone the truffle. No regrets." },
  "chilli-manch": { tr: "Acı değil, karakter. Yine de su bulundur.", en: "Not spicy, characterful. Still, keep water nearby." },
  "fig-jam": { tr: "İncir reçeli, rokfor ve kuzu kulağı. Tatlıyla keskinin ortak noktası.", en: "Fig jam, roquefort and sorrel. Where sweet and sharp meet." },
  "manch-tiftik": { tr: "Saatlerce pişen tiftik kaburga. Sabrın tadı bu.", en: "Short rib, pulled after hours of patience. Worth the wait." },
  "guacamole": { tr: "Avokado burada süs değil, ana karakter.", en: "The avocado isn't a garnish here. It's the lead." },
  "morel": { tr: "Portobello ve karamelize morel. Menünün en sessiz, en iddialı ürünü.", en: "Portobello and caramelised morel. The quietest, boldest thing on the menu." },
  "chicken-manch": { tr: "Çıtır dışı, sulu içi. Tavuk tarafının en iyisi.", en: "Crispy outside, juicy inside. Team chicken's finest." },
  "ranch-sauce": { tr: "Klasik ranch. Çıtır olan her şeyin yanına.", en: "Classic ranch. Goes with anything crispy." },
  "garlic-aioli": { tr: "Sarımsak konusunda çekingen değiliz.", en: "We're not shy about garlic." },
  "manch-sauce": { tr: "Tarifini sormayın. Mutfakta kendimiz yapıyoruz.", en: "Don't ask for the recipe. We make it in house." },
  "truffle-aioli": { tr: "Patatesi ciddiye alanlar için.", en: "For people who take fries seriously." },
  "chilli-aioli": { tr: "Tatlı başlar, ateşli biter.", en: "Starts sweet, ends warm." },
  "roquefort-aioli": { tr: "Rokfor sevenler bilir. Sevmeyenler denememiştir.", en: "Roquefort lovers know. The rest haven't tried it." },
  "extra-tiftik": { tr: "Burgerine saatlerce pişmiş tiftik kaburga ekle.", en: "Add slow-cooked pulled short rib." },
  "extra-smash": { tr: "Bir köfte daha. Kimse yargılamıyor.", en: "One more patty. Nobody's judging." },
  "extra-truffle-parmesan": { tr: "Trüf ve parmesan. Patatesin üst sınıfa geçişi.", en: "Truffle and parmesan. Fries, upgraded." },
  "extra-cheddar": { tr: "Bir dilim daha cheddar. Yer çekimi onaylı.", en: "One more slice of cheddar. Gravity approved." },
  "classic-fries": { tr: "El yapımı, çıtır kenarlı. Paylaşmayı planlama.", en: "Handmade, crisp at the edges. Don't plan on sharing." },
  "truffle-fries": { tr: "Patates mi trüf mü, karar veremeyeceksin.", en: "Fries or truffle? You won't decide." },
  "corn-ribs": { tr: "Mısır, ama alıştığın gibi değil.", en: "Corn, but not the way you know it." },
  "chicken-tenders": { tr: "Çıtırlık seviyesi biraz kontrolden çıkmış olabilir.", en: "Crispiness levels may have gotten out of control." },
  "mushroom-arancini": { tr: "Altı adet mantarlı arancini. Beşte durabilirsin. Duramazsın.", en: "Six mushroom arancini. You could stop at five. You won't." },
  "crispy-triangle": { tr: "Basılı menüde yok, Instagram'da efsane.", en: "Not on the printed menu. A legend online." },
  "limonata": { tr: "Ev yapımı limonata. Smash'in yanına.", en: "Homemade lemonade. Alongside the smash." },
  "soft-drink": { tr: "Soğuk soft drink.", en: "Cold soft drink." },
  "ayran": { tr: "Ayran. Tartışma yok.", en: "Ayran. No debate." },
  "tiramisu": { tr: "Tiramisu konusunda biraz iddialıyız. Gerçek mascarpone.", en: "We take tiramisu seriously. Real mascarpone." },
};

const burger = (
  slug: string,
  name: string,
  price: number,
  tr: string[],
  en: string[],
  opts: { tags?: Tag[]; image?: boolean; time?: number; spice?: Spice; featured?: boolean; patty?: Localized } = {},
): Product => ({
  slug,
  category: "burgers",
  name: { tr: name, en: name },
  desc: DESC[slug],
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
  ingredients: Record<Locale, string[]> = { tr: [], en: [] },
  image: string | null = null,
  time = 5,
): Product => ({
  slug,
  category,
  name,
  desc: DESC[slug],
  ingredients,
  price,
  tags: [],
  image,
  quick: { time, bun: NONE, patty: NONE, spice: "mild" },
});

export const products: Product[] = [
  // ---------- BURGERS ----------
  burger("classic-manch", "Classic Manch Burger", 570,
    ["Iceberg", "Salatalık turşusu", "Manch sos", "Cheddar", "120 gr köfte", "El yapımı brioche"],
    ["Iceberg", "Pickled cucumber", "Manch sauce", "Cheddar", "120 g patty", "Handmade brioche"],
    { tags: ["signature"], featured: true }),
  burger("truffle-manch", "Truffle Manch Burger", 730,
    ["Truffle aioli", "Çıtır soğan", "Cheddar", "120 gr köfte", "El yapımı brioche"],
    ["Truffle aioli", "Crispy onions", "Cheddar", "120 g patty", "Handmade brioche"],
    { tags: ["signature"], featured: true, time: 13 }),
  burger("chilli-manch", "Chilli Manch Burger", 590,
    ["Jalapeño turşusu", "Chili aioli", "Cheddar", "120 gr köfte", "El yapımı brioche"],
    ["Pickled jalapeños", "Chili aioli", "Cheddar", "120 g patty", "Handmade brioche"],
    { tags: ["spicy"], featured: true, spice: "hot" }),
  burger("fig-jam", "Fig Jam Burger", 650,
    ["İncir reçeli", "Roquefort aioli", "Kuzu kulağı", "Cheddar", "120 gr köfte", "El yapımı brioche"],
    ["Fig jam", "Roquefort aioli", "Sorrel", "Cheddar", "120 g patty", "Handmade brioche"],
    { tags: ["signature"], featured: true, time: 13 }),
  burger("manch-tiftik", "Manch Tiftik Burger", 790,
    ["Ağır ateşte pişmiş kaburga", "Manch sos", "Cheddar", "120 gr köfte", "El yapımı brioche"],
    ["Slow-cooked short rib", "Manch sauce", "Cheddar", "120 g patty", "Handmade brioche"],
    { tags: ["new"], featured: true, time: 15 }),
  burger("guacamole", "Guacamole Burger", 690,
    ["2 adet 60 gr burger köftesi", "Romesco aioli", "Guacamole", "Cheddar peyniri", "Çıtır kapari"],
    ["2 × 60 g smash patties", "Romesco aioli", "Guacamole", "Cheddar", "Crispy capers"],
    { image: false, time: 13 }),
  burger("morel", "Morel Burger", 790,
    ["Portobello mantarı", "Karamelize morel", "Manch sos", "120 gr köfte", "El yapımı brioche"],
    ["Portobello mushroom", "Caramelised morel", "Manch sauce", "120 g patty", "Handmade brioche"],
    { tags: ["signature"], featured: true, time: 15 }),
  burger("chicken-manch", "Chicken Manch Burger", 430,
    ["Çıtır tavuk", "Ranch aioli", "Salatalık turşusu", "Iceberg", "El yapımı brioche"],
    ["Crispy chicken", "Ranch aioli", "Pickled cucumber", "Iceberg", "Handmade brioche"],
    { patty: CHICKEN, time: 12 }),

  // ---------- SOSLAR ----------
  simple("ranch-sauce", "sauces", { tr: "Ranch Sauce", en: "Ranch Sauce" }, 40),
  simple("garlic-aioli", "sauces", { tr: "Sarımsaklı Aioli", en: "Garlic Aioli" }, 40),
  simple("manch-sauce", "sauces", { tr: "Manch Sos", en: "Manch Sauce" }, 40),
  simple("truffle-aioli", "sauces", { tr: "Trüf Aioli", en: "Truffle Aioli" }, 45),
  simple("chilli-aioli", "sauces", { tr: "Chilli Aioli", en: "Chilli Aioli" }, 45),
  simple("roquefort-aioli", "sauces", { tr: "Rokfor Aioli", en: "Roquefort Aioli" }, 45),

  // ---------- EXTRAS ----------
  simple("extra-tiftik", "extras", { tr: "Tiftik Kaburga", en: "Pulled Short Rib" }, 180),
  simple("extra-smash", "extras", { tr: "Smash Et", en: "Extra Smash Patty" }, 180),
  simple("extra-truffle-parmesan", "extras", { tr: "Truffle Parmesan", en: "Truffle Parmesan" }, 90),
  simple("extra-cheddar", "extras", { tr: "Cheddar", en: "Cheddar" }, 35),

  // ---------- FRIES ----------
  simple("classic-fries", "fries", { tr: "Classic Manch Fries", en: "Classic Manch Fries" }, 160, { tr: ["Patates"], en: ["Potatoes"] }, null, 6),
  simple("truffle-fries", "fries", { tr: "Truffle Manch Fries", en: "Truffle Manch Fries" }, 260, { tr: ["Patates", "Trüf", "Parmesan"], en: ["Potatoes", "Truffle", "Parmesan"] }, null, 7),

  // ---------- ATIŞTIRMALIKLAR ----------
  simple("corn-ribs", "snacks", { tr: "Corn Ribs", en: "Corn Ribs" }, 290, { tr: ["Mısır", "Garlic aioli"], en: ["Corn", "Garlic aioli"] }, null, 8),
  simple("chicken-tenders", "snacks", { tr: "Crispy Chicken Tenders", en: "Crispy Chicken Tenders" }, 290, { tr: ["Çıtır tavuk", "Ranch aioli"], en: ["Crispy chicken", "Ranch aioli"] }, null, 8),
  simple("mushroom-arancini", "snacks", { tr: "6 Mantarlı Arancini", en: "Six-Mushroom Arancini" }, 360,
    { tr: ["Kültür mantarı", "Shiitake", "Morel", "Portobello", "İstiridye mantarı", "Trüf", "Parmesan"], en: ["Button mushroom", "Shiitake", "Morel", "Portobello", "Oyster mushroom", "Truffle", "Parmesan"] }, null, 10),
  simple("crispy-triangle", "snacks", { tr: "Crispy Triangle", en: "Crispy Triangle" }, null, { tr: ["Çıtır üçgen", "Parmesan", "Dip sos"], en: ["Crispy triangles", "Parmesan", "Dip"] }, "/images/crispy-triangle.jpg", 8),

  // ---------- İÇECEKLER ----------
  // Fiyatlar TEYİT BEKLİYOR — örnek değer (spec 6.3). `Menu.disclaimer` sitede zaten görünür.
  simple("limonata", "drinks", { tr: "Limonata", en: "Lemonade" }, null, { tr: ["Limon", "Şeker", "Su"], en: ["Lemon", "Sugar", "Water"] }, null, 3),
  simple("soft-drink", "drinks", { tr: "Soft Drink", en: "Soft Drink" }, null, { tr: [], en: [] }, null, 1),
  simple("ayran", "drinks", { tr: "Ayran", en: "Ayran" }, null, { tr: [], en: [] }, null, 1),

  // ---------- TATLI ----------
  simple("tiramisu", "dessert", { tr: "Tiramisu", en: "Tiramisu" }, 360, { tr: ["Mascarpone", "Kahve", "Kakao"], en: ["Mascarpone", "Coffee", "Cocoa"] }, "/images/tiramisu.jpg", 2),
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
