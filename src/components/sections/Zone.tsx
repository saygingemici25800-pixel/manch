import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Parallax } from "@/components/motion/Parallax";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { OrderCta } from "@/components/sections/OrderCta";
import { TileWall } from "@/components/ui/TileWall";
import { site } from "@/lib/site";

/** R13 — dalgalı üst kenar, karo duvar zemin, parallax burger, blob CTA. */
export async function Zone() {
  const t = await getTranslations("Home");

  return (
    <section id="zone" data-nav-dark="" className="relative scroll-mt-[6vw]">
      {/* dalgalı üst kenar */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" className="block h-[5vw] w-full max-md:h-[12vw]">
        <path className="fill-cream" d="M0,0 L1440,0 L1440,40 Q1080,90 720,45 T0,40 Z" />
      </svg>

      <TileWall size={72} className="grid grid-cols-2 items-center gap-[3vw] px-[3vw] pb-[6vw] pt-[6vw] max-md:grid-cols-1 max-md:gap-[7vw] max-md:px-[5vw] max-md:pb-[14vw] max-md:pt-[10vw]">
        <div>
          <p className="font-display text-[1vw] uppercase tracking-[0.2em] text-berry max-md:text-[3.4vw]">
            {t("zone.eyebrow")}
          </p>
          <SplitReveal as="h2" type="lines" className="heading180 text-[4.4vw] text-berry max-md:text-[12vw]">
            {t("zone.title")}
          </SplitReveal>
          <p className="mt-[1.2vw] max-w-[44ch] font-ui text-[1.1vw] text-berry-dk max-md:mt-[4vw] max-md:text-[4vw]">
            {t("zone.body")}
          </p>
          <p className="mt-[1.5vw] font-pixel text-[1.1vw] uppercase text-berry max-md:mt-[5vw] max-md:text-[3.4vw]">
            {site.wallQuote}
          </p>
          <div className="mt-[2vw] max-md:mt-[7vw]">
            <OrderCta />
          </div>
        </div>

        <Parallax distance={70}>
          <Image
            src="/burgers/on-tile/classic-manch.jpg"
            alt={t("zone.imageAlt")}
            width={1400}
            height={1050}
            quality={75}
            sizes="(min-width: 768px) 45vw, 90vw"
            className="w-full rounded-[2vw] object-cover max-md:rounded-[5vw]"
          />
        </Parallax>
      </TileWall>
    </section>
  );
}
