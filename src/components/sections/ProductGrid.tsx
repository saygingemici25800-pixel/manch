"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import type { Product } from "@/data/menu";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import ProductCard from "./ProductCard";

/** Kartların girişi tek ScrollTrigger.batch ile (y 64→0, opacity 0→1, stagger). */
export default function ProductGrid({ products }: { products: Product[] }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      gsap.set(".product-card", { y: 64, opacity: 0 });
      ScrollTrigger.batch(".product-card", {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1, overwrite: true }),
      });
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="grid grid-cols-3 max-md:grid-cols-1 gap-[2vw] max-md:gap-[6vw]">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
