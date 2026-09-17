// Tüm marka sabitleri burada. Başka yerde sabit metin/adres/telefon yazma (Kural 6).
// `null` olan alanlar TODO — kullanıcıdan gelecek.

export const site = {
  name: "MANCH",
  // TODO: gerçek domain (Cloudflare DNS, Faz 9). Vercel preview'da NEXT_PUBLIC_SITE_URL ile ezilir.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://manch.tr",
  legalName: "MANCH",
  tagline: "United Chill Burger Zone",
  taglineAlt: "Handmade Hits Different",
  menuTagline: "BURGER . FRIES . ATIŞTIRMALIK . TATLI",
  hashtags: ["#Manch", "#HandmadeHitsDifferent", "#Fethiye"],
  est: 2026,
  // Yaz 2026 açılış — brief: Haziran teaser, Temmuz başı açık
  openingLabel: "2026",

  address: {
    street: "Çarşı Cd. 21/b",
    district: "Paspatur",
    city: "Fethiye",
    postalCode: "48300",
    country: "TR",
    full: "Çarşı Cd. 21/b, Fethiye 48300 (Paspatur)",
  },

  social: {
    instagram: "https://www.instagram.com/manch.tr/",
    instagramHandle: "@manch.tr",
    facebook: "https://www.facebook.com/manch.tr/" as string | null,
  },

  contact: {
    phone: "+90 505 497 07 48" as string | null,
    phoneDisplay: "0505 497 07 48",
    whatsapp: "+905054970748" as string | null, // E.164 → wa.me/905054970748
    email: "manch.burger.coffee@gmail.com" as string | null,
  },

  hours: null as
    | ReadonlyArray<{ days: string; open: string; close: string }>
    | null, // TODO: çalışma saatleri

  orderUrl: null as string | null, // TODO: sipariş linki (Getir/Yemeksepeti/WhatsApp)

  mascots: {
    names: ["Misu", "Miyu"],
    label: "Misu & Miyu",
  },

  wallQuote: "THE BURGER YOU'LL CRAVE AGAIN",

  credit: {
    label: "Webber Digital",
    url: null as string | null, // TODO
  },
} as const;

export type Site = typeof site;
