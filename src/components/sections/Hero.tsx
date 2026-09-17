import { getTranslations } from "next-intl/server";
import JellyWave from "@/components/motion/JellyWave";
import SplitReveal from "@/components/motion/SplitReveal";
import Placeholder from "@/components/ui/Placeholder";
import HeroBurger from "./HeroBurger";
import { site } from "@/lib/site";

/** R9 — tam ekran görsel (şimdilik Placeholder), hardal Modak char reveal, dönen Misu&Miyu rozeti, jelly dalga. */
export default async function Hero() {
  const t = await getTranslations("Home.hero");
  const badge = t("badge");
  return (
    <section data-nav-dark className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-berry text-cream">
      {/* TODO(Faz 7): gerçek görsel /images/hero-smash.jpg next/image ile; şimdilik CSS katmanlı burger (karar 2026-09-17) */}
      <div aria-hidden="true" className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,.04)_0_1.2vw,transparent_1.2vw_2.4vw)]" />
      <div className="absolute left-1/2 top-[52%] max-md:top-[38%] -translate-x-1/2 -translate-y-1/2 max-md:h-[70vw]">
        <HeroBurger />
      </div>

      {/* dönen rozet */}
      <div className="absolute right-[4vw] top-[8vw] max-md:right-[5vw] max-md:top-[26vw] grid h-[14vw] w-[14vw] max-md:h-[34vw] max-md:w-[34vw] place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin_16s_linear_infinite] motion-reduce:animate-none" aria-hidden="true">
          <defs><path id="hero-ring" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" /></defs>
          <text className="fill-mustard font-pixel text-[7.2px] uppercase tracking-[0.18em]"><textPath href="#hero-ring">{badge}{badge}</textPath></text>
        </svg>
        {/* TODO(Faz 7): Misu & Miyu line-art */}
        <Placeholder tone="sky" label={site.mascots.label} ratio="1/1" className="h-[58%] w-[58%] rounded-full!" />
      </div>

      <div className="relative z-1 px-[2.5vw] pb-[7vw] max-md:px-[5vw] max-md:pb-[20vw] pt-[30vh]">
        <SplitReveal
          as="h1"
          mode="chars"
          text={t("title")}
          start="top 100%"
          className="max-w-[80vw] max-md:max-w-none font-display text-[9.5vw] max-md:text-[17vw] leading-[0.9] text-mustard [-webkit-text-stroke:0.02em_var(--color-berry-dk)]"
        />
        <p className="mt-[1.5vw] max-md:mt-[5vw] text40 text-[1.4vw] max-md:text-[4.5vw] text-cream/90">{t("sub")}</p>
      </div>

      <JellyWave fill="var(--color-cream)" className="relative z-1 -mb-px" />
    </section>
  );
}
