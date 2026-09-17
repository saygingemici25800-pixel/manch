"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface Props {
  children: ReactNode;
  /** toplam kayma, yüzde (negatif = yukarı) */
  amount?: number;
  className?: string;
}

/** Scroll'a bağlı yPercent parallax (scrub). Reduced motion: statik. */
export default function Parallax({ children, amount = -16, className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      gsap.fromTo(
        ".inner",
        { yPercent: -amount / 2 },
        { yPercent: amount / 2, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
      );
    },
    { scope: root, dependencies: [reduced, amount], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={className}>
      <div className="inner will-change-transform">{children}</div>
    </div>
  );
}
