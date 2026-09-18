"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLenis } from "@/lib/lenis-store";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { site } from "@/lib/site";
import Logo from "@/components/ui/Logo";

const KEY = "manch-preloaded";
const DURATION = 1.8; // s — karar 2026-09-17: 1.8 s + 0.6 s çıkış
const EXIT = 0.6;

/**
 * R1 — İlk yükleme: berry zemin, 3 dönen mesaj, ilerleme çubuğu. sessionStorage ile oturumda 1 kez.
 * GSAP kullanmaz (Kural 46: gsap ilk yükleme JS'inde değil): çubuk CSS keyframe, çıkış CSS transition.
 * İlk render her zaman "yükleniyor"; sessionStorage sadece effect'te okunur.
 */
export default function Preloader() {
  const t = useTranslations("Preloader");
  const [phase, setPhase] = useState<"loading" | "exit" | "done">("loading");
  const [msg, setMsg] = useState(0);
  const lenis = useLenis();
  const reduced = useReducedMotion();
  const lines = [t("line1"), t("line2"), t("line3")];
  const visible = phase !== "done";

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

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* private mode vb. */
    }
    // Kural 43: ?nopreload=1 — dev'de her zaman, prod build'de yalnızca NEXT_PUBLIC_ALLOW_NOPRELOAD=1 ile
    const allow = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ALLOW_NOPRELOAD === "1";
    const skip = allow && new URLSearchParams(window.location.search).get("nopreload") === "1";
    if (seen || reduced || skip) {
      const id = window.setTimeout(() => setPhase("done"), 0); // Kural 25
      return () => window.clearTimeout(id);
    }
    const cycle = window.setInterval(() => setMsg((m) => (m + 1) % 3), (DURATION * 1000) / 3);
    const exit = window.setTimeout(() => {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* yoksay */
      }
      setPhase("exit");
    }, DURATION * 1000);
    const done = window.setTimeout(() => setPhase("done"), (DURATION + EXIT) * 1000);
    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(exit);
      window.clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      data-preloader=""
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-95 flex flex-col items-center justify-center gap-[2vw] max-md:gap-[6vw] bg-berry text-cream transition-transform ease-[cubic-bezier(.76,0,.24,1)]"
      style={{ transform: phase === "exit" ? "translateY(-100%)" : "translateY(0)", transitionDuration: `${EXIT}s` }}
    >
      <Logo label={site.name} className="h-[7vw] max-md:h-[16vw] w-auto text-mustard" />
      <p className="text40 text-[1.6vw] max-md:text-[5vw] text-cream" aria-label={lines[msg]}>
        {lines[msg]}
      </p>
      <div className="h-[0.2vw] max-md:h-[0.8vw] w-[24vw] max-md:w-[60vw] overflow-hidden rounded-full bg-cream/25">
        <div className="bar h-full w-full origin-left scale-x-0 bg-mustard" style={{ animation: `preload-bar ${DURATION}s cubic-bezier(.4,0,.2,1) forwards` }} />
      </div>
    </div>
  );
}
