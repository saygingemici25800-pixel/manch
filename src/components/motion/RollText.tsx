"use client";

import clsx from "clsx";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface Props {
  text: string;
  className?: string;
}

/**
 * R6 — Hover'da üst kopya yukarı çıkar, alt kopya alttan gelir (300ms).
 * Ebeveyn `group` sınıfı taşımalı. GSAP gerekmez; saf CSS transform + transition.
 * Kural 9: ikinci kopya aria-hidden.
 */
export default function RollText({ text, className }: Props) {
  const reduced = useReducedMotion();
  const move = !reduced;
  return (
    <span className={clsx("relative inline-block overflow-hidden align-bottom", className)}>
      <span
        className={clsx(
          "block",
          move && "transition-transform duration-300 ease-out group-hover:-translate-y-full",
        )}
      >
        {text}
      </span>
      <span
        aria-hidden="true"
        className={clsx(
          "absolute inset-0 block",
          move
            ? "translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0"
            : "hidden",
        )}
      >
        {text}
      </span>
    </span>
  );
}
