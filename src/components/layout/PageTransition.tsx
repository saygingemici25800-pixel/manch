"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";
import Logo from "@/components/ui/Logo";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransitionStore } from "@/lib/transition-store";
import { markCover, markServing, pathChangedSinceCover } from "@/lib/transition-title";

// viewBox 0 0 100 100 — Q kontrol noktalı dalgalı kenar
const FLAT_BOTTOM = "M0 100 Q50 100 100 100 L100 100 L0 100 Z";
const FULL_COVER_UP = "M0 0 Q50 -18 100 0 L100 100 L0 100 Z";
const FULL_RECT = "M0 0 L100 0 L100 100 Q50 100 0 100 Z";
const GONE_TOP = "M0 0 L100 0 L100 0 Q50 -18 0 0 Z";

const LAYERS = ["var(--color-berry)", "var(--color-pink)", "var(--color-mustard)"];
const FALLBACK_MS = 4000;

/**
 * R2 — 3 SVG perde (berry → pink → mustard), alttan yukarı path morph, ortada Modak "MANCHING…".
 * R3 — document.title: "<sayfa> | Smash'leniyor" → "<sayfa> | Servis" → sayfa başlığı.
 * Akış (Kural 29): trigger → cover → covering → covered → (pathname değişti) → reveal → idle
 */
export default function PageTransition() {
  const root = useRef<HTMLDivElement>(null);
  const t = useTranslations("Transition");
  const router = useRouter();
  const pathname = usePathname();
  const phase = useTransitionStore((s) => s.phase);
  const setPhase = useTransitionStore((s) => s.setPhase);

  // Kural 46: gsap lazy — cover/reveal fonksiyonları modül gelince kurulur; TransitionLink gsapReady olmadan perde açmaz
  const api = useRef<{ cover: () => void; reveal: () => void } | null>(null);
  useLazyGsap(
    ({ gsap }) => {
      const reveal = () => {
        setPhase("reveal");
        const restoreTitle = markServing(t("titleServing"));
        gsap
          .timeline({
            onComplete: () => {
              gsap.set(".layer path", { attr: { d: FLAT_BOTTOM } });
              gsap.set(".stage", { autoAlpha: 0 });
              setPhase("idle");
              window.setTimeout(restoreTitle, 900);
            },
          })
          .set(".layer path", { attr: { d: FULL_RECT } })
          .to(".word", { autoAlpha: 0, y: -20, duration: 0.3, ease: "power2.in" }, 0)
          .to(".layer path", { attr: { d: GONE_TOP }, duration: 0.9, ease: "power4.inOut", stagger: 0.08 }, 0.05);
      };
      const cover = () => {
        setPhase("covering");
        markCover(pathname, t("titleFlipping"));
        gsap
          .timeline({
            onComplete: () => {
              const { href, locale } = useTransitionStore.getState();
              setPhase("covered");
              if (href) router.push(href, { locale });
              else window.setTimeout(reveal, 350); // demo: navigasyon yok
            },
          })
          .set(".stage", { autoAlpha: 1 })
          .set(".layer path", { attr: { d: FLAT_BOTTOM } })
          .set(".word", { autoAlpha: 0, y: 20 })
          .to(".layer path", { attr: { d: FULL_COVER_UP }, duration: 0.9, ease: "power4.inOut", stagger: 0.08 })
          .to(".word", { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, "-=0.35");
      };
      api.current = { cover, reveal };
      return () => {
        api.current = null;
      };
    },
    [pathname, t, router, setPhase],
    root,
  );

  // trigger → cover (bir kez; cover() hemen "covering"e geçer). Modül yoksa perdesiz devam: doğrudan push.
  useEffect(() => {
    if (phase !== "cover") return;
    if (api.current) api.current.cover();
    else {
      const { href, locale } = useTransitionStore.getState();
      setPhase("idle");
      if (href) router.push(href, { locale });
    }
  }, [phase, router, setPhase]);

  // pathname değişti (navigasyon bitti) → reveal; fallback: 4 s içinde değişmezse yine aç
  useEffect(() => {
    if (phase !== "covered" || !useTransitionStore.getState().href) return;
    const delay = pathChangedSinceCover(pathname) ? 80 : FALLBACK_MS;
    const id = window.setTimeout(() => api.current?.reveal(), delay);
    return () => window.clearTimeout(id);
  }, [phase, pathname]);

  return (
    <div ref={root} data-transition={phase} aria-hidden="true" className="contents">
      <div
        className="stage fixed inset-0 z-90 invisible opacity-0"
        style={{ pointerEvents: phase === "idle" ? "none" : "auto" }}
      >
        {LAYERS.map((fill, i) => (
          <svg key={i} className="layer absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={FLAT_BOTTOM} fill={fill} />
          </svg>
        ))}
        <div className="word absolute inset-0 flex flex-col items-center justify-center gap-[1.5vw] max-md:gap-[5vw] text-berry opacity-0">
          <Logo className="h-[4vw] max-md:h-[10vw] w-auto" />
          <span className="font-display text-[5vw] max-md:text-[13vw] leading-none">{t("word")}</span>
        </div>
      </div>
    </div>
  );
}
