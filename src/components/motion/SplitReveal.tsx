"use client";

import { useRef } from "react";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface Props {
  text: string;
  mode?: "chars" | "lines";
  as?: "p" | "h1" | "h2" | "h3" | "h4" | "span" | "div";
  className?: string;
  /** ScrollTrigger start; varsayılan görünür alana girince */
  start?: string;
  stagger?: number;
}

/**
 * SplitReveal — SplitText char / line-mask reveal. autoSplit: font yüklenince ve resize'da yeniden böler.
 * Reduced motion: düz metin.
 */
export default function SplitReveal({
  text,
  mode = "chars",
  as = "p",
  className,
  start = "top 85%",
  stagger,
}: Props) {
  // Kural 25: createElement(as,{ref}) lint'e takılır → JSX. Tüm tag'ler HTMLElement; tek tipe daraltılır.
  const Tag = as as "p";
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();

  useLazyGsap(
    ({ gsap, SplitText }) => {
      if (reduced || !ref.current) return;
      const split = SplitText.create(ref.current, {
        type: mode === "lines" ? "lines" : "chars,words",
        mask: mode,
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self[mode], {
            yPercent: 110,
            duration: mode === "lines" ? 0.9 : 0.7,
            ease: "power4.out",
            stagger: stagger ?? (mode === "lines" ? 0.08 : 0.02),
            scrollTrigger: { trigger: ref.current, start, once: true },
          }),
      });
      return () => split.revert();
    },
    [reduced, mode, text],
  );

  return (
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
