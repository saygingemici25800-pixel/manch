"use client";

import { useRef } from "react";

import { INGREDIENTS } from "@/components/ui/IngredientIcon";
import { colors } from "@/styles/tokens";
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
 * Renk: TEK renk + zemin kuralı (koyu zeminde krem, açık zeminde bordo).
 * Hale mekanizması kaldırıldı (kit geçişi 2026-09-28).
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

      /* ZEMİN KURALI (kit 2026-09-28): ikonlar TEK renk, hale yok — okunurluk
         tamamen zemine bağlı. Koyu zeminde krem, açık zeminde bordo.
         Zemin imlecin ALTINDAN okunuyor (`elementFromPoint` + ata zincirinde ilk
         saydam olmayan arka plan): `data-nav-dark` bölüm işareti nav BANDINI ölçer,
         imlecin altını değil — iki farklı soru. Katman `pointer-events-none`
         olduğu için kendini döndürmüyor.
         Her karede değil, ~10 Hz örnekleniyor: `getComputedStyle` pahalı. */
      let tick = 0;
      let koyu = true;
      const zeminKoyuMu = (x: number, y: number) => {
        let el = document.elementFromPoint(x, y) as Element | null;
        while (el) {
          const bg = getComputedStyle(el).backgroundColor;
          const m = bg.match(/\d+(\.\d+)?/g);
          if (m && (m.length < 4 || Number(m[3]) > 0.5)) {
            const [r, g2, b] = m.map(Number);
            return 0.2126 * r + 0.7152 * g2 + 0.0722 * b < 140;
          }
          el = el.parentElement;
        }
        return true; // zemin okunamadıysa krem (sayfa zeminleri ağırlıkla bordo)
      };

      const draw = () => {
        if (++tick % 6 === 0 && mx >= 0) {
          const k = zeminKoyuMu(mx, my);
          if (k !== koyu) {
            koyu = k;
            dot.style.color = k ? colors.cream : colors.berry;
          }
        }
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
        {INGREDIENTS.map((name) => (
          <span
            key={name}
            data-icon
            className="col-start-1 row-start-1 inline-block h-[1.4vw] w-[1.4vw] bg-current opacity-0"
            style={{
              maskImage: `url(/icons/${name}.svg)`,
              WebkitMaskImage: `url(/icons/${name}.svg)`,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskSize: "contain",
              WebkitMaskSize: "contain",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// next/dynamic ssr:false ile yüklenir (LayoutDeferred)
export default CursorTrail;
