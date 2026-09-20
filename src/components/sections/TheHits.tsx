import { getTranslations } from "next-intl/server";

import { Sticker } from "@/components/ui/Sticker";

import { ProductGrid } from "@/components/sections/ProductGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getFeatured } from "@/data/menu";

/** R10 + R11 — 6 imza ürün. */
export async function TheHits() {
  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");
  const products = getFeatured();

  return (
    <section id="hits" className="relative isolate scroll-mt-[6vw] bg-cream px-[3vw] py-[5vw] max-md:px-[5vw] max-md:py-[14vw]">
      {/* Sticker 1/3 — cream (açık) zemin → domates. Mobilde GÖRÜNEN tek sticker. */}
      <Sticker name="tomato" tone="light" place="-top-[2.5vw] right-[-1.5vw] rotate-[-12deg] max-md:-top-[6vw] max-md:right-[-4vw]" />
      <SectionHeader
        eyebrow={t("hits.eyebrow")}
        title={t("hits.title")}
        counter={tc("products", { count: products.length })}
      />
      {/* Kural 45/47 (ölçüm 2026-09-18): ana sayfada kartlar fold ALTINDA — `priority`
          preload'u hero fontlarıyla yarışıp LCP'yi geciktiriyordu. `/menu`'de kartlar
          fold sınırında olduğu için orada açık kalıyor. */}
      <ProductGrid products={products} />
    </section>
  );
}
