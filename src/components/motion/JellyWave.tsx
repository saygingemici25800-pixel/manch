"use client";

import { useRef } from "react";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface Props {
  /** dolgu = bir sonraki section'ın rengi (CSS değeri) */
  fill?: string;
  className?: string;
}

/** R9 — Alt kenar dalgası; scroll hızına göre scaleY 1→1.08 elastik esner (transform-origin bottom). */
export default function JellyWave({ fill = "var(--color-cream)", className }: Props) {
  const root = useRef<SVGSVGElement>(null);
  const setScale = useRef<((v: number) => void) | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !root.current) return;
      gsap.set(root.current, { transformOrigin: "50% 100%" });
      setScale.current = gsap.quickTo(root.current, "scaleY", {
        duration: 0.9,
        ease: "elastic.out(1, 0.4)",
      });
      return () => {
        setScale.current = null;
      };
    },
    { dependencies: [reduced], revertOnUpdate: true },
  );

  useLenis(({ velocity }) => {
    const q = setScale.current;
    if (!q || reduced) return;
    q(1 + Math.min(Math.abs(velocity) / 40, 1) * 0.08);
  }, [reduced]);

  return (
    <svg
      ref={root}
      aria-hidden="true"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={clsx("block w-full h-[6vw] max-md:h-[14vw]", className)}
    >
      <path
        d="M0 60 C 240 0, 480 120, 720 60 S 1200 0, 1440 60 L 1440 120 L 0 120 Z"
        fill={fill}
      />
    </svg>
  );
}
