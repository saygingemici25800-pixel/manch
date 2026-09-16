"use client";

import { useRef } from "react";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface Props {
  /** Kural 18: font-pixel → sadece İngilizce metin */
  items: string[];
  direction?: 1 | -1;
  /** derece */
  tilt?: number;
  /** saniye/tur */
  duration?: number;
  className?: string;
}

/** R14 — Pixel font bordo bant; sonsuz kayar, scroll hızıyla hızlanır. */
export default function Marquee({
  items,
  direction = 1,
  tilt = -4,
  duration = 18,
  className,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      tween.current = gsap.to(".track", {
        xPercent: -50 * direction,
        duration,
        ease: "none",
        repeat: -1,
      });
      // direction -1: ters yönde başlat (xPercent 0 → +50 görünmesin diye -50'den başla)
      if (direction === -1) tween.current.progress(0.5);
    },
    { scope: root, dependencies: [reduced, direction, duration], revertOnUpdate: true },
  );

  // Scroll hızı → timeScale (1 … 5), bırakınca yumuşakça 1'e döner
  useLenis(({ velocity }) => {
    const t = tween.current;
    if (!t || reduced) return;
    const boost = 1 + Math.min(Math.abs(velocity) / 12, 4);
    gsap.to(t, { timeScale: boost, duration: 0.25, overwrite: true, onComplete: () => {
      gsap.to(t, { timeScale: 1, duration: 1.2, ease: "power2.out", overwrite: true });
    } });
  }, [reduced]);

  const line = items.join("  —  ") + "  —  ";

  return (
    <div
      ref={root}
      aria-label={items.join(", ")}
      role="marquee"
      // eğik bant kenarları görünmesin diye %110 genişlik
      className={clsx("relative w-[110%] -ml-[5%] overflow-hidden bg-berry text-cream", className)}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div
        className={clsx(
          "track flex w-max whitespace-nowrap font-pixel uppercase",
          "text-[1.2vw] max-md:text-[3.6vw] py-[0.6vw] max-md:py-[2vw]",
        )}
      >
        <span className="px-[1vw]">{line}</span>
        <span className="px-[1vw]" aria-hidden="true">{line}</span>
      </div>
    </div>
  );
}
