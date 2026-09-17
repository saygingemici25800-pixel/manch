"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLenis } from "lenis/react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { site } from "@/lib/site";

const KEY = "manch-preloaded";
const DURATION = 1.8; // karar 2026-09-17: 1.8 s + 0.6 s çıkış

/**
 * R1 — İlk yükleme: berry zemin, 3 dönen mesaj, ilerleme çubuğu. sessionStorage ile oturumda 1 kez.
 * İlk render her zaman "yükleniyor" (hydration güvenli); sessionStorage sadece effect'te okunur.
 */
export default function Preloader() {
  const t = useTranslations("Preloader");
  const [visible, setVisible] = useState(true);
  const [msg, setMsg] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const reduced = useReducedMotion();
  const lines = [t("line1"), t("line2"), t("line3")];

  // scroll kilidi
  useEffect(() => {
    if (!visible) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      html.style.overflow = "";
      lenis?.start();
    };
  }, [visible, lenis]);

  // Kural 31: visible=false olunca null render → scope yok, ref effect içinde
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const bar = el.querySelector<HTMLElement>(".bar");
      let seen = false;
      try {
        seen = sessionStorage.getItem(KEY) === "1";
      } catch {
        /* private mode vb. */
      }
      if (seen || reduced) {
        setVisible(false);
        return;
      }
      const progress = { v: 0 };
      const tl = gsap.timeline({
        onComplete: () => {
          try {
            sessionStorage.setItem(KEY, "1");
          } catch {
            /* yoksay */
          }
          gsap.to(el, {
            yPercent: -100,
            duration: 0.6,
            ease: "power4.inOut",
            onComplete: () => setVisible(false),
          });
        },
      });
      tl.to(progress, {
        v: 100,
        duration: DURATION,
        ease: "power2.inOut",
        onUpdate: () => bar && gsap.set(bar, { scaleX: progress.v / 100 }),
      });
      const cycle = window.setInterval(() => setMsg((m) => (m + 1) % 3), (DURATION * 1000) / 3);
      return () => window.clearInterval(cycle);
    },
    // Bir kez çalışır (ilk yükleme); sonraki reduced değişimleri preloader'ı ilgilendirmez
    { dependencies: [] },
  );

  if (!visible) return null;

  return (
    <div
      ref={root}
      data-preloader=""
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-95 flex flex-col items-center justify-center gap-[2vw] max-md:gap-[6vw] bg-berry text-cream"
    >
      <p className="font-display text-[9vw] max-md:text-[22vw] leading-none text-mustard">{site.name}</p>
      <p className="text40 text-[1.6vw] max-md:text-[5vw] text-cream" aria-label={lines[msg]}>
        {lines[msg]}
      </p>
      <div className="h-[0.2vw] max-md:h-[0.8vw] w-[24vw] max-md:w-[60vw] overflow-hidden rounded-full bg-cream/25">
        <div className="bar h-full w-full origin-left scale-x-0 bg-mustard" />
      </div>
    </div>
  );
}
