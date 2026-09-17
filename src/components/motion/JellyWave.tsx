"use client";

import clsx from "clsx";
import { useLenis } from "lenis/react";
import { useRef } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

type Props = {
  /** Dalganın dolgu rengi = bir sonraki section'ın zemini. */
  fillClass?: string;
  /** Üstte mi altta mı (alt kenar dalgası varsayılan). */
  flip?: boolean;
  className?: string;
};

/**
 * R9: section alt kenarındaki jöle dalga — scroll hızına göre `scaleY` 1 → ~1.08 esner.
 * `quickTo` ile yumuşak takip; transform-origin alt kenar.
 * Reduced motion: esneme yok, dalga statik render edilir (şekil korunur).
 */
export function JellyWave({ fillClass = "fill-cream", flip = false, className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const lenis = useLenis();

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || reduced) return;
      const svg = el.querySelector("svg");
      if (!svg) return;

      const setScale = g.gsap.quickTo(svg, "scaleY", { duration: 0.5, ease: "power3.out" });

      const onScroll = (e: { velocity: number }) => {
        setScale(1 + Math.min(0.08, Math.abs(e.velocity) * 0.004));
      };
      lenis?.on("scroll", onScroll);

      return () => {
        lenis?.off("scroll", onScroll);
        g.gsap.set(svg, { scaleY: 1 });
      };
    },
    [reduced, lenis],
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={clsx("pointer-events-none w-full overflow-hidden leading-[0]", className)}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block h-[5vw] w-full origin-bottom max-md:h-[12vw]"
        style={flip ? { transform: "scaleY(-1)" } : undefined}
      >
        <path className={fillClass} d="M0,40 Q360,0 720,40 T1440,40 L1440,80 L0,80 Z" />
      </svg>
    </div>
  );
}
