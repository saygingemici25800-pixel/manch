import { defineRouting } from "next-intl/routing";

export const locales = ["tr", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "tr",
  // Varsayilan dil de URL'de gorunur: /tr ve /en.
  localePrefix: "always",
});
