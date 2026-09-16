// Tüm marka sabitleri burada. Başka yerde sabit metin/adres/telefon yazma (Kural 6).
// `null` olan alanlar TODO — kullanıcıdan gelecek.

export const site = {
  name: "MANCH",
  legalName: "MANCH",
  tagline: "United Chill Burger Zone",
  taglineAlt: "Handmade Hits Different",
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
    facebook: null as string | null, // TODO: bio'daki link
  },

  contact: {
    phone: null as string | null, // TODO
    whatsapp: null as string | null, // TODO: E.164 formatında, ör. "+90..."
    email: null as string | null, // TODO
  },

  hours: null as
    | ReadonlyArray<{ days: string; open: string; close: string }>
    | null, // TODO

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
