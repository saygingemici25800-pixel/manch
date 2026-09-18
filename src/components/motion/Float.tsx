"use client";

import clsx from "clsx";
import { useRef } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

/** Boşta hafif salınım (maskot, kesit). Reduced motion: sabit durur. */
export function Float({
  children,
  amount = 10,
  duration = 3.2,
  className,
}: {
  children: React.ReactNode;
  amount?: number;
  duration?: number;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || reduced) return;
      const tw = g.gsap.to(el, {
        y: -amount,
        rotate: amount * 0.12,
        duration,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      return () => {
        tw.kill();
        g.gsap.set(el, { clearProps: "transform" });
      };
    },
    [reduced, amount, duration],
  );

  return (
    <div ref={root} className={clsx("will-change-transform", className)}>
      {children}
    </div>
  );
}
