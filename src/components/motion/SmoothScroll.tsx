"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const LERP = 0.1;

// Kural 25: kütüphane nesnesi mutasyonu component dışında
function applyLerp(lenis: NonNullable<LenisRef["lenis"]>, lerp: number) {
  lenis.options.lerp = lerp;
}

/**
 * R19 — Lenis + GSAP ticker (Kural 24). autoRaf kapalı; tek raf döngüsü GSAP ticker.
 * Reduced motion: Lenis lerp=1 (1:1 takip), ScrollTrigger senkronu korunur.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const ref = useRef<LenisRef>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const lenis = ref.current?.lenis;
    if (!lenis) return;

    const update = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(update);
    };
  }, []);

  useEffect(() => {
    const lenis = ref.current?.lenis;
    if (!lenis) return;
    // Lenis sistem tercihini kendisi izler; override (lab emülasyonu) için lerp'i elle ayarlıyoruz
    applyLerp(lenis, reduced ? 1 : LERP);
  }, [reduced]);

  return (
    <ReactLenis root ref={ref} options={{ autoRaf: false, lerp: LERP }}>
      {children}
    </ReactLenis>
  );
}
