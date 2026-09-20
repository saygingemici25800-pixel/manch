"use client";

import clsx from "clsx";
import { useRef } from "react";

import { IngredientIcon, INGREDIENTS, type Ingredient } from "@/components/ui/IngredientIcon";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useZoneStore } from "@/store/zone";
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
const LAG = [0, 0.37, 0.72, 1.09]; // faz kayması (sn)
/** Havada geçen süre — genlikten TÜRETİLİR (aşağıya bak), bu yalnız referans tempo. */
const AIR = 0.62;
/** `AIR`'ın ölçeklendiği referans genlik (px). */
const REF_AMP = 220;
/** İkon başına tempo çarpanı — periyotlar birbirinin katı olmasın diye. */
const PACE = [1, 1.13, 0.9, 1.07];
/**
 * Yatay gezinme: bandın genişliğinin oranı (işaret = yön). Şeritler BİLEREK üst üste
 * biniyor — desktop menziller ≈ [11,53] [9,35] [30,60] [37,83] % → yollar kesişiyor.
 * Kenara yapışma yok: menzil `[pad, bandW - ikon - pad]` aralığına kırpılıyor.
 */
const XAMP = [0.42, -0.26, -0.3, -0.46];
/** Yatay periyotlar — dikey periyotların da birbirlerinin de katı DEĞİL. */
const XDUR = [2.3, 2.9, 2.6, 3.4];
/** Yatay yerleşim — masaüstü 4 ikon, mobil 3 (dördüncüsü `max-md:hidden`). */
const LEFT = ["11%", "35%", "60%", "83%"];
const LEFT_M = ["10%", "44%", "76%", "76%"];

/**
 * R18: malzeme ikonları zıplar (footer + /lab).
 * `--juggle-scale` zıplama yüksekliğini çarpar (kapsayıcıdan okunur), `y` ile zıplama.
 * Fizik hissi: yukarı yavaşlayarak (`power2.out`), aşağı hızlanarak (`power2.in`),
 * yere değince kısa bir ezilme (0.16 sn) — süre genlikten türetilir (t ∝ √h),
 * böylece top gibi davranır ve zeminde beklemez.
 * Reduced motion: zıplama yok, ikonlar dizili/dizilmiş durur.
 * Zone perdesi açıkken tween'ler duraklar (footer zaten görünmüyor).
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

      /* Zone perdesi açıkken (state !== "closed") tween'ler DURAKLAR: perde `fixed
         inset-0 z-100`, footer o sırada görünmüyor bile — 8 tween'in boşa dönmesi
         3D sahnenin kare bütçesinden çalıyor. Kapanınca kaldığı yerden devam eder.
         Abonelik effect'in İÇİNDE: React hiç render etmez, Kural 25 ihlali yok. */
      const duraklat = (tweens: { pause: () => void; resume: () => void }[]) => {
        const uygula = (st: string) => tweens.forEach((t) => (st === "closed" ? t.resume() : t.pause()));
        uygula(useZoneStore.getState().state);
        return useZoneStore.subscribe((z, prev) => {
          if (z.state !== prev.state) uygula(z.state);
        });
      };

      if (!field) {
        const tl = g.gsap.timeline({ repeat: -1 }).to(icons, {
          y: -18 * k,
          scale: 1.12,
          duration: 0.42,
          ease: "power2.out",
          stagger: { each: 0.12, repeat: 1, yoyo: true },
        });
        const cikis = duraklat([tl]);
        return () => {
          cikis();
          tl.kill();
          g.gsap.set(icons, { clearProps: "transform" });
        };
      }

      const band = el.clientHeight;
      const bandW = el.clientWidth;
      const tls = [...icons].map((li, i) => {
        const iw = li.offsetWidth;
        const amp = Math.max(24, (band - li.offsetHeight) * RISE[i % RISE.length] * k);
        /* Süre GENLİKTEN türetiliyor: serbest düşüşte t ∝ √h. İki kazancı var —
           (a) top hissi doğru oluyor, alçak zıplayan ikon hızlı zıplıyor; eskiden süre
           sabitti ve alçak genlikliler havada süzülüyordu ("zeminde bekliyor" hissi),
           (b) farklı genlikler periyotları kendiliğinden ayırıyor. */
        const d = AIR * Math.sqrt(amp / REF_AMP) * PACE[i % PACE.length];
        /* Yere değme süresi de `d` ile ölçekleniyor. Sabit 0.16 sn bırakılmıştı ve
           mobilde zıplamalar kısaldığı için döngünün **%20'sini** yiyordu ("zeminde
           bekliyor" hissi tam buydu — ölçüldü). Ölçekli hâlde her kırılımda ~%10. */
        const yer = Math.max(0.09, 0.16 * (d / AIR));
        g.gsap.set(li, { transformOrigin: "50% 100%" }); // ezilme tabandan olsun
        const tl = g.gsap
          .timeline({ repeat: -1, delay: LAG[i % LAG.length] })
          .to(li, { y: -amp, scaleX: 0.94, scaleY: 1.08, duration: d, ease: "power2.out" })
          .to(li, { y: 0, scaleX: 1, scaleY: 1, duration: d, ease: "power2.in" })
          .to(li, { scaleX: 1.18, scaleY: 0.82, duration: yer * 0.34, ease: "power2.out" })
          .to(li, { scaleX: 1, scaleY: 1, duration: yer * 0.66, ease: "power2.out" });

        /* Yatay gezinme AYRI tween ve GENİŞ: ikonlar kendi şeritlerinde kalmıyor,
           menziller üst üste biniyor → yollar kesişiyor. Periyot dikeyin katı değil,
           bu yüzden kesişmeler her turda başka noktada oluyor. */
        const pad = iw * 0.15;
        const base = li.offsetLeft;
        const hedef = bandW * XAMP[i % XAMP.length];
        const x = Math.max(-base + pad, Math.min(bandW - iw - base - pad, hedef));
        const xt = g.gsap.fromTo(
          li,
          { x: 0 },
          { x, duration: XDUR[i % XDUR.length], ease: "sine.inOut", yoyo: true, repeat: -1, delay: LAG[i % LAG.length] * 0.6 },
        );
        return [tl, xt];
      });

      const cikis = duraklat(tls.flat());
      return () => {
        cikis();
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
