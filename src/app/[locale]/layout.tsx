import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import Footer from "@/components/layout/Footer";
import LayoutDeferred from "@/components/layout/LayoutDeferred";
import Nav from "@/components/layout/Nav";
import Preloader from "@/components/layout/Preloader";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { clientMessages } from "@/i18n/client-messages";
import { routing, type Locale } from "@/i18n/routing";
import { restaurantJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
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
    metadataBase: new URL(site.url),
    // Kural 38: şablon EN SONDA — sayfalar kısa başlık verir, ana sayfa `absolute` kullanır.
    title: { default: t("title"), template: `%s | ${site.name}` },
    description: t("description"),
    applicationName: site.name,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Kural 16: statik render icin zorunlu.
  setRequestLocale(locale);
  // Kural 44: client'a yalnızca client component'lerin kullandığı namespace'ler.
  const messages = clientMessages(await getMessages());
  const skip = (await getTranslations({ locale, namespace: "Common" }))("skipToContent");

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/* Restaurant JSON-LD — Kural 54: bilinmeyen alan YAZILMAZ (uydurma değer işletme kartını bozar). */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd(locale as Locale)) }}
          />
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
          {/* Cart / InfoModal / CookieBanner artık LayoutDeferred içinde (Kural 46). */}
          <LayoutDeferred />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
