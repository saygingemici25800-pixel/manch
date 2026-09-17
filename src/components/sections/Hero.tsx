import { getTranslations } from "next-intl/server";
import JellyWave from "@/components/motion/JellyWave";
import Image from "next/image";
import Float from "@/components/motion/Float";
import Placeholder from "@/components/ui/Placeholder";
import { site } from "@/lib/site";

/** R9 — tam ekran görsel (şimdilik Placeholder), hardal Modak char reveal, dönen Misu&Miyu rozeti, jelly dalga. */
export default async function Hero() {
  const t = await getTranslations("Home.hero");
  const badge = t("badge");
  return (
    <section data-nav-dark className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-berry text-cream">
      {/* arka plan fotoğrafı + koyu berry gradient (%40) */}
      <Image
        src="/images/hero-cook.jpg"
        alt={t("imageAlt")}
        fill
        priority
        fetchPriority="high"
        quality={70}
        sizes="(max-width: 768px) 100vw, 100vw"
        className="object-cover object-[60%_30%]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(78,16,48,.35)_0%,rgba(78,16,48,.4)_45%,rgba(122,31,75,.85)_100%)]" />

      {/* kesit burger — desktop, Float ile */}
      <Float duration={4.2} className="absolute right-[6vw] top-[22vh] z-1 max-md:hidden">
        <div className="relative h-[34vw] w-[34vw] drop-shadow-[0_2vw_3vw_rgba(78,16,48,.6)]">
          <Image src="/burgers/classic-manch.png" alt={t("burgerAlt")} fill sizes="34vw" className="object-contain" />
        </div>
      </Float>

      {/* dönen rozet */}
      <div className="absolute left-[4vw] top-[9vw] max-md:left-auto max-md:right-[5vw] max-md:top-[26vw] z-1 grid h-[12vw] w-[12vw] max-md:h-[30vw] max-md:w-[30vw] place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin_16s_linear_infinite] motion-reduce:animate-none" aria-hidden="true">
          <defs><path id="hero-ring" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" /></defs>
          <text className="fill-mustard font-pixel text-[7.2px] uppercase tracking-[0.18em]"><textPath href="#hero-ring">{badge}{badge}</textPath></text>
        </svg>
        {/* TODO(Faz 7): Misu & Miyu line-art */}
        <Placeholder tone="sky" label={site.mascots.label} ratio="1/1" className="h-[58%] w-[58%] rounded-full!" />
      </div>

      <div className="relative z-1 px-[2.5vw] pb-[7vw] max-md:px-[5vw] max-md:pb-[20vw] pt-[30vh]">
        {/* Kural 47: hero H1 = LCP elementi → SplitText ile animasyonlanmaz (yeniden boyama LCP'yi animasyon sonuna kaydırıyordu) */}
        <h1 className="max-w-[80vw] max-md:max-w-none font-display text-[9.5vw] max-md:text-[17vw] leading-[0.9] text-mustard [-webkit-text-stroke:0.02em_var(--color-berry-dk)]">
          {t("title")}
        </h1>
        <p className="mt-[1.5vw] max-md:mt-[5vw] text40 text-[1.4vw] max-md:text-[4.5vw] text-cream">{t("sub")}</p>
      </div>

      <JellyWave fill="var(--color-cream)" className="relative z-1 -mb-px" />
    </section>
  );
}
