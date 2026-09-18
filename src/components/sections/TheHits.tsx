import { getTranslations } from "next-intl/server";

import { ProductGrid } from "@/components/sections/ProductGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getFeatured } from "@/data/menu";

/** R10 + R11 — 6 imza ürün. */
export async function TheHits() {
  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");
  const products = getFeatured();

  return (
    <section id="hits" className="scroll-mt-[6vw] bg-cream px-[3vw] py-[5vw] max-md:px-[5vw] max-md:py-[14vw]">
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
