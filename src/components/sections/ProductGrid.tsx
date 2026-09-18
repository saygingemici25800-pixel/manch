"use client";

import clsx from "clsx";
import { useMemo, useRef } from "react";

import { ProductCard } from "@/components/sections/ProductCard";
import type { Product } from "@/data/menu";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

type Props = {
  products: Product[];
  /** Kural 47: filtresiz ilk kart LCP adayı olabilir. */
  priorityFirst?: boolean;
  className?: string;
};

/**
 * R11 giriş animasyonu — tek `ScrollTrigger.batch` (kart içinde SplitText yok, Kural 33).
 *
 * **Kural 50 burada kritik.** Eski sitede batch tetiklenmeyince `/tr/menu` açılışında
 * 8 karttan 1'i görünüyordu. Bu yüzden:
 *   1. Kartlar CSS'te **görünür** başlar ve **ön-gizleme yapılmaz**.
 *   2. İlk boyamada viewport içinde olan kartlara hiç dokunulmaz (batch'e girmez).
 *   3. Fold altındakiler batch'e girer ama animasyon `from` ile kurulur — kart
 *      görünür durumdan başlar, tetiklenince gizliden görünüre oynar.
 * Böylece batch hiç çalışmasa bile tek bir kart bile kaybolmaz.
 */
export function ProductGrid({ products, priorityFirst, className }: Props) {
  const root = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();

  // Kural 36: deps primitive/kararlı olmalı.
  const key = useMemo(() => products.map((p) => p.slug).join(","), [products]);

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || reduced) return;

      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-product-card]"));
      // Kural 50: fold ÜSTÜ kartlar animasyona hiç girmez.
      const below = cards.filter((c) => c.getBoundingClientRect().top >= window.innerHeight);
      if (!below.length) return;

      // Kural 50'nin özü: kart **hiçbir zaman kalıcı olarak gizlenmez**.
      // `gsap.set(opacity:0)` ile ön-gizleme YOK — batch hiç tetiklenmezse kart öylece
      // görünür kalır (eski sitedeki "8 karttan 1'i görünüyor" hatası bu yüzden çıkmıştı).
      // Animasyon `from` ile yapılır: kart görünür durumdan başlar, tetiklenince
      // gizliden görünüre oynar. Tetikleyici `top 92%` — kart göz hizasına girmeden
      // önce çalışır, göze çarpan sıçrama olmaz.
      const batch = g.ScrollTrigger.batch(below, {
        start: "top 92%",
        once: true,
        onEnter: (targets) =>
          g.gsap.from(targets, {
            opacity: 0,
            y: 64,
            duration: 0.7,
            stagger: 0.09,
            ease: "power3.out",
            overwrite: "auto",
          }),
      });

      return () => {
        batch.forEach((st) => st.kill());
        g.gsap.set(cards, { clearProps: "opacity,transform" });
      };
    },
    [reduced, key],
  );

  return (
    <ul
      ref={root}
      data-product-grid=""
      className={clsx("grid grid-cols-3 gap-[2vw] max-md:grid-cols-1 max-md:gap-[6vw]", className)}
    >
      {products.map((p, i) => (
        <li key={p.slug}>
          <ProductCard product={p} priority={priorityFirst && i === 0} />
        </li>
      ))}
    </ul>
  );
}
