"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SplitReveal from "@/components/motion/SplitReveal";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

// üstten alta: brioche üst · sos · cheddar · köfte · köfte · turşu · marul · brioche alt
const LAYERS = [
  { key: "bunTop", w: 72, h: 14, color: "var(--color-paper)", radius: "50% 50% 14% 14% / 80% 80% 20% 20%" },
  { key: "sauce", w: 68, h: 4, color: "var(--color-berry)", radius: "999px" },
  { key: "cheddar", w: 74, h: 5, color: "var(--color-mustard)", radius: "6%" },
  { key: "patty1", w: 70, h: 8, color: "#6B3F2A", radius: "999px" },
  { key: "patty2", w: 70, h: 8, color: "#5A3222", radius: "999px" },
  { key: "pickle", w: 60, h: 4, color: "#7CBF6A", radius: "999px" },
  { key: "lettuce", w: 78, h: 5, color: "#9BD38A", radius: "40%" },
  { key: "bunBottom", w: 72, h: 9, color: "var(--color-paper)", radius: "14% 14% 50% 50% / 20% 20% 80% 80%" },
] as const;

/** R15 — pinned; katmanlar scroll'la dikey açılır, her katmanın etiketi belirir (Kural 32: pinType varsayılan). */
export default function SmashAnatomy() {
  const t = useTranslations("Home.anatomy");
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      const n = LAYERS.length;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ".pin", start: "top top", end: "+=140%", pin: true, scrub: 0.6 },
      });
      LAYERS.forEach((_, i) => {
        const offset = (i - (n - 1) / 2) * 1; // vw katsayısı
        tl.to(`.layer-${i}`, { y: `${offset * 4.2}vw`, ease: "none" }, 0);
        tl.fromTo(`.label-${i}`, { autoAlpha: 0, x: i % 2 ? 20 : -20 }, { autoAlpha: 1, x: 0, ease: "none" }, 0.25 + (i / n) * 0.6);
      });
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section ref={root} data-testid="anatomy" className="bg-paper text-berry-dk">
      <div className="pin relative flex h-[100svh] flex-col overflow-hidden px-[2.5vw] pt-[7vw] max-md:px-[5vw] max-md:pt-[22vw]">
        <div className="max-w-[46vw] max-md:max-w-none">
          <p className="font-display text-[1.3vw] max-md:text-[4.5vw] text-berry">{t("eyebrow")}</p>
          <SplitReveal as="h2" mode="lines" text={t("title")} className="text40 text-[3.6vw] max-md:text-[9vw] leading-[0.95] text-berry" />
        </div>

        <div className="relative mx-auto mt-auto mb-[6vw] max-md:mb-[16vw] flex h-[40vw] max-md:h-[100vw] w-[60vw] max-md:w-[90vw] items-center justify-center">
          {LAYERS.map((l, i) => (
            <div key={l.key} className={clsx(`layer-${i}`, "absolute flex items-center justify-center")} style={{ width: `${l.w}%`, zIndex: LAYERS.length - i }}>
              <div className="w-full shadow-[0_0.6vw_1.2vw_-0.4vw_rgba(78,16,48,.35)]" style={{ height: `${l.h * (0.55)}vw`, background: l.color, borderRadius: l.radius }} />
              <span className={clsx(`label-${i}`, "absolute whitespace-nowrap font-pixel text-[0.75vw] max-md:text-[2.6vw] uppercase tracking-widest opacity-0", i % 2 ? "left-[calc(100%+1.2vw)]" : "right-[calc(100%+1.2vw)]")}>
                {t(`layers.${l.key}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
