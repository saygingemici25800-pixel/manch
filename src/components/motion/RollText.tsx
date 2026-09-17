"use client";

import clsx from "clsx";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type Props = {
  children: string;
  className?: string;
};

/**
 * R6: hover'da üstteki kopya yukarı çıkar, alttaki alttan gelir (300 ms).
 * Saf CSS — GSAP gerekmez, ilk yükleme JS'ini şişirmez.
 * Kural 9: ikinci kopya `aria-hidden`.
 * Reduced motion: kaydırma yok, sadece renk/opaklık sabit kalır.
 */
export function RollText({ children, className }: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={clsx("group/roll relative inline-block overflow-hidden align-bottom", className)}>
      <span className="block transition-transform duration-300 ease-out group-hover/roll:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute left-0 top-full block transition-transform duration-300 ease-out group-hover/roll:-translate-y-full"
      >
        {children}
      </span>
    </span>
  );
}
