"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import SplitReveal from "@/components/motion/SplitReveal";
import TransitionLink from "@/components/motion/TransitionLink";
import { useDialog } from "@/lib/hooks/useDialog";
import { useUiStore } from "@/lib/ui-store";

const LINKS = [
  { key: "home", href: "/" },
  { key: "menu", href: "/menu" },
  { key: "about", href: "/about" },
  { key: "zone", href: "/#zone" },
  { key: "location", href: "/#location" },
  { key: "contact", href: "/contact" },
] as const;

/** R5 — Tam ekran menü: bg-berry-dk/60 + backdrop-blur (karar 2026-09-17), Modak linkler line-mask ile, ESC / focus trap / scroll kilidi. */
export default function MenuOverlay() {
  const t = useTranslations("Nav");
  const open = useUiStore((s) => s.menuOpen);
  const setMenuOpen = useUiStore((s) => s.setMenuOpen);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setMenuOpen(false), [setMenuOpen]);
  useDialog(open, close, ref);

  return (
    <div
      id="menu-overlay"
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={t("menuButton")}
      data-state={open ? "open" : "closed"}
      className={clsx(
        "fixed inset-0 z-70 flex flex-col justify-between bg-berry-dk/60 px-[2.5vw] pb-[2vw] pt-[8vw] max-md:px-[5vw] max-md:pb-[6vw] max-md:pt-[24vw] backdrop-blur-md transition-[opacity,visibility] duration-500",
        open ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      {open && (
        <nav className="flex flex-col gap-[0.4vw] max-md:gap-[1.5vw]">
          {LINKS.map((l, i) => (
            <TransitionLink
              key={l.key}
              href={l.href}
              data-cursor-hide
              onClick={close}
              className="group w-fit font-display text-[6vw] max-md:text-[13vw] leading-[0.95] text-cream transition-colors hover:text-mustard focus-visible:text-mustard"
            >
              <SplitReveal mode="lines" text={t(l.key)} start="top 100%" stagger={0.06 + i * 0.01} />
            </TransitionLink>
          ))}
        </nav>
      )}
      <p className="font-pixel text-[0.8vw] max-md:text-[3vw] uppercase tracking-widest text-cream/80">{t("est")}</p>
    </div>
  );
}
