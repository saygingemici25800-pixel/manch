"use client";

import clsx from "clsx";
import { useRef } from "react";

import { IngredientIcon, INGREDIENTS, type Ingredient } from "@/components/ui/IngredientIcon";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

type Props = {
  items?: readonly Ingredient[];
  /**
   * Alan modu (footer): ikonlar sıraya dizilmek yerine kapsayıcının TÜM yüksekliğini
   * kullanır — her biri kendi yüksekliği, hızı ve faz gecikmesiyle zıplar. Kapsayıcı
   * `relative` olmalı. Varsayılan (false) satır modu /lab demosunda kullanılır.
   */
  field?: boolean;
  className?: string;
};

/* Alan modunda ikon başına kişilik — hepsi DETERMİNİST (Math.random yok): aynı kare
   her koşuda aynı çıksın, hem hydration hem ekran görüntüsü tekrarlanabilir olsun.
   Sayılar birbirinin katı DEĞİL; olsaydı faz farkı bir süre sonra kapanır ve ikonlar
   senkronize zıplamaya başlardı. */
const RISE = [0.92, 0.6, 0.8, 0.46]; // bandın oranı
const DUR = [1.15, 1.46, 0.93, 1.31]; // sn
const LAG = [0, 0.37, 0.72, 1.09]; // faz kayması (sn)
const SWAY = [1, -1.35, 0.8, -0.95]; // yatay sapma yönü/çarpanı
/** Yatay sapma genliği: 1.1vw (Kural 8 — vw tabanlı, dar ekranda kendiliğinden küçülür). */
const SWAY_VW = 0.011;
/** Yatay yerleşim — masaüstü 4 ikon, mobil 3 (dördüncüsü `max-md:hidden`). */
const LEFT = ["11%", "35%", "60%", "83%"];
const LEFT_M = ["10%", "44%", "76%", "76%"];

/**
 * R18: malzeme ikonları zıplar (footer + /lab).
 * `--juggle-scale` zıplama yüksekliğini çarpar (kapsayıcıdan okunur), `y` ile zıplama.
 * Fizik hissi: yukarı yavaşlayarak (`power2.out`), aşağı hızlanarak (`power2.in`),
 * yere değince kısa bir ezilme.
 * Reduced motion: zıplama yok, ikonlar dizili/dizilmiş durur.
 * Renk: tek renk (`text-mustard`) — karar 2026-09-20, CLAUDE.md bölüm 3.
 */
export function Juggle({ items = INGREDIENTS, field = false, className }: Props) {
  const root = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || reduced) return;
      const icons = el.querySelectorAll<HTMLElement>("[data-juggle]");
      if (!icons.length) return;

      // `--juggle-scale` gerçekten okunuyor (eskiden yalnız yorumda vardı, koda hiç
      // girmiyordu; Footer 0.7 tanımlayıp hiçbir şey elde etmiyordu).
      const k = Number.parseFloat(getComputedStyle(el).getPropertyValue("--juggle-scale")) || 1;

      if (!field) {
        const tl = g.gsap.timeline({ repeat: -1 }).to(icons, {
          y: -18 * k,
          scale: 1.12,
          duration: 0.42,
          ease: "power2.out",
          stagger: { each: 0.12, repeat: 1, yoyo: true },
        });
        return () => {
          tl.kill();
          g.gsap.set(icons, { clearProps: "transform" });
        };
      }

      const band = el.clientHeight;
      const sway = window.innerWidth * SWAY_VW;
      const tls = [...icons].map((li, i) => {
        const amp = Math.max(24, (band - li.offsetHeight) * RISE[i % RISE.length] * k);
        const d = DUR[i % DUR.length];
        const tl = g.gsap
          .timeline({ repeat: -1, delay: LAG[i % LAG.length] })
          .to(li, { y: -amp, scale: 1.1, duration: d, ease: "power2.out" })
          .to(li, { y: 0, scale: 1, duration: d * 0.82, ease: "power2.in" })
          .to(li, { scaleX: 1.14, scaleY: 0.84, duration: 0.08, ease: "power1.out" })
          .to(li, { scaleX: 1, scaleY: 1, duration: 0.16, ease: "power2.out" });
        // Yatay sapma AYRI bir tween: süresi dikeyin katı değil, böylece yörünge
        // kendini tekrar etmiyor (düz yukarı-aşağı görünmüyor).
        const xt = g.gsap.to(li, {
          x: SWAY[i % SWAY.length] * sway,
          duration: d * 1.63,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: LAG[i % LAG.length] * 0.5,
        });
        return [tl, xt];
      });

      return () => {
        tls.flat().forEach((t) => t.kill());
        g.gsap.set(icons, { clearProps: "transform" });
      };
    },
    [reduced, field],
  );

  return (
    <ul
      ref={root}
      aria-hidden={field || undefined}
      className={clsx(
        field
          ? "pointer-events-none absolute inset-x-0 top-0 bottom-[3vw] max-md:bottom-[15vw]"
          : "flex items-end gap-[1.2vw] max-md:gap-[4vw]",
        className,
      )}
    >
      {items.map((name, i) => (
        <li
          key={name}
          data-juggle
          className={clsx(
            "will-change-transform",
            // Kural 68: ölçü/konum SINIFTA, satır içi `style` yalnızca değişkeni taşır —
            // satır içi `left` yazsaydık `max-md:` karşılığı hiç çalışmazdı.
            field && "absolute bottom-0 left-[var(--jx)] max-md:left-[var(--jx-m)]",
            field && i >= 3 && "max-md:hidden", // mobilde 3 ikon (dar band, Kural 8)
          )}
          style={field ? ({ "--jx": LEFT[i % LEFT.length], "--jx-m": LEFT_M[i % LEFT_M.length] } as React.CSSProperties) : undefined}
        >
          <IngredientIcon name={name} className="h-[2vw] w-[2vw] max-md:h-[7vw] max-md:w-[7vw]" />
        </li>
      ))}
    </ul>
  );
}
