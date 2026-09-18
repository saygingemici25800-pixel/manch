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
  // Kuruluş yılı (marka rozeti "EST. 2026"). İşletme AÇIK — açılış vaadi değil.
  est: 2026,

  address: {
    street: "Çarşı Cd. 21/b",
    district: "Paspatur",
    city: "Fethiye",
    region: "Muğla",
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

  /**
   * Çalışma saatleri (2026-09-18, işletmeden geldi).
   * `dayOfWeek` schema.org gün adları — JSON-LD `OpeningHoursSpecification` doğrudan kullanır.
   * Cuma/Cumartesi kapanışı "00:00": schema.org bunu ertesi güne taşma sayar.
   */
  hours: [
    {
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "08:30",
      closes: "23:30",
      label: { tr: "Pazartesi–Perşembe", en: "Monday–Thursday" },
    },
    {
      dayOfWeek: ["Friday", "Saturday"],
      opens: "08:30",
      closes: "00:00",
      label: { tr: "Cuma–Cumartesi", en: "Friday–Saturday" },
    },
    {
      dayOfWeek: ["Sunday"],
      opens: "08:30",
      closes: "23:30",
      label: { tr: "Pazar", en: "Sunday" },
    },
  ] as ReadonlyArray<{
    dayOfWeek: readonly string[];
    opens: string;
    closes: string;
    label: { tr: string; en: string };
  }> | null,

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

/** Arayüzde gösterilecek saat metni. Saatler yoksa null → çağıran `SoonBadge` gösterir. */
export function formatHours(locale: "tr" | "en"): string | null {
  if (!site.hours) return null;
  return site.hours.map((h) => `${h.label[locale]} ${h.opens}–${h.closes}`).join(" · ");
}
