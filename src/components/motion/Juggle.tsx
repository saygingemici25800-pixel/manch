"use client";

import clsx from "clsx";
import { useRef } from "react";

import { IngredientIcon, INGREDIENTS, type Ingredient } from "@/components/ui/IngredientIcon";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useZoneStore } from "@/store/zone";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

type Props = {
  items?: readonly Ingredient[];
  className?: string;
};

/**
 * R18: malzeme ikonları sırayla zıplar (footer).
 * `--juggle-scale` ile ölçek, `y` ile zıplama; stagger döngüsel.
 * Reduced motion: zıplama yok, ikonlar dizili durur.
 * Zone perdesi açıkken tween duraklar (footer zaten görünmüyor).
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

      /* Zone perdesi açıkken (state !== "closed") tween DURAKLAR: perde `fixed inset-0
         z-100`, footer o sırada görünmüyor bile — boşa dönen animasyon 3D sahnenin kare
         bütçesinden çalıyor. Kapanınca kaldığı yerden devam eder. Abonelik effect'in
         İÇİNDE: React hiç render etmez, Kural 25 ihlali yok. (Karar 2026-09-20; band
         genişletmesi geri alındı ama bu davranış korunuyor.) */
      const uygula = (st: string) => (st === "closed" ? tl.resume() : tl.pause());
      uygula(useZoneStore.getState().state);
      const cikis = useZoneStore.subscribe((z, prev) => {
        if (z.state !== prev.state) uygula(z.state);
      });

      return () => {
        cikis();
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
