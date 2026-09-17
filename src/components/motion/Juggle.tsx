"use client";

import clsx from "clsx";
import { useRef } from "react";

import { IngredientIcon, INGREDIENTS, type Ingredient } from "@/components/ui/IngredientIcon";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

type Props = {
  items?: readonly Ingredient[];
  className?: string;
};

/**
 * R18: malzeme ikonları sırayla zıplar (footer).
 * `--juggle-scale` ile ölçek, `y` ile zıplama; stagger döngüsel.
 * Reduced motion: zıplama yok, ikonlar dizili durur.
 */
export function Juggle({ items = INGREDIENTS, className }: Props) {
  const root = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || reduced) return;
      const icons = el.querySelectorAll("[data-juggle]");
      if (!icons.length) return;

      const tl = g.gsap.timeline({ repeat: -1 }).to(icons, {
        y: -18,
        scale: 1.12,
        duration: 0.42,
        ease: "power2.out",
        stagger: { each: 0.12, repeat: 1, yoyo: true },
      });

      return () => {
        tl.kill();
        g.gsap.set(icons, { clearProps: "transform" });
      };
    },
    [reduced],
  );

  return (
    <ul ref={root} className={clsx("flex items-end gap-[1.2vw] max-md:gap-[4vw]", className)}>
      {items.map((name) => (
        <li key={name} data-juggle className="will-change-transform">
          <IngredientIcon name={name} className="h-[2vw] w-[2vw] max-md:h-[7vw] max-md:w-[7vw]" />
        </li>
      ))}
    </ul>
  );
}
