import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Cart from "@/components/layout/Cart";
import CookieBanner from "@/components/layout/CookieBanner";
import Footer from "@/components/layout/Footer";
import InfoModal from "@/components/layout/InfoModal";
import MenuOverlay from "@/components/layout/MenuOverlay";
import Nav from "@/components/layout/Nav";
import PageTransition from "@/components/layout/PageTransition";
import Preloader from "@/components/layout/Preloader";
import CursorTrail from "@/components/motion/CursorTrail";
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
    title: t("title"),
    description: t("description"),
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

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink font-ui">
        <NextIntlClientProvider>
          <SmoothScroll>
            <Preloader />
            <CursorTrail />
            <Nav />
            <MenuOverlay />
            <PageTransition />
            {children}
            <Footer />
            <Cart />
            <CookieBanner />
            <InfoModal />
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
