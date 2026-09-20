import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { Build } from "@/components/sections/Build";
import { Handmade } from "@/components/sections/Handmade";
import { Hero } from "@/components/sections/Hero";
import { InstagramGrid } from "@/components/sections/InstagramGrid";
import { Location } from "@/components/sections/Location";
import { MarqueeBand } from "@/components/sections/MarqueeBand";
import { MisuMiyu } from "@/components/sections/MisuMiyu";
import { TheHits } from "@/components/sections/TheHits";
import { Zone } from "@/components/sections/Zone";
import { Sticker } from "@/components/ui/Sticker";
import { clientMessages } from "@/i18n/client-messages";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  // Ana sayfada başlık şablonsuz (Kural 38).
  return pageMetadata({
    locale: locale as Locale,
    path: "",
    title: t("title"),
    description: t("description"),
    absoluteTitle: true,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale); // Kural 16

  // Kural 44: temel namespace'ler + sayfaya özel "Home".
  const messages = clientMessages(await getMessages(), ["Home", "Zone", "Menu"]);

  return (
    <NextIntlClientProvider messages={messages}>
      <main id="main">
        <Hero />
        <MarqueeBand />
        <TheHits />
        <Build />
        <Handmade />
        <Zone />
        <MisuMiyu />
        <InstagramGrid />
        {/* Sticker 3/3 — berry (koyu) zemin → cheddar. Location `"use client"` olduğu
            için sticker burada SUNUCUDA render edilip içeri veriliyor. Mobilde gizli. */}
        <Location
          sticker={
            <Sticker
              name="cheddar"
              tone="dark"
              place="-bottom-[3vw] left-[9vw] rotate-[14deg] max-md:hidden"
            />
          }
        />
      </main>
    </NextIntlClientProvider>
  );
}
