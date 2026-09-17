"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLenis } from "lenis/react";
import clsx from "clsx";
import TransitionLink from "@/components/motion/TransitionLink";
import RollText from "@/components/motion/RollText";
import { usePathname } from "@/i18n/navigation";
import { site } from "@/lib/site";
import { useUiStore } from "@/lib/ui-store";

/**
 * R4 — fixed nav: sol Modak logo (text-stroke-fill), sağda dolu hap "BURGERS" + çerçeveli hap "MENU" (3 çizgi → X).
 * Lenis direction ile aşağı scroll'da gizlenir; `[data-nav-dark]` section'ları IntersectionObserver ile renk invert.
 */
export default function Nav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const menuOpen = useUiStore((s) => s.menuOpen);
  const setMenuOpen = useUiStore((s) => s.setMenuOpen);
  const [hidden, setHidden] = useState(false);
  const [dark, setDark] = useState(false);

  // Lenis durunca direction 0 gelir — o event'lerde durumu değiştirme (aksi halde nav hemen geri gelir)
  useLenis(({ direction, scroll }) => {
    if (direction === 1 && scroll > 80) setHidden(true);
    else if (direction === -1 || scroll <= 80) setHidden(false);
  });

  // data-nav-dark: nav bandıyla kesişen koyu section var mı?
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-dark]"));
    if (els.length === 0) {
      const id = window.setTimeout(() => setDark(false), 0); // Kural 25
      return () => window.clearTimeout(id);
    }
    const hits = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) hits.add(e.target);
          else hits.delete(e.target);
        }
        setDark(hits.size > 0);
      },
      // sadece üstteki nav bandı (~%8 viewport ≈ nav yüksekliği)
      { rootMargin: "0px 0px -92% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  const show = !hidden || menuOpen;
  const invert = dark && !menuOpen;

  return (
    <header
      data-nav
      data-nav-state={show ? "visible" : "hidden"}
      className={clsx(
        "fixed inset-x-0 top-0 z-80 flex items-center justify-between px-[2.5vw] py-[1vw] max-md:px-[5vw] max-md:py-[3vw]",
        "transition-[transform,color] duration-500 ease-out",
        show ? "translate-y-0" : "-translate-y-full",
        invert ? "text-cream" : "text-berry",
      )}
    >
      <TransitionLink
        href="/"
        data-cursor-hide
        aria-label={t("home")}
        className="text-stroke-fill font-display text-[2.6vw] max-md:text-[8vw] leading-none text-mustard transition-transform duration-300 hover:scale-105 [--stroke-color:var(--color-berry)]"
      >
        {site.name}
      </TransitionLink>

      <nav className="flex items-center gap-[0.8vw] max-md:gap-[2.5vw]">
        {/* karar 2026-09-17: şimdilik #hits; Faz 6'da /menu */}
        <TransitionLink
          href="/#hits"
          data-cursor-hide
          className={clsx(
            "group max-md:hidden rounded-full px-[1.6vw] py-[0.6vw] text40 text-[1.1vw] transition-[transform,background-color,color] duration-300 hover:scale-105 hover:bg-ink hover:text-cream",
            invert ? "bg-cream text-berry" : "bg-berry text-cream",
          )}
        >
          <RollText text={t("burgers")} />
        </TransitionLink>

        <button
          type="button"
          data-cursor-hide
          data-testid="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="menu-overlay"
          aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
          onClick={() => setMenuOpen(!menuOpen)}
          className={clsx(
            "group flex items-center gap-[0.7vw] max-md:gap-[2vw] rounded-full border-[0.15vw] max-md:border-[0.5vw] px-[1.4vw] py-[0.55vw] max-md:px-[4vw] max-md:py-[2vw] text40 text-[1.1vw] max-md:text-[3.6vw] transition-[transform,background-color,color,border-color] duration-300 hover:scale-105 hover:bg-ink hover:text-cream hover:border-ink",
            menuOpen ? "border-cream text-cream" : invert ? "border-cream text-cream" : "border-berry text-berry",
          )}
        >
          <span className="max-md:hidden">
            <RollText text={t("menuButton")} />
          </span>
          <span aria-hidden="true" className="relative block h-[0.9vw] w-[1.4vw] max-md:h-[3vw] max-md:w-[4.6vw]">
            <span className={clsx("absolute left-0 top-0 h-[0.14vw] max-md:h-[0.5vw] w-full rounded-full bg-current transition-transform duration-300", menuOpen && "translate-y-[0.38vw] max-md:translate-y-[1.25vw] rotate-45")} />
            <span className={clsx("absolute left-0 top-1/2 h-[0.14vw] max-md:h-[0.5vw] w-[70%] -translate-y-1/2 rounded-full bg-current transition-[opacity,transform] duration-300", menuOpen && "scale-x-0 opacity-0")} />
            <span className={clsx("absolute bottom-0 left-0 h-[0.14vw] max-md:h-[0.5vw] w-full rounded-full bg-current transition-transform duration-300", menuOpen && "-translate-y-[0.38vw] max-md:-translate-y-[1.25vw] -rotate-45")} />
          </span>
        </button>
      </nav>
    </header>
  );
}
