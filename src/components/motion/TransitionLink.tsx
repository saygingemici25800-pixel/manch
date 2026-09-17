"use client";

import { forwardRef, type ComponentProps } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { useTransitionStore } from "@/lib/transition-store";
import { useUiStore } from "@/lib/ui-store";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useGsapReady } from "@/lib/motion-store";

type Props = ComponentProps<typeof Link> & { locale?: Locale };

/**
 * R2 — next-intl Link'i sarar; SPA navigasyonda `onNavigate` ile push'u erteler, perdeyi tetikler (Kural 29).
 * Reduced motion / aynı sayfa / hash: normal navigasyon.
 */
const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, locale, onNavigate, ...rest },
  ref,
) {
  const pathname = usePathname();
  const trigger = useTransitionStore((s) => s.trigger);
  const closeAll = useUiStore((s) => s.closeAll);
  const reduced = useReducedMotion();
  const gsapReady = useGsapReady(); // Kural 46: gsap lazy yüklenmediyse normal navigasyon

  const target = typeof href === "string" ? href : (href.pathname ?? "/");
  const isHash = target.startsWith("#") || (target.startsWith(pathname) && target.includes("#"));
  const samePage = target === pathname && !locale;

  return (
    <Link
      ref={ref}
      href={href}
      locale={locale}
      onNavigate={(e) => {
        // next-intl'in onNavigate event tipinde defaultPrevented yok; dış handler önce çalışır
        onNavigate?.(e);
        if (reduced || !gsapReady || isHash || samePage) return;
        e.preventDefault();
        closeAll();
        trigger(target, locale);
      }}
      {...rest}
    />
  );
});

export default TransitionLink;
