import { setRequestLocale } from "next-intl/server";
import Handmade from "@/components/sections/Handmade";
import Hero from "@/components/sections/Hero";
import InstagramGrid from "@/components/sections/InstagramGrid";
import Location from "@/components/sections/Location";
import MarqueeBand from "@/components/sections/MarqueeBand";
import MisuMiyu from "@/components/sections/MisuMiyu";
import SmashAnatomy from "@/components/sections/SmashAnatomy";
import TheHits from "@/components/sections/TheHits";
import Zone from "@/components/sections/Zone";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
      <MarqueeBand />
      <TheHits />
      <SmashAnatomy />
      <Handmade />
      <Zone />
      <MisuMiyu />
      <InstagramGrid />
      <Location />
      {process.env.NODE_ENV !== "production" && (
        // dev: lab-check round-trip testi için
        <Link href="/lab" data-testid="nav-lab" className="sr-only focus:not-sr-only">
          lab
        </Link>
      )}
    </main>
  );
}
