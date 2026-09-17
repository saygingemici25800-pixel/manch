import type { Locale } from "@/i18n/routing";
import type { Localized } from "@/lib/site";

export const categories = [
  "smash-burgers",
  "chicken",
  "sides",
  "desserts",
  "drinks",
] as const;
export type Category = (typeof categories)[number];

export const categoryNames: Record<Category, Localized> = {
  "smash-burgers": { tr: "Smash Burgerler", en: "Smash Burgers" },
  chicken: { tr: "Tavuk", en: "Chicken" },
  sides: { tr: "Yanına", en: "Sides" },
  desserts: { tr: "Tatlılar", en: "Desserts" },
  drinks: { tr: "İçecekler", en: "Drinks" },
};

export type Tag = "signature" | "new" | "spicy";

/** Kart ve modaldaki "Quick details" satirlari. */
export type QuickDetails = {
  time: string;
  bun: Localized;
  patty: Localized;
  spice: Localized;
};

export type Product = {
  slug: string;
  category: Category;
  name: Localized;
  desc: Localized;
  /** Kural 17: her dil icin ayri malzeme listesi. */
  ingredients: Record<Locale, string[]>;
  /** TODO: fiyatlar marka tarafindan verilecek (TL). */
  price: number | null;
  tags: Tag[];
  /** Kural 7: gorsel yoksa null — placeholder blok gosterilir. */
  image: string | null;
  quick: QuickDetails;
  /** Kural 17: adi/icerigi henuz teyit edilmemis urun. */
  unconfirmed?: true;
};

const brioche: Localized = { tr: "Tereyağlı brioche", en: "Buttered brioche" };
const beef120: Localized = { tr: "Dana 120 gr", en: "Beef 120 g" };
const mild: Localized = { tr: "Hafif", en: "Mild" };
const hot: Localized = { tr: "Acı", en: "Hot" };
const none: Localized = { tr: "Acısız", en: "No heat" };

export const menu: Product[] = [
  {
    slug: "classic-manch-burger",
    category: "smash-burgers",
    name: { tr: "Classic Manch Burger", en: "Classic Manch Burger" },
    desc: { tr: "Tarzına yakışan smash!", en: "The smash that matches your style!" },
    ingredients: {
      tr: ["Double smash köfte", "Cheddar", "Turşu", "Soğan", "Marul", "Manch sos", "Tereyağlı brioche"],
      en: ["Double smash patty", "Cheddar", "Pickles", "Onion", "Lettuce", "Manch sauce", "Buttered brioche"],
    },
    price: null,
    tags: ["signature"],
    image: null,
    quick: { time: "8'", bun: brioche, patty: beef120, spice: none },
  },
  {
    slug: "berry-manch",
    category: "smash-burgers",
    name: { tr: "Berry Manch", en: "Berry Manch" },
    desc: {
      tr: "Yoğun, dengeli ve özgün bir lezzet.",
      en: "Bold, balanced and one of a kind.",
    },
    ingredients: {
      tr: ["El yapımı tereyağlı brioche", "120 gr köfte", "Roquefort aioli", "Yaban mersini reçeli", "Berry sos", "Kuzu kulağı", "2 adet cheddar"],
      en: ["Handmade buttered brioche", "120 g patty", "Roquefort aioli", "Blueberry jam", "Berry sauce", "Sorrel", "Two slices of cheddar"],
    },
    price: null,
    tags: ["signature", "new"],
    image: null,
    quick: { time: "9'", bun: brioche, patty: beef120, spice: none },
  },
  {
    slug: "koz-biberli-smash",
    category: "smash-burgers",
    name: { tr: "Köz Biberli Smash", en: "Roasted Pepper Smash" },
    desc: {
      tr: "Köz biber sosumuzu MANCH mutfağında kendimiz hazırlıyoruz.",
      en: "We make our roasted pepper sauce in the MANCH kitchen.",
    },
    ingredients: {
      tr: ["Smash köfte", "Ev yapımı köz biber sosu", "Cheddar", "Tereyağlı brioche"],
      en: ["Smash patty", "House roasted pepper sauce", "Cheddar", "Buttered brioche"],
    },
    price: null,
    tags: ["spicy"],
    image: null,
    quick: { time: "8'", bun: brioche, patty: beef120, spice: hot },
  },
  {
    slug: "truffle-smash",
    category: "smash-burgers",
    name: { tr: "Truffle Smash", en: "Truffle Smash" },
    desc: { tr: "Trüf aromalı smash.", en: "Smash with truffle aroma." },
    ingredients: {
      tr: ["Smash köfte", "Trüf sos", "Cheddar", "Tereyağlı brioche"],
      en: ["Smash patty", "Truffle sauce", "Cheddar", "Buttered brioche"],
    },
    price: null,
    tags: [],
    image: null,
    quick: { time: "9'", bun: brioche, patty: beef120, spice: none },
    unconfirmed: true,
  },
  {
    slug: "crispy-chicken-tenders",
    category: "chicken",
    name: { tr: "Crispy Chicken Tenders", en: "Crispy Chicken Tenders" },
    desc: { tr: "Otlu dip sos ile.", en: "Served with herb dip." },
    ingredients: {
      tr: ["Çıtır tavuk", "Otlu dip sos"],
      en: ["Crispy chicken", "Herb dip"],
    },
    price: null,
    tags: [],
    image: null,
    quick: { time: "10'", bun: { tr: "—", en: "—" }, patty: { tr: "Tavuk", en: "Chicken" }, spice: mild },
  },
  {
    slug: "chicken-sandwich",
    category: "chicken",
    name: { tr: "Chicken Sandwich", en: "Chicken Sandwich" },
    desc: { tr: "Çıtır tavuklu sandviç.", en: "Crispy chicken sandwich." },
    ingredients: {
      tr: ["Çıtır tavuk", "Marul", "Sos", "Tereyağlı brioche"],
      en: ["Crispy chicken", "Lettuce", "Sauce", "Buttered brioche"],
    },
    price: null,
    tags: [],
    image: null,
    quick: { time: "10'", bun: brioche, patty: { tr: "Tavuk", en: "Chicken" }, spice: mild },
    unconfirmed: true,
  },
  {
    slug: "patates-kizartmasi",
    category: "sides",
    name: { tr: "Patates Kızartması", en: "Fries" },
    desc: { tr: "Kağıt külahta, tepside.", en: "In a paper cone, on the tray." },
    ingredients: { tr: ["Patates", "Tuz"], en: ["Potato", "Salt"] },
    price: null,
    tags: [],
    image: null,
    quick: { time: "6'", bun: { tr: "—", en: "—" }, patty: { tr: "—", en: "—" }, spice: none },
  },
  {
    slug: "tiramisu",
    category: "desserts",
    name: { tr: "Tiramisu", en: "Tiramisu" },
    desc: {
      tr: "Tiramisu konusunda biraz iddialıyız.",
      en: "We take tiramisu seriously.",
    },
    ingredients: {
      tr: ["Gerçek mascarpone", "İpeksi krema", "Kahve"],
      en: ["Real mascarpone", "Silky cream", "Coffee"],
    },
    price: null,
    tags: ["signature"],
    image: null,
    quick: { time: "—", bun: { tr: "—", en: "—" }, patty: { tr: "—", en: "—" }, spice: none },
  },
  {
    slug: "ev-yapimi-icecekler",
    category: "drinks",
    name: { tr: "Ev Yapımı İçecekler", en: "Homemade Drinks" },
    desc: { tr: "Limonata ve soft drinks.", en: "Lemonade and soft drinks." },
    ingredients: { tr: ["Limonata", "Soft drinks"], en: ["Lemonade", "Soft drinks"] },
    price: null,
    tags: [],
    image: null,
    quick: { time: "—", bun: { tr: "—", en: "—" }, patty: { tr: "—", en: "—" }, spice: none },
    unconfirmed: true,
  },
];

/** Ana sayfadaki "The Hits" bolumu. */
export const featured = menu.filter((p) => p.tags.includes("signature"));

export const getProduct = (slug: string) => menu.find((p) => p.slug === slug);

export const byCategory = (category: Category) =>
  menu.filter((p) => p.category === category);
