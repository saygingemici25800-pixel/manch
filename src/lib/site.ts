import type { Locale } from "@/i18n/routing";

/** Iki dilli metin. Kural 6: marka sabitleri sadece bu dosyada. */
export type Localized = Record<Locale, string>;

export const site = {
  name: "MANCH",
  /** TODO: domain yok — Faz 9'da NEXT_PUBLIC_SITE_URL ile gelir. */
  url: "https://manch.tr",
  category: {
    tr: "Smash Burger / Fast Food",
    en: "Smash Burger / Fast Food",
  } satisfies Localized,
  tagline: {
    tr: "United Chill Burger Zone",
    en: "United Chill Burger Zone",
  } satisfies Localized,
  taglineAlt: {
    tr: "Handmade Hits Different",
    en: "Handmade Hits Different",
  } satisfies Localized,
  wallQuote: "THE BURGER YOU'LL CRAVE AGAIN",
  foundedYear: 2026,

  address: {
    street: "Çarşı Cd. 21/b",
    district: "Paspatur",
    city: "Fethiye",
    postalCode: "48300",
    country: "TR",
    full: "Çarşı Cd. 21/b, Fethiye 48300",
  },

  /** TODO: telefon, saatler ve siparis linki marka tarafindan verilecek. */
  phone: null as string | null,
  whatsapp: null as string | null,
  email: null as string | null,
  /** TODO: haftalik calisma saatleri. */
  hours: null as null | Record<string, string>,

  social: {
    instagram: "https://www.instagram.com/manch.tr/",
    /** TODO: Facebook sayfa linki bio'dan alinacak. */
    facebook: null as string | null,
  },

  mascots: {
    names: ["Misu", "Miyu"] as const,
    label: { tr: "MANCH'in yüzleri", en: "The faces of MANCH" } satisfies Localized,
  },

  /** TODO: Webber Digital URL. */
  credit: { name: "Webber Digital", url: null as string | null },
} as const;

export type Site = typeof site;
