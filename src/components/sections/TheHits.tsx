import { getTranslations } from "next-intl/server";
import SectionHeader from "@/components/ui/SectionHeader";
import { getFeatured } from "@/data/menu";
import ProductGrid from "./ProductGrid";

/** R10 + R11 — The Hits: 6 imza ürün. */
export default async function TheHits() {
  const t = await getTranslations("Home.hits");
  const tc = await getTranslations("Common");
  const products = getFeatured();
  return (
    <section id="hits" className="scroll-mt-[6vw] bg-cream px-[2.5vw] py-[6vw] max-md:px-[5vw] max-md:py-[14vw]">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} counter={tc("products", { count: products.length })} className="mb-[3vw] max-md:mb-[8vw]" />
      <ProductGrid products={products} />
    </section>
  );
}
