"use client";

import { useEffect, type ReactNode } from "react";
import type Lenis from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
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
    const update = (time: number) => lenis.raf(time * 1000);
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
