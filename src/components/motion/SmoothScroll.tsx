"use client";

import { useEffect } from "react";

import { loadGsap } from "@/lib/gsap-loader";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLenisStore } from "@/lib/lenis-store";

/** Kural 25: kütüphane nesnesi mutasyonu modül seviyesinde plain fonksiyonda. */
function applyLerp(lenis: { options: { lerp: number } } | null, instant: boolean) {
  if (lenis) lenis.options.lerp = instant ? 1 : 0.1;
}

/**
 * R19 — Lenis + GSAP ticker.
 *
 * Kural 24 (revize 2026-09-18): `lenis/react` provider'ı KULLANILMIYOR — ilk yükleme JS'ine
 * 21.6 kB gz ekliyordu (Kural 46). Lenis çekirdeği effect içinde `import()` ile gelir,
 * örnek `lenis-store`'a yazılır; tüketiciler oradan okur. Ağaç sarmalanmadığı için
 * `children` normal SSR edilir.
 *
 * Ticker: `lenis.raf()` sonrası **`ScrollTrigger.update()`** de çağrılır — Lenis'in kendi
 * scroll event köprüsü tek başına güvenilir değil (Faz 6 hata günlüğü).
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;

    /* Lenis + GSAP de ilk boyamadan SONRA (Kural 46 · `lib/gsap-loader`): ikisi birlikte
       ~70 kB gz ve hydration anında inince LCP görseliyle bant genişliği yarışıyorlar.
       Gelene kadar sayfa NATIVE scroll ile çalışır — tüketiciler zaten `lenis?.` ile
       korunuyor (Kural 24), yani eksik bir davranış oluşmaz, yalnızca yumuşatma geç başlar. */
    void loadGsap()
      .then((g) => Promise.all([import("lenis"), Promise.resolve(g)]))
      .then(
      ([{ default: Lenis }, { gsap, ScrollTrigger }]) => {
        if (cancelled) return;
        const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
        useLenisStore.getState().setLenis(lenis);

        const update = (time: number) => {
          lenis.raf(time * 1000);
          ScrollTrigger.update();
        };
        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);
        lenis.on("scroll", ScrollTrigger.update);

        dispose = () => {
          gsap.ticker.remove(update);
          gsap.ticker.lagSmoothing(500, 33);
          lenis.off("scroll", ScrollTrigger.update);
          lenis.destroy();
          useLenisStore.getState().setLenis(null);
        };
      },
      )
      // Uçuştaki chunk isteği gezinmede iptal olabilir → smooth scroll devre dışı kalır,
      // sayfa native scroll ile çalışmaya devam eder.
      .catch(() => {});

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  // Sistem reduced-motion'ı Lenis kendisi izler; bu köprü /lab override'ı için.
  const lenis = useLenisStore((s) => s.lenis);
  useEffect(() => {
    applyLerp(lenis, reduced);
  }, [lenis, reduced]);

  return <>{children}</>;
}
