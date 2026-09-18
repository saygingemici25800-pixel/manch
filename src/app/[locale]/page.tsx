import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { Build } from "@/components/sections/Build";
import { Handmade } from "@/components/sections/Handmade";
import { Hero } from "@/components/sections/Hero";
import { InstagramGrid } from "@/components/sections/InstagramGrid";
import { Location } from "@/components/sections/Location";
import { MarqueeBand } from "@/components/sections/MarqueeBand";
import { MisuMiyu } from "@/components/sections/MisuMiyu";
import { TheHits } from "@/components/sections/TheHits";
import { Zone } from "@/components/sections/Zone";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale); // Kural 16

  // Sayfaya özel client namespace'i (Kural 44) — Home'u client component'lere de ver.
  const messages = await getMessages();

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
        <Location />
      </main>
    </NextIntlClientProvider>
  );
}
