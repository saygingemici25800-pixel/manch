import type { Metadata } from "next";

import type { Locale } from "@/i18n/routing";
import { clientMessages } from "@/i18n/client-messages";
import { pageMetadata } from "@/lib/seo";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import LogoMenu from "@/components/ui/logo-menu";
import { categories, products } from "@/data/menu";
import { site } from "@/lib/site";

import { MenuClient } from "./MenuClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Menu" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/menu",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function MenuPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale); // Kural 16

  // Kural 44: temel namespace"ler + "Menu".
  const messages = clientMessages(await getMessages(), ["Menu"]);
  const t = await getTranslations("Menu");
  const tc = await getTranslations("Common");

  return (
    <NextIntlClientProvider messages={messages}>
      <main
        id="main"
        className="bg-cream px-[2.5vw] pb-[8vw] pt-[8vw] max-md:px-[5vw] max-md:pb-[16vw] max-md:pt-[24vw]"
      >
        <header className="mb-[2vw] flex flex-col items-center gap-[0.8vw] text-center max-md:mb-[6vw] max-md:gap-[3vw]">
          {/* Görsel wordmark ama sayfanın h1'i — erişilebilir adı SVG'nin aria-label'ı verir. */}
          <h1 className="contents">
            <LogoMenu className="h-[7vw] w-auto text-berry max-md:h-[18vw]" label={t("title")} />
          </h1>
          <p className="font-pixel text-[0.9vw] uppercase tracking-[0.3em] text-berry max-md:text-[3vw]">
            {site.menuTagline}
          </p>
          <p className="font-pixel text-[0.8vw] uppercase tracking-widest text-berry-dk max-md:text-[2.8vw]">
            {tc("products", { count: products.length })}
          </p>
          {/* Faz 4'te eklenen anahtar — 1/2: menü başlığının altında */}
          <p
            data-testid="menu-disclaimer"
            className="max-w-[46ch] font-ui text-[0.8vw] text-berry-dk max-md:text-[2.9vw]"
          >
            {t("disclaimer")}
          </p>
        </header>

        {/* Kural 34: useSearchParams → Suspense */}
        <Suspense fallback={<div aria-hidden="true" className="h-[40vw] max-md:h-[120vw]" />}>
          <MenuClient categories={categories} products={products} />
        </Suspense>
      </main>
    </NextIntlClientProvider>
  );
}
