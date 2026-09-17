"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * Kural 24: GSAP ticker'a bağlama `<ReactLenis>` **içindeki** çocuk component'te yapılır —
 * `ref.current.lenis` mount anında `undefined`dır, ona güvenilmez. Ticker `lenis.raf()` sonrası
 * `ScrollTrigger.update()` de çağırır (Lenis scroll event köprüsü tek başına güvenilmez).
 */
function LenisTicker() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;

    void import("@/lib/gsap").then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
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
      };
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [lenis]);

  return null;
}

/** Kural 25: kütüphane nesnesi mutasyonu modül seviyesinde plain fonksiyonda. */
function applyLerp(lenis: ReturnType<typeof useLenis>, instant: boolean) {
  if (lenis) lenis.options.lerp = instant ? 1 : 0.1;
}

function LenisReducedBridge({ reduced }: { reduced: boolean }) {
  const lenis = useLenis();
  useEffect(() => {
    applyLerp(lenis, reduced);
  }, [lenis, reduced]);
  return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  // Sistem reduced-motion'ı Lenis kendisi izler; bu köprü /lab override'ı için (Kural 24).
  const reduced = useReducedMotion();

  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1 }}>
      <LenisTicker />
      <LenisReducedBridge reduced={reduced} />
      {children}
    </ReactLenis>
  );
}
