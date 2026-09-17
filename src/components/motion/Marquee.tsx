"use client";

import clsx from "clsx";
import { useLenis } from "lenis/react";
import { useRef } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

type Props = {
  items: string[];
  /** 1 = sola, -1 = sağa. */
  direction?: 1 | -1;
  /** Saniyede kaç piksel (temel hız). */
  speed?: number;
  /** Bant eğikliği (derece). */
  tilt?: number;
  className?: string;
};

/**
 * R14: bordo pixel-font bant, eğik, scroll hızına göre hızlanır.
 * Kural 28: metinler iki dilde de İngilizce (marka sesi tercihi).
 * SSR'da içerik görünür — animasyon modül gelince başlar (Kural 46).
 * Reduced motion: kayma durur, içerik olduğu gibi durur.
 */
export function Marquee({ items, direction = 1, speed = 60, tilt = -4, className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const lenis = useLenis();

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || reduced) return;
      const track = el.querySelector<HTMLElement>("[data-track]");
      if (!track) return;

      const half = track.scrollWidth / 2;
      if (half <= 0) return;

      const tl = g.gsap.timeline({ repeat: -1 }).to(track, {
        x: direction === 1 ? -half : 0,
        duration: half / speed,
        ease: "none",
      });
      g.gsap.set(track, { x: direction === 1 ? 0 : -half });

      // Scroll hızına göre timeScale — Lenis velocity'si (Kural 24).
      const onScroll = (e: { velocity: number }) => {
        tl.timeScale(Math.min(6, 1 + Math.abs(e.velocity) * 0.25));
      };
      lenis?.on("scroll", onScroll);

      return () => {
        lenis?.off("scroll", onScroll);
        tl.kill();
      };
    },
    [reduced, direction, speed, lenis],
  );

  const row = items.join("  ·  ");

  // Eğik bant geometrisi (2026-09-18): bant %115 genişlikte, köşeleri viewport dışına taşsın.
  // Döndürülen bandın dikey yarı-taşması = (genişlik/2)·sin(tilt) ≈ |tilt| vw → dış kutu
  // bu kadar dikey dolgu almazsa `overflow-hidden` bandı çapraz kesip kama şekline sokar.
  const padY = `${(Math.abs(tilt) * 1.1).toFixed(2)}vw`;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={clsx("w-full overflow-hidden", className)}
      style={{ paddingBlock: padY }}
    >
      <div
        className="w-[115%] bg-berry py-[0.6vw] max-md:py-[2vw]"
        style={{ transform: `translateX(-6.5%) rotate(${tilt}deg)` }}
      >
        <div data-track className="flex w-max whitespace-nowrap will-change-transform">
          {/* iki kopya = kesintisiz döngü */}
          <span className="px-[1vw] font-pixel text-[0.9vw] text-cream max-md:text-[2.6vw]">{row}</span>
          <span className="px-[1vw] font-pixel text-[0.9vw] text-cream max-md:text-[2.6vw]">{row}</span>
        </div>
      </div>
    </div>
  );
}
