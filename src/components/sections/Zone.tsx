import { getTranslations } from "next-intl/server";
import Parallax from "@/components/motion/Parallax";
import SplitReveal from "@/components/motion/SplitReveal";
import Placeholder from "@/components/ui/Placeholder";
import TileWall from "@/components/ui/TileWall";
import { site } from "@/lib/site";
import OrderCta from "./OrderCta";

/** R13 — United Chill Burger Zone: dalgalı üst kenar, karo duvar, duvar yazısı, blob CTA, parallax görsel. */
export default async function Zone() {
  const t = await getTranslations("Home.zone");
  return (
    <section id="zone" className="relative scroll-mt-[6vw]">
      {/* dalgalı üst kenar: cream → tile */}
      <svg aria-hidden="true" viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-[6vw] max-md:h-[14vw] w-full bg-cream">
        <path d="M0 120 C 240 40, 480 140, 720 80 S 1200 20, 1440 100 L 1440 120 Z" fill="var(--color-tile)" />
      </svg>
      <TileWall className="px-[2.5vw] pb-[8vw] pt-[12vw] max-md:px-[5vw] max-md:pb-[16vw] max-md:pt-[12vw]">
        <div className="grid grid-cols-[1.1fr_1fr] max-md:grid-cols-1 items-center gap-[4vw] max-md:gap-[10vw]">
          <div className="flex flex-col gap-[1.5vw] max-md:gap-[5vw]">
            <p className="font-display text-[1.3vw] max-md:text-[4.5vw] text-berry">{t("eyebrow")}</p>
            <SplitReveal as="h2" mode="chars" text={t("title")} className="font-display text-[6vw] max-md:text-[13vw] leading-[0.9] text-berry" />
            <p className="max-w-[34vw] max-md:max-w-none text40 text-[1.4vw] max-md:text-[4.5vw] normal-case tracking-normal text-berry-dk">{t("body")}</p>
            <OrderCta className="mt-[1vw] max-md:mt-[3vw]" />
          </div>
          <div className="flex flex-col gap-[2vw] max-md:gap-[6vw]">
            <Parallax amount={-18}>
              <Placeholder tone="berry" label={t("imageAlt")} ratio="4/5" className="w-full" />
            </Parallax>
            {/* duvar yazısı: mavi karo üzerinde bordo */}
            <p className="font-display text-center text-[3.2vw] max-md:text-[9vw] leading-[0.95] text-berry">{site.wallQuote}</p>
          </div>
        </div>
      </TileWall>
    </section>
  );
}
