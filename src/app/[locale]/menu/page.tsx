import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHeader from "@/components/ui/SectionHeader";
import { categories, products } from "@/data/menu";
import MenuClient from "./MenuClient";

export async function generateMetadata({ params }: Pick<PageProps<"/[locale]/menu">, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Menu" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function MenuPage({ params }: PageProps<"/[locale]/menu">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Menu");
  const tc = await getTranslations("Common");

  return (
    <main className="bg-cream px-[2.5vw] pb-[8vw] pt-[8vw] max-md:px-[5vw] max-md:pb-[16vw] max-md:pt-[24vw]">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} counter={tc("products", { count: products.length })} className="mb-[2vw] max-md:mb-[6vw]" />
      {/* Kural 34: useSearchParams → Suspense */}
      <Suspense fallback={<div aria-hidden="true" className="h-[40vw] max-md:h-[120vw]" />}>
        <MenuClient categories={categories} products={products} />
      </Suspense>
    </main>
  );
}
