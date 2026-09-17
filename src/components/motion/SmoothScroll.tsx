"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type Lenis from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "@/i18n/navigation";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import type { GsapBundle } from "@/lib/hooks/useLazyGsap";

const LERP = 0.1;
const OPTIONS = { autoRaf: false, lerp: LERP };

// Kural 25: kütüphane nesnesi mutasyonu component dışında
function applyLerp(lenis: Lenis, lerp: number) {
  lenis.options.lerp = lerp;
}

/**
 * Kural 24/46: tek raf döngüsü — kendi requestAnimationFrame'imiz `lenis.raf()`'ı sürer; `@/lib/gsap` lazy geldiğinde
 * aynı döngü her tick `ScrollTrigger.update()` de çağırır (gsap ilk yükleme JS'inde değil, o yüzden gsap.ticker'a bağlanmaz).
 */
function LenisTicker() {
  const lenis = useLenis();
  const reduced = useReducedMotion();
  const gsapRef = useRef<GsapBundle | null>(null);

  useEffect(() => {
    if (!lenis) return;
    let id = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      gsapRef.current?.ScrollTrigger.update();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    let cancelled = false;
    let off: (() => void) | undefined;
    import("@/lib/gsap").then((g) => {
      if (cancelled) return;
      gsapRef.current = g;
      g.gsap.ticker.lagSmoothing(0);
      lenis.on("scroll", g.ScrollTrigger.update);
      off = () => lenis.off("scroll", g.ScrollTrigger.update);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      off?.();
    };
  }, [lenis]);

  useEffect(() => {
    if (!lenis) return;
    applyLerp(lenis, reduced ? 1 : LERP);
  }, [lenis, reduced]);

  // Kural 32: navigasyon sonrası hash hedefi — pin spacer mount'tan sonra eklenir; ST kurulunca refresh + yeniden kaydır
  const pathname = usePathname();
  useEffect(() => {
    const id = window.setTimeout(() => {
      const hash = window.location.hash;
      if (!hash) return;
      const el = document.getElementById(hash.slice(1));
      if (!el) return;
      gsapRef.current?.ScrollTrigger.refresh();
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}

/** R19 — Lenis + tek rAF döngüsü. */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={OPTIONS}>
      <LenisTicker />
      {children}
    </ReactLenis>
  );
}
