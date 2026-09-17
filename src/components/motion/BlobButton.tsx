"use client";

import clsx from "clsx";
import { useRef } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  /** Erişilebilir ad; içerik zaten metinse gerekmez (Kural 40). */
  ariaLabel?: string;
};

/** R7 organik blob (brief: viewBox -10 -10 602 475). */
const BLOB_D =
  "M296,8 C420,4 530,52 566,140 C602,228 566,330 470,394 C374,458 232,466 138,420 " +
  "C44,374 -2,272 12,180 C26,88 104,20 196,10 C230,6 262,9 296,8 Z";

/**
 * R7: organik SVG blob, beyaz 10px stroke, berry dolgu; hover'da path hafifçe esner.
 * Kural 27: `data-cursor-hide` açıkça işaretlenir.
 * Reduced motion: wobble yok, sadece dolgu rengi değişir.
 */
export function BlobButton({ children, onClick, className, ariaLabel }: Props) {
  const root = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || reduced) return;

      // Kural 25: hedefler render'da değil, effect içinde selector ile alınır.
      const path = el.querySelector("path");
      if (!path) return;

      const tween = g.gsap.to(path, {
        attr: { d: BLOB_D.replace("566,140", "578,128").replace("138,420", "126,432") },
        duration: 2.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        paused: true,
      });

      const enter = () => tween.play();
      const leave = () => tween.pause().progress(0);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);

      return () => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
        tween.kill();
      };
    },
    [reduced],
  );

  return (
    <button
      ref={root}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      data-cursor-hide
      className={clsx(
        "group/blob relative inline-grid place-items-center transition-transform duration-300",
        !reduced && "hover:scale-105",
        className,
      )}
    >
      <svg
        viewBox="-10 -10 602 475"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <path
          d={BLOB_D}
          className="fill-berry stroke-cream transition-colors duration-300 group-hover/blob:fill-berry-dk"
          strokeWidth={10}
        />
      </svg>
      <span className="relative z-10 px-[2vw] py-[1vw] font-ui uppercase tracking-[0.08em] text-cream max-md:px-[6vw] max-md:py-[3vw]">
        {children}
      </span>
    </button>
  );
}
