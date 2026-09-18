// Tüm marka sabitleri burada. Başka yerde sabit metin/adres/telefon yazma (Kural 6).
// `null` olan alanlar TODO — kullanıcıdan gelecek.

/**
 * Canonical/hreflang/sitemap/robots/JSON-LD/OG — hepsi buradan okur.
 *
 * Kural 57: değer **yoksa production build KIRILIR**. Sessizce `localhost`a ya da
 * tahmini bir domaine düşmek en kötü hata sınıfı: site yayına yanlış canonical ile
 * çıkar, Google onu indeksler ve düzeltmesi haftalar alır.
 * Development'ta localhost'a düşer ama konsola gürültülü uyarı basar.
 */
function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL tanımlı değil. Production build'de zorunlu — " +
        "canonical, hreflang, sitemap, robots, JSON-LD ve OG bu değeri kullanır. " +
        "Vercel: Settings → Environment Variables. Yerel: `.env.local`.",
    );
  }
  console.warn(
    "[MANCH] NEXT_PUBLIC_SITE_URL yok → http://localhost:3000 kullanılıyor (yalnızca development).",
  );
  return "http://localhost:3000";
}

export const site = {
  name: "MANCH",
  // TODO: gerçek domain (Cloudflare DNS, Faz 9). Vercel preview'da NEXT_PUBLIC_SITE_URL ile ezilir.
  url: siteUrl(),
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
