"use client";

import { useRef } from "react";

import { INGREDIENT_INK, INGREDIENTS } from "@/components/ui/IngredientIcon";
import { useFinePointer } from "@/lib/hooks/useFinePointer";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

const TRAIL_POINTS = 14;

/**
 * R8: beyaz 2px iz + buzlu cam dairede dönen malzeme ikonu.
 * Yalnızca masaüstünde (hover + fine pointer) ve reduced motion kapalıyken.
 * Kural 27: `data-cursor-hide` **açıkça işaretlenen** elemanlarda gizlenir — otomatik
 * `button, a` selector'ı YOK.
 * Kural 31: koşullu `null` render eden component'te `useGSAP({ scope })` kullanılmaz —
 * ref effect içinde okunur, yoksa erken çıkılır.
 * Renkler: her malzeme kendi tokenını alır (`INGREDIENT_INK`); buzlu cam daire ve
 * beyaz iz değişmedi.
 */
export function CursorTrail() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const active = fine && !reduced;

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || !active) return;

      const path = el.querySelector<SVGPathElement>("[data-trail]");
      const dot = el.querySelector<HTMLElement>("[data-dot]");
      const icons = el.querySelectorAll<HTMLElement>("[data-icon]");
      if (!path || !dot) return;

      const pts: { x: number; y: number }[] = [];
      let mx = -100;
      let my = -100;
      let hidden = false;

      const toDot = {
        x: g.gsap.quickTo(dot, "x", { duration: 0.35, ease: "power3.out" }),
        y: g.gsap.quickTo(dot, "y", { duration: 0.35, ease: "power3.out" }),
      };

      const onMove = (e: PointerEvent) => {
        mx = e.clientX;
        my = e.clientY;
        toDot.x(mx);
        toDot.y(my);

        const over = (e.target as Element | null)?.closest?.("[data-cursor-hide]") != null;
        if (over !== hidden) {
          hidden = over;
          g.gsap.to(el, { autoAlpha: over ? 0 : 1, duration: 0.2 });
        }
      };

      const draw = () => {
        pts.push({ x: mx, y: my });
        if (pts.length > TRAIL_POINTS) pts.shift();
        path.setAttribute("d", pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" "));
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      g.gsap.ticker.add(draw);

      // Malzeme ikonu döngüsü
      const cycle = g.gsap.timeline({ repeat: -1 });
      icons.forEach((icon, i) => {
        cycle
          .set(icons, { autoAlpha: 0 }, i * 1.4)
          .to(icon, { autoAlpha: 1, rotate: 360, duration: 1.4, ease: "none" }, i * 1.4);
      });

      return () => {
        window.removeEventListener("pointermove", onMove);
        g.gsap.ticker.remove(draw);
        cycle.kill();
      };
    },
    [active],
  );

  if (!active) return null;

  return (
    <div
      ref={root}
      aria-hidden="true"
      data-testid="cursor-trail"
      className="pointer-events-none fixed inset-0 z-[60]"
    >
      <svg className="absolute inset-0 h-full w-full">
        <path data-trail fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" />
      </svg>
      <div
        data-dot
        className="absolute -left-[1.4vw] -top-[1.4vw] grid h-[2.8vw] w-[2.8vw] place-items-center rounded-full bg-cream/25 text-cream backdrop-blur-md"
      >
        {INGREDIENTS.map((name) => {
          const { color, halo } = INGREDIENT_INK[name];
          return (
            /* Hale DIŞ elemanda: CSS'te `filter` maskeden ÖNCE uygulanır, aynı elemana
               konsaydı maske haleyi de keserdi. Dış eleman `data-icon` kalıyor ki GSAP
               döngüsü (autoAlpha + rotate) hale ile birlikte çalışsın. */
            <span
              key={name}
              data-icon
              className="col-start-1 row-start-1 inline-block h-[1.4vw] w-[1.4vw] opacity-0"
              style={{ filter: `drop-shadow(0 0 1px ${halo}) drop-shadow(0 0 1px ${halo})` }}
            >
              <span
                data-icon-mask
                className="block h-full w-full"
                style={{
                  backgroundColor: color,
                  maskImage: `url(/icons/${name}.svg)`,
                  WebkitMaskImage: `url(/icons/${name}.svg)`,
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

// next/dynamic ssr:false ile yüklenir (LayoutDeferred)
export default CursorTrail;
