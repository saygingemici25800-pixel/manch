"use client";

import clsx from "clsx";
import { useRef } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

/**
 * Scroll'a bağlı dikey kayma. Kural 50: içerik CSS'te görünür başlar —
 * ScrollTrigger hiç çalışmasa bile sadece hareket eksik olur, öğe kaybolmaz.
 */
export function Parallax({
  children,
  distance = 80,
  className,
}: {
  children: React.ReactNode;
  distance?: number;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || reduced) return;
      const tw = g.gsap.fromTo(
        el,
        { y: distance / 2 },
        {
          y: -distance / 2,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.5 },
        },
      );
      return () => {
        tw.scrollTrigger?.kill();
        tw.kill();
        g.gsap.set(el, { clearProps: "transform" });
      };
    },
    [reduced, distance],
  );

  return (
    <div ref={root} className={clsx("will-change-transform", className)}>
      {children}
    </div>
  );
}
