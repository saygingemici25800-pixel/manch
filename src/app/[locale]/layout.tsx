import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import Cart from "@/components/layout/Cart";
import CookieBanner from "@/components/layout/CookieBanner";
import Footer from "@/components/layout/Footer";
import InfoModal from "@/components/layout/InfoModal";
import LayoutDeferred from "@/components/layout/LayoutDeferred";
import Nav from "@/components/layout/Nav";
import Preloader from "@/components/layout/Preloader";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/styles/fonts";
import "@/styles/globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Kural 16: statik render icin zorunlu.
  setRequestLocale(locale);
  const messages = await getMessages();
  const skip = (await getTranslations({ locale, namespace: "Common" }))("skipToContent");

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Preloader />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-[1vw] focus:top-[1vw] focus:z-100 focus:bg-mustard focus:px-[1vw] focus:py-[0.5vw] focus:font-ui focus:uppercase focus:text-berry-dk"
          >
            {skip}
          </a>
          <Nav />
          <SmoothScroll>
            {children}
            <Footer />
          </SmoothScroll>
          <Cart />
          <InfoModal />
          <CookieBanner />
          <LayoutDeferred />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
