// Tek doğruluk kaynağı: menü sadece burada (Kural 6). Fiyatlar TODO → null.

import type { Locale } from "@/i18n/routing";

export type Localized = Record<Locale, string>;

export type CategoryId = "smash-burgers" | "chicken" | "sides" | "desserts" | "drinks";

export type Tag = "spicy" | "new" | "signature";

export type Spice = "mild" | "medium" | "hot";

export interface Category {
  id: CategoryId;
  name: Localized;
}

export interface Product {
  slug: string;
  category: CategoryId;
  name: Localized;
  desc: Localized;
  ingredients: Record<Locale, string[]>;
  /** TL — null: TODO */
  price: number | null;
  tags: Tag[];
  /** `/images/...` veya `/burgers/...` — null: placeholder blok göster (Kural 7) */
  image: string | null;
  quick: {
    /** dakika */
    time: number;
    bun: Localized;
    patty: Localized;
    spice: Spice;
  };
  /** İsim / varlık Instagram'dan teyit edilmedi */
  unconfirmed?: boolean;
  /** Ana sayfa "The Hits" (6 ürün) */
  featured?: boolean;
}

export const categories: Category[] = [
  { id: "smash-burgers", name: { tr: "Smash Burgers", en: "Smash Burgers" } },
  { id: "chicken", name: { tr: "Chicken", en: "Chicken" } },
  { id: "sides", name: { tr: "Sides", en: "Sides" } },
  { id: "desserts", name: { tr: "Tatlılar", en: "Desserts" } },
  { id: "drinks", name: { tr: "İçecekler", en: "Drinks" } },
];

const BRIOCHE: Localized = { tr: "Tereyağlı brioche", en: "Butter brioche" };
const BEEF_120: Localized = { tr: "Dana 120 g", en: "Beef 120 g" };
const NONE: Localized = { tr: "—", en: "—" };

export const products: Product[] = [
  {
    slug: "classic-manch-burger",
    featured: true,
    category: "smash-burgers",
    name: { tr: "Classic Manch Burger", en: "Classic Manch Burger" },
    desc: { tr: "Tarzına yakışan smash!", en: "A smash that suits your style!" },
    ingredients: {
      tr: ["Double smash köfte", "Cheddar", "Turşu", "Soğan", "Marul", "Manch sos", "Tereyağlı brioche"],
      en: ["Double smash patty", "Cheddar", "Pickles", "Onion", "Lettuce", "Manch sauce", "Butter brioche"],
    },
    price: null,
    tags: ["signature"],
    image: "/images/classic-manch.jpg",
    quick: { time: 8, bun: BRIOCHE, patty: BEEF_120, spice: "mild" },
  },
  {
    slug: "berry-manch",
    featured: true,
    category: "smash-burgers",
    name: { tr: "Berry Manch", en: "Berry Manch" },
    desc: { tr: "Yoğun, dengeli ve özgün bir lezzet.", en: "Rich, balanced and one of a kind." },
    ingredients: {
      tr: ["El yapımı tereyağlı brioche", "120 gr köfte", "Roquefort aioli", "Yaban mersini reçeli", "Berry sos", "Kuzu kulağı", "2 cheddar"],
      en: ["Handmade butter brioche", "120 g patty", "Roquefort aioli", "Blueberry jam", "Berry sauce", "Sorrel", "Double cheddar"],
    },
    price: null,
    tags: ["signature"],
    image: "/images/berry-manch.jpg",
    quick: { time: 9, bun: BRIOCHE, patty: BEEF_120, spice: "mild" },
  },
  {
    slug: "koz-biberli-smash",
    featured: true,
    category: "smash-burgers",
    name: { tr: "Köz Biberli Smash", en: "Roasted Pepper Smash" },
    desc: { tr: "Köz biber sosunu MANCH mutfağında kendimiz hazırlıyoruz.", en: "Roasted pepper sauce, made in the MANCH kitchen." },
    ingredients: {
      tr: ["Smash köfte", "Ev yapımı köz biber sosu", "Cheddar", "Tereyağlı brioche"],
      en: ["Smash patty", "Homemade roasted pepper sauce", "Cheddar", "Butter brioche"],
    },
    price: null,
    tags: ["spicy"],
    image: null,
    quick: { time: 8, bun: BRIOCHE, patty: BEEF_120, spice: "medium" },
  },
  {
    // TODO: isim teyit (postta truffle görseli var)
    slug: "truffle-smash",
    featured: true,
    category: "smash-burgers",
    name: { tr: "Truffle Smash", en: "Truffle Smash" },
    desc: { tr: "Trüf aromalı smash.", en: "Truffle-scented smash." },
    ingredients: {
      tr: ["Smash köfte", "Trüf sos", "Cheddar", "Tereyağlı brioche"],
      en: ["Smash patty", "Truffle sauce", "Cheddar", "Butter brioche"],
    },
    price: null,
    tags: ["new"],
    image: null,
    quick: { time: 8, bun: BRIOCHE, patty: BEEF_120, spice: "mild" },
    unconfirmed: true,
  },
  {
    slug: "crispy-chicken-tenders",
    featured: true,
    category: "chicken",
    name: { tr: "Crispy Chicken Tenders", en: "Crispy Chicken Tenders" },
    desc: { tr: "Otlu dip sos ile.", en: "With herb dip." },
    ingredients: {
      tr: ["Çıtır tavuk", "Otlu dip sos"],
      en: ["Crispy chicken", "Herb dip"],
    },
    price: null,
    tags: [],
    image: "/images/tenders.jpg",
    quick: { time: 7, bun: NONE, patty: { tr: "Tavuk", en: "Chicken" }, spice: "mild" },
  },
  {
    // TODO: teyit
    slug: "chicken-sandwich",
    category: "chicken",
    name: { tr: "Chicken Sandwich", en: "Chicken Sandwich" },
    desc: { tr: "Çıtır tavuk, brioche.", en: "Crispy chicken on brioche." },
    ingredients: {
      tr: ["Çıtır tavuk", "Marul", "Sos", "Tereyağlı brioche"],
      en: ["Crispy chicken", "Lettuce", "Sauce", "Butter brioche"],
    },
    price: null,
    tags: [],
    image: null,
    quick: { time: 8, bun: BRIOCHE, patty: { tr: "Tavuk", en: "Chicken" }, spice: "mild" },
    unconfirmed: true,
  },
  {
    slug: "patates-kizartmasi",
    category: "sides",
    name: { tr: "Patates Kızartması", en: "Fries" },
    desc: { tr: "Kağıt külahta.", en: "In a paper cone." },
    ingredients: { tr: ["Patates"], en: ["Potatoes"] },
    price: null,
    tags: [],
    image: "/images/fries.jpg",
    quick: { time: 5, bun: NONE, patty: NONE, spice: "mild" },
  },
  {
    slug: "tiramisu",
    featured: true,
    category: "desserts",
    name: { tr: "Tiramisu", en: "Tiramisu" },
    desc: { tr: "Gerçek mascarpone, ipeksi krema.", en: "Real mascarpone, silky cream." },
    ingredients: { tr: ["Mascarpone", "Kahve", "Kakao"], en: ["Mascarpone", "Coffee", "Cocoa"] },
    price: null,
    tags: ["signature"],
    image: "/images/tiramisu.jpg",
    quick: { time: 2, bun: NONE, patty: NONE, spice: "mild" },
  },
  {
    // TODO: teyit (limonata / çilekli / soft drinks)
    slug: "ev-yapimi-icecekler",
    category: "drinks",
    name: { tr: "Ev Yapımı İçecekler", en: "Homemade Drinks" },
    desc: { tr: "Limonata ve soft drinks.", en: "Lemonade and soft drinks." },
    ingredients: { tr: [], en: [] },
    price: null,
    tags: [],
    image: null,
    quick: { time: 1, bun: NONE, patty: NONE, spice: "mild" },
    unconfirmed: true,
  },
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
