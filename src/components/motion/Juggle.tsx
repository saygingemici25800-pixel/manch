"use client";

import { useRef, type ReactNode } from "react";
import clsx from "clsx";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

interface Props {
  /** her biri bir malzeme ikonu */
  children: ReactNode[];
  className?: string;
}

/**
 * R18 — Malzeme ikonları fizik benzeri zıplar: yerçekimli yay (power1.in / out yoyo), hafif dönüş,
 * `--juggle-scale` ile yükseklik ölçeği (ebeveyn CSS var'ı). Reduced motion: statik.
 */
export default function Juggle({ children, className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLazyGsap(
    ({ gsap }) => {
      if (reduced || !root.current) return;
      const scale = parseFloat(getComputedStyle(root.current).getPropertyValue("--juggle-scale")) || 1;
      gsap.utils.toArray<HTMLElement>(".item").forEach((el, i) => {
        const h = gsap.utils.random(40, 90) * scale;
        const d = gsap.utils.random(0.55, 0.8);
        gsap
          .timeline({ repeat: -1, delay: i * 0.18 })
          .to(el, { y: -h, rotation: gsap.utils.random(-25, 25), duration: d, ease: "power1.out" })
          .to(el, { y: 0, rotation: 0, duration: d, ease: "power1.in" })
          // yere değince hafif squash
          .to(el, { scaleY: 0.85, scaleX: 1.12, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" });
      });
    },
    [reduced],
    root,
  );

  return (
    <div
      ref={root}
      className={clsx("flex items-end gap-[2vw] max-md:gap-[6vw] [--juggle-scale:1]", className)}
    >
      {children.map((c, i) => (
        <div key={i} className="item origin-bottom will-change-transform">
          {c}
        </div>
      ))}
    </div>
  );
}
