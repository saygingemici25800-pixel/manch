"use client";

import { useRef } from "react";
import type { Product } from "@/data/menu";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";
import ProductCard from "./ProductCard";

/** Kartların girişi tek ScrollTrigger.batch ile (y 64→0, opacity 0→1, stagger). */
interface Props {
  products: Product[];
  onSelect?: (slug: string) => void;
  /** ilk kart = sayfanın LCP adayı → priority (diğerleri varsayılan; Kural 45: eager da preload üretir) */
  eager?: boolean;
}

export default function ProductGrid({ products, onSelect, eager }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Kural 36: dizi kimliği yerine kararlı anahtar
  const key = products.map((p) => p.slug).join(",");

  useLazyGsap(
    ({ gsap, ScrollTrigger }) => {
      if (reduced) return;
      gsap.set(".product-card", { y: 64, opacity: 0 });
      ScrollTrigger.refresh(); // filtre değişince yükseklikler değişir
      ScrollTrigger.batch(".product-card", {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1, overwrite: true }),
      });
    },
    [reduced, key],
    root,
  );

  return (
    <div ref={root} className="grid grid-cols-3 max-md:grid-cols-1 gap-[2vw] max-md:gap-[6vw]">
      {products.map((p, i) => (
        <ProductCard key={p.slug} product={p} onSelect={onSelect} loadHint={eager && i === 0 ? "priority" : undefined} />
      ))}
    </div>
  );
}
