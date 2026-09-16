"use client";

import { useRef, type ReactNode } from "react";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** Aynı komut yapısına sahip iki blob (GSAP `attr.d` ile sayı sayı tween'lenir). */
function blobPath(seed: number): string {
  const cx = 291;
  const cy = 227;
  const rx = 280;
  const ry = 215;
  const n = 8;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    // deterministik "gürültü": seed'e göre yarıçap ±6%
    const wob = 1 + 0.06 * Math.sin(seed * 1.7 + i * 2.3) * Math.cos(seed + i);
    pts.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob]);
  }
  // Catmull-Rom → kübik bezier
  const k = 0.55 * (Math.PI * 2 / n) * 0.5;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

const REST = blobPath(1);
const WOBBLE = blobPath(7);

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

/** R7 — Organik SVG blob, beyaz 10px stroke, berry dolgu; hover'da wobble. */
export default function BlobButton({ children, className, onClick, ariaLabel }: Props) {
  const root = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  const { contextSafe } = useGSAP({ scope: root });

  // Kural 25: ref.current değil scope selector'ları (".wrap", "path")
  const wobble = contextSafe(() => {
    if (reduced) return;
    const tl = gsap.timeline({ overwrite: "auto" });
    tl.to("path", { attr: { d: WOBBLE }, duration: 0.35, ease: "sine.inOut" })
      .to("path", { attr: { d: REST }, duration: 0.5, ease: "elastic.out(1, 0.5)" }, ">")
      .to(".wrap", { scale: 1.05, duration: 0.3, ease: "power2.out" }, 0);
  });

  const settle = contextSafe(() => {
    if (reduced) return;
    gsap.to(".wrap", { scale: 1, duration: 0.4, ease: "power2.out", overwrite: "auto" });
  });

  return (
    <button
      ref={root}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={wobble}
      onFocus={wobble}
      onMouseLeave={settle}
      onBlur={settle}
      data-cursor-hide
      className={clsx(
        "group relative inline-grid place-items-center cursor-pointer border-0 bg-transparent p-0",
        "w-[14vw] max-md:w-[42vw] aspect-[602/475] text-cream font-display",
        "text-[1.9vw] max-md:text-[5.5vw] leading-none",
        className,
      )}
    >
      <span className="wrap absolute inset-0 block">
      <svg
        aria-hidden="true"
        viewBox="-10 -10 602 475"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <path
          d={REST}
          fill="var(--color-berry)"
          stroke="white"
          strokeWidth={10}
          strokeLinejoin="round"
          className="transition-[fill] duration-300 group-hover:fill-[var(--color-berry-dk)]"
        />
      </svg>
      </span>
      <span className="relative z-1 px-[1vw] text-center">{children}</span>
    </button>
  );
}
