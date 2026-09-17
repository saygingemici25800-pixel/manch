import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { clientMessages } from "@/i18n/client-messages";
import { routing, type Locale } from "@/i18n/routing";
import { pageMetadata, restaurantJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import Cart from "@/components/layout/Cart";
import Footer from "@/components/layout/Footer";
import InfoModal from "@/components/layout/InfoModal";
import Nav from "@/components/layout/Nav";
import Preloader from "@/components/layout/Preloader";
import LayoutDeferred from "@/components/layout/LayoutDeferred";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { fontVariables } from "@/styles/fonts";
import "@/styles/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LayoutProps<"/[locale]">, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    metadataBase: new URL(site.url),
    ...pageMetadata({ locale: locale as Locale, path: "", title: t("title"), description: t("description") }),
    // şablon en sonda: sayfalar kısa başlık verir ("Menü" → "Menü | MANCH"), ana sayfa default'u alır
    title: { template: `%s | ${site.name}`, default: t("title") },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Statik render için locale'i istek bağlamına yaz
  setRequestLocale(locale);
  const tc = await getTranslations("Common");
  const jsonLd = JSON.stringify(restaurantJsonLd(locale));
  // Kural 44: client'a sadece temel namespace'ler
  const messages = clientMessages(await getMessages());

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink font-ui">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-[1vw] focus:top-[1vw] focus:z-100 focus:rounded-full focus:bg-mustard focus:px-[1.2vw] focus:py-[0.6vw] focus:text-ink text40 text-[1vw] max-md:text-[3.5vw]">
          {tc("skipToContent")}
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <NextIntlClientProvider messages={messages}>
          <SmoothScroll>
            <Preloader />
            <Nav />
            <LayoutDeferred />
            {children}
            <Footer />
            <Cart />
            <InfoModal />
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
