"use client";

import { useEffect, type ReactNode } from "react";
import type Lenis from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "@/i18n/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const LERP = 0.1;
const OPTIONS = { autoRaf: false, lerp: LERP };

// Kural 25: kütüphane nesnesi mutasyonu component dışında
function applyLerp(lenis: Lenis, lerp: number) {
  lenis.options.lerp = lerp;
}

/**
 * Kural 24: ticker bağlama çocukta — `useLenis()` instance var olunca (ReactLenis onu effect'te state'e yazar,
 * `ref.current.lenis` mount anında undefined'dır).
 */
function LenisTicker() {
  const lenis = useLenis();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!lenis) return;
    // Kural 24: ScrollTrigger.update her tick'te ticker'dan — Lenis "scroll" event köprüsü tek başına
    // dev StrictMode instance takasından sonra güvenilir değildi (pin/batch tetiklenmiyordu, 2026-09-17)
    const update = (time: number) => {
      lenis.raf(time * 1000);
      ScrollTrigger.update();
    };
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(update);
    };
  }, [lenis]);

  useEffect(() => {
    if (!lenis) return;
    // Lenis sistem tercihini kendisi izler; override (lab emülasyonu) için lerp'i elle ayarlıyoruz
    applyLerp(lenis, reduced ? 1 : LERP);
  }, [lenis, reduced]);

  // Kural 32: navigasyon sonrası hash hedefi — pin spacer'lar mount'tan sonra eklenir, Next'in hash scroll'u eski
  // konuma iner. ScrollTrigger'lar kurulunca refresh + yeniden kaydır (PageTransition reveal'ından önce, 60 ms).
  const pathname = usePathname();
  useEffect(() => {
    const id = window.setTimeout(() => {
      const hash = window.location.hash;
      if (!hash) return;
      const el = document.getElementById(hash.slice(1));
      if (!el) return;
      ScrollTrigger.refresh();
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}

/** R19 — Lenis + GSAP ticker. autoRaf kapalı; tek raf döngüsü GSAP ticker. */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={OPTIONS}>
      <LenisTicker />
      {children}
    </ReactLenis>
  );
}
