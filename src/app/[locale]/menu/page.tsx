import type { Metadata } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { clientMessages } from "@/i18n/client-messages";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import LogoMenu from "@/components/ui/logo-menu";
import { site } from "@/lib/site";
import { categories, products } from "@/data/menu";
import MenuClient from "./MenuClient";

export async function generateMetadata({ params }: Pick<PageProps<"/[locale]/menu">, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Menu" });
  return pageMetadata({ locale: locale as Locale, path: "/menu", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function MenuPage({ params }: PageProps<"/[locale]/menu">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = clientMessages(await getMessages(), ["Menu"]);
  const t = await getTranslations("Menu");
  const tc = await getTranslations("Common");

  return (
    <NextIntlClientProvider messages={messages}>
    <main id="main" className="bg-cream px-[2.5vw] pb-[8vw] pt-[8vw] max-md:px-[5vw] max-md:pb-[16vw] max-md:pt-[24vw]">
      <header className="mb-[2vw] max-md:mb-[6vw] flex flex-col items-center gap-[0.8vw] max-md:gap-[3vw] text-center">
        <LogoMenu className="h-[7vw] max-md:h-[18vw] w-auto text-berry" label={t("title")} />
        <p className="font-pixel text-[0.9vw] max-md:text-[3vw] uppercase tracking-[0.3em] text-berry">{site.menuTagline}</p>
        <p className="font-pixel text-[0.8vw] max-md:text-[2.8vw] uppercase tracking-widest text-berry-dk">{tc("products", { count: products.length })}</p>
      </header>
      {/* Kural 34: useSearchParams → Suspense */}
      <Suspense fallback={<div aria-hidden="true" className="h-[40vw] max-md:h-[120vw]" />}>
        <MenuClient categories={categories} products={products} />
      </Suspense>
    </main>
    </NextIntlClientProvider>
  );
}
