"use client";

import { useRef } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

type Props = {
  children: React.ReactNode;
  /** Render edilecek etiket. */
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** chars = harf harf (kısa başlık) · lines = satır maskesi (paragraf). */
  type?: "chars" | "lines";
  /**
   * "scroll" (varsayılan): ScrollTrigger ile, Kural 50 fold kuralına tabi.
   * "mount": mount anında hemen oynar, ScrollTrigger kurulmaz — talep üzerine açılan
   * overlay/modal içeriği için (tetikleyici kaçırma riski yok, Kural 50 istisnası).
   */
  trigger?: "scroll" | "mount";
  stagger?: number;
  duration?: number;
  className?: string;
};

/**
 * SplitText ile satır/harf maskeli giriş.
 *
 * **Kural 50 (fold kuralı):** ilk boyamada viewport içinde olan öğe **animasyonsuz görünür**
 * başlar — hiç gizlenmez, hiç ScrollTrigger kurulmaz. Animasyon yalnızca fold altındaki
 * öğelere uygulanır. Sebep: eski sitede batch/scrub tetiklenmeyince öğeler `opacity:0`'da
 * kalıyordu (/tr/menu'de 8 karttan 1'i görünüyordu).
 *
 * SSR'da düz metin render eder (Kural 46) — animasyon modül gelince başlar.
 */
export function SplitReveal({
  children,
  as = "p",
  type = "lines",
  trigger = "scroll",
  stagger = 0.06,
  duration = 0.8,
  className,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  const reduced = useReducedMotion();

  useLazyGsap(
    (g) => {
      const el = ref.current;
      if (!el || reduced) return;

      // Kural 50: scroll modunda fold üstü → dokunma, zaten görünür.
      if (trigger === "scroll" && el.getBoundingClientRect().top < window.innerHeight) return;

      const split = new g.SplitText(el, { type, mask: type, autoSplit: true });
      const targets = type === "chars" ? split.chars : split.lines;
      if (!targets?.length) {
        split.revert();
        return;
      }

      const tween = g.gsap.from(targets, {
        yPercent: 120,
        duration,
        stagger,
        ease: "power3.out",
        ...(trigger === "scroll"
          ? { scrollTrigger: { trigger: el, start: "top 88%", once: true } }
          : {}),
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        split.revert();
      };
    },
    [reduced, type, trigger, stagger, duration],
  );

  // Kural 25: dinamik etiket `createElement(as, { ref })` değil, JSX değişkeniyle.
  const Tag = as;
  return (
    <Tag ref={ref as React.Ref<HTMLHeadingElement>} className={className}>
      {children}
    </Tag>
  );
}
