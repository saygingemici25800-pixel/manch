"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { useMotionStore } from "@/lib/motion-store";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import BlobButton from "@/components/motion/BlobButton";
import JellyWave from "@/components/motion/JellyWave";
import Juggle from "@/components/motion/Juggle";
import IngredientIcon, { INGREDIENTS } from "@/components/ui/IngredientIcon";
import Marquee from "@/components/motion/Marquee";
import RollText from "@/components/motion/RollText";
import SplitReveal from "@/components/motion/SplitReveal";

const label = "font-pixel text-[0.8vw] max-md:text-[3vw] text-berry";

/** Kabul kriteri göstergesi: ScrollTrigger.getAll().length — sayfa değişimlerinde sıfırlanmalı. */
function ScrollTriggerCount() {
  const t = useTranslations("Motion");
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    // gsap lazy (Kural 46): sayaç modül yüklendikten sonra okur
    const w = window as Window & { __ST_COUNT?: () => number };
    const tick = () => setN(w.__ST_COUNT?.() ?? 0);
    tick();
    const id = window.setInterval(tick, 300);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span data-testid="st-count" className="rounded-full bg-ink px-[0.9vw] py-[0.3vw] max-md:px-[3vw] max-md:py-[1vw] font-pixel text-[0.8vw] max-md:text-[3vw] text-cream">
      {t("stCount", { n: n ?? 0 })}
    </span>
  );
}

function ReducedMotionToggle() {
  const t = useTranslations("Motion");
  const forced = useMotionStore((s) => s.forceReduced);
  const set = useMotionStore((s) => s.setForceReduced);
  const effective = useReducedMotion();
  return (
    <button
      type="button"
      data-testid="rm-toggle"
      aria-pressed={effective}
      onClick={() => set(forced === null ? !effective : null)}
      className={clsx(
        "rounded-full px-[1.2vw] py-[0.4vw] max-md:px-[4vw] max-md:py-[1.5vw] text-[1vw] max-md:text-[3.5vw] uppercase tracking-wide",
        effective ? "bg-mustard text-ink" : "bg-berry text-cream",
      )}
    >
      {t("rmToggle")}: {effective ? t("on") : t("off")}
      {forced !== null && <> · {t("emulated")}</>}
    </button>
  );
}

export default function MotionLab() {
  const t = useTranslations("Motion");
  const marqueeItems = t("marqueeItems").split("|");
  const icons = INGREDIENTS.slice(0, 4).map((n) => <IngredientIcon key={n} name={n} className="h-[3vw] w-[3vw] max-md:h-[9vw] max-md:w-[9vw] text-mustard" />);

  return (
    <div className="flex flex-col gap-[3vw] max-md:gap-[8vw]">

      <div className="flex flex-wrap items-center gap-[1vw] max-md:gap-[3vw]">
        <ReducedMotionToggle />
        <ScrollTriggerCount />
      </div>

      {/* R6 */}
      <div className="flex flex-col gap-[0.6vw] max-md:gap-[2vw]">
        <code className={label}>RollText</code>
        <div className="flex flex-wrap gap-[1vw] max-md:gap-[3vw]">
          <button type="button" data-cursor-hide className="group rounded-full bg-berry px-[1.6vw] py-[0.6vw] max-md:px-[5vw] max-md:py-[2vw] text40 text-[1.2vw] max-md:text-[4vw] text-cream transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-ink">
            <RollText text={t("rollA")} />
          </button>
          <button type="button" data-cursor-hide className="group rounded-full border-[0.15vw] border-berry px-[1.6vw] py-[0.6vw] max-md:px-[5vw] max-md:py-[2vw] text40 text-[1.2vw] max-md:text-[4vw] text-berry transition-[transform,background-color,color] duration-300 hover:scale-105 hover:bg-ink hover:text-cream hover:border-ink">
            <RollText text={t("rollB")} />
          </button>
        </div>
      </div>

      {/* R7 */}
      <div className="flex flex-col gap-[0.6vw] max-md:gap-[2vw]">
        <code className={label}>BlobButton</code>
        <BlobButton ariaLabel={t("blob")}>{t("blob")}</BlobButton>
      </div>

      {/* R14 */}
      <div className="flex flex-col gap-[0.6vw] max-md:gap-[2vw]">
        <code className={label}>Marquee · {t("marqueeNote")}</code>
        <div className="flex flex-col gap-[1.5vw] max-md:gap-[5vw] py-[2vw] max-md:py-[6vw] overflow-hidden">
          <Marquee items={marqueeItems} direction={1} />
          <Marquee items={marqueeItems} direction={-1} tilt={4} className="bg-berry-dk" />
        </div>
      </div>

      {/* SplitReveal */}
      <div className="flex flex-col gap-[0.6vw] max-md:gap-[2vw]">
        <code className={label}>SplitReveal · chars</code>
        <SplitReveal as="h3" mode="chars" text={t("splitChars")} className="font-display text-[6vw] max-md:text-[13vw] leading-none text-mustard [-webkit-text-stroke:0.02em_var(--color-berry)]" />
        <code className={label}>SplitReveal · lines</code>
        <SplitReveal as="p" mode="lines" text={t("splitLines")} className="max-w-[40vw] max-md:max-w-none text40 normal-case tracking-normal text-[2vw] max-md:text-[5.5vw] leading-[1.15] text-berry-dk" />
      </div>

      {/* R9 */}
      <div className="flex flex-col gap-[0.6vw] max-md:gap-[2vw]">
        <code className={label}>JellyWave · {t("jellyNote")}</code>
        <div data-nav-dark data-testid="dark-block" className="bg-berry pt-[6vw] max-md:pt-[14vw]">
          <p className="px-[2vw] pb-[2vw] font-display text-[3vw] max-md:text-[8vw] text-cream">{t("jellyText")}</p>
          <JellyWave fill="var(--color-cream)" />
        </div>
      </div>

      {/* R18 */}
      <div className="flex flex-col gap-[0.6vw] max-md:gap-[2vw]">
        <code className={label}>Juggle</code>
        <div className="rounded-[1vw] max-md:rounded-[3vw] bg-berry-dk p-[3vw] max-md:p-[8vw] pt-[8vw] max-md:pt-[20vw]">
          <Juggle>{icons}</Juggle>
        </div>
      </div>

      {/* R8 */}
      <p className="text-[1vw] max-md:text-[3.5vw] uppercase tracking-wide text-berry-dk">
        <code className={label}>CursorTrail</code> · {t("cursorNote")}
      </p>
    </div>
  );
}
