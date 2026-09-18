import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { site } from "@/lib/site";

/** Kural 38 — her sayfa: canonical + hreflang (tr/en/x-default) + OG/Twitter. Title şablonu layout'ta ("%s | MANCH"). */
export function pageMetadata(opts: {
  locale: Locale;
  /** locale'siz yol: "" | "/menu" … */
  path: string;
  title: string;
  description: string;
  /** ana sayfa: şablonsuz tam başlık */
  absoluteTitle?: boolean;
  noindex?: boolean;
}): Metadata {
  const { locale, path, title, description, absoluteTitle, noindex } = opts;
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])) as Record<string, string>;
  languages["x-default"] = `/${routing.defaultLocale}${path}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: `/${locale}${path}`, languages },
    openGraph: {
      title,
      description,
      url: `/${locale}${path}`,
      siteName: site.name,
      locale: locale === "tr" ? "tr_TR" : "en_US",
      type: "website",
      // sayfa openGraph'ı üst segmentinkini bütünüyle ezer → dosya-kural görseli burada açıkça verilir
      images: [{ url: `/${locale}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * Restaurant JSON-LD.
 *
 * **Kural 54:** bilinmeyen alan **hiç yazılmaz** — "Yakında", boş string veya tahmin YASAK.
 * Google yapılandırılmış veriyi kelime kelime okur; uydurma değer işletme kartını bozar.
 * Bilerek dışarıda: `priceRange` (belirlenmedi — sipariş/fiyat sınıfı verisi yok).
 * `openingHoursSpecification` ve `addressRegion` 2026-09-18'de **eklendi** (veri geldi).
 */
export function restaurantJsonLd(locale: Locale) {
  const base = site.url;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: site.name,
    url: `${base}/${locale}`,
    image: `${base}/${locale}/opengraph-image`,
    servesCuisine: "Burgers",
    hasMenu: `${base}/${locale}/menu`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    sameAs: [site.social.instagram, site.social.facebook].filter(Boolean),
  };
  // Yapılandırılmış veride boşluksuz E.164 (görünen arayüzde okunur biçim kalır).
  if (site.contact.phone) data.telephone = site.contact.phone.replace(/\s+/g, "");
  if (site.contact.email) data.email = site.contact.email;
  if (site.hours) {
    data.openingHoursSpecification = site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    }));
  }
  return data;
}
