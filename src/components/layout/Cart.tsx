"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { useGsapModule } from "@/lib/hooks/useLazyGsap";
import { getProduct } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import { site } from "@/lib/site";
import { useCartStore } from "@/lib/cart-store";
import { useUiStore } from "@/lib/ui-store";
import { useDialog } from "@/lib/hooks/useDialog";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { RollText } from "@/components/motion/RollText";
import { SoonBadge } from "@/components/ui/SoonBadge";

/** WhatsApp sipariş mesajı (wa.me). Numara yoksa null. */
function buildWaUrl(text: string): string | null {
  const num = site.contact.whatsapp;
  if (!num) return null;
  return `https://wa.me/${num.replace(/[^\d]/g, "")}?text=${encodeURIComponent(text)}`;
}

/** R12 — sağ altta berry sepet + hardal sayaç, "SEPETE EKLENDİ" toast, kraft drawer, WhatsApp checkout. */
export default function Cart() {
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const lines = useCartStore((s) => s.lines);
  const lastAdded = useCartStore((s) => s.lastAdded);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const open = useUiStore((s) => s.cartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const drawer = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);
  useDialog(open, close, drawer);

  const count = lines.reduce((n, l) => n + l.qty, 0);

  // toast + rozet bounce (gsap lazy; yoksa sadece toast)
  const g = useGsapModule();
  const bounce = () => {
    const gsap = g.current?.gsap;
    const badge = root.current?.querySelector(".badge");
    if (reduced || !gsap || !badge) return;
    gsap.fromTo(badge, { scale: 1.6 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
  };
  useEffect(() => {
    if (!lastAdded) return;
    const p = getProduct(lastAdded.slug);
    const name = p ? p.name[locale] : lastAdded.slug;
    // Kural 25: effect'te senkron setState yok → ertele
    const show = window.setTimeout(() => {
      setToast(name);
      bounce();
    }, 0);
    const hide = window.setTimeout(() => setToast(null), 1600);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAdded, locale]);

  const total = lines.reduce((sum, l) => sum + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);
  const message = [
    t("waIntro"),
    ...lines.map((l) => {
      const p = getProduct(l.slug);
      const price = p?.price !== null && p?.price !== undefined ? ` — ${p.price * l.qty} TL` : "";
      return `• ${l.qty}× ${p?.name[locale] ?? l.slug}${price}`;
    }),
    t("waTotal", { total }),
  ].join("\n");
  const waUrl = buildWaUrl(message);

  return (
    <div ref={root}>
      {/* toast */}
      {/* data-testid="cart-toast" → lab-check */}
      <div
        data-testid="cart-toast"
        role="status"
        aria-live="polite"
        className={clsx(
          "pointer-events-none fixed left-1/2 top-[8vw] max-md:top-[22vw] z-85 -translate-x-1/2 rounded-full bg-ink/70 px-[1.8vw] py-[0.7vw] max-md:px-[5vw] max-md:py-[2.5vw] text40 text-[1.1vw] max-md:text-[3.8vw] text-cream backdrop-blur-md transition-[opacity,transform] duration-300",
          toast ? "translate-y-0 opacity-100" : "-translate-y-[1vw] opacity-0",
        )}
      >
        {toast ? `${t("added")} · ${toast}` : t("added")}
      </div>

      {/* sabit sepet butonu */}
      <button
        type="button"
        data-cursor-hide
        data-testid="cart-button"
        aria-label={t("open")}
        onClick={() => setOpen(true)}
        className="fixed bottom-[2vw] right-[2vw] max-md:bottom-[5vw] max-md:right-[5vw] z-60 grid h-[4.2vw] w-[4.2vw] max-md:h-[14vw] max-md:w-[14vw] place-items-center rounded-full bg-berry text-cream shadow-[0_1vw_2vw_-0.6vw_rgba(78,16,48,.6)] transition-transform duration-300 hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="h-[45%] w-[45%]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.5" />
          <circle cx="9.5" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" />
        </svg>
        {hydrated && count > 0 && (
          <span data-testid="cart-count" className="badge absolute -right-[0.3vw] -top-[0.3vw] max-md:-right-[1vw] max-md:-top-[1vw] grid h-[1.6vw] min-w-[1.6vw] max-md:h-[5.5vw] max-md:min-w-[5.5vw] place-items-center rounded-full bg-mustard px-[0.3vw] font-pixel text-[0.7vw] max-md:text-[2.6vw] text-ink">
            {count}
          </span>
        )}
      </button>

      {/* backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={clsx("fixed inset-0 z-71 bg-berry-dk/40 transition-opacity duration-400", open ? "opacity-100" : "pointer-events-none opacity-0")}
      />

      {/* kraft drawer */}
      <div
        ref={drawer}
        role="dialog"
        data-testid="cart-drawer"
        aria-modal="true"
        aria-label={t("title")}
        data-state={open ? "open" : "closed"}
        className={clsx(
          "grain fixed right-0 top-0 z-72 flex h-full w-[28vw] max-md:w-[88vw] flex-col gap-[1.5vw] max-md:gap-[5vw] bg-paper p-[2vw] max-md:p-[6vw] text-berry-dk shadow-[-1vw_0_3vw_-1vw_rgba(78,16,48,.5)] transition-transform duration-500 ease-[cubic-bezier(.4,1.2,.5,1)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[2.4vw] max-md:text-[8vw] leading-none">{t("title")}</h2>
          <button type="button" data-cursor-hide onClick={close} aria-label={t("close")} className="text40 text-[1.1vw] max-md:text-[3.8vw] underline underline-offset-4">
            {t("close")}
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-[0.8vw] max-md:gap-[3vw] overflow-y-auto">
          {lines.length === 0 && <li className="text40 text-[1.2vw] max-md:text-[4vw] normal-case tracking-normal">{t("empty")}</li>}
          {lines.map((l) => {
            const p = getProduct(l.slug);
            return (
              <li key={l.slug} className="flex items-center justify-between gap-[1vw] border-b border-berry/15 pb-[0.8vw] max-md:pb-[3vw]">
                <div className="flex flex-col">
                  <span className="text40 text-[1.2vw] max-md:text-[4.2vw]">{p?.name[locale] ?? l.slug}</span>
                  <span className="font-pixel text-[0.7vw] max-md:text-[2.6vw]">{p?.price !== null && p?.price !== undefined ? `${p.price * l.qty} TL` : <SoonBadge />}</span>
                </div>
                <div className="flex items-center gap-[0.6vw] max-md:gap-[2vw]">
                  <button type="button" aria-label={t("less")} onClick={() => setQty(l.slug, l.qty - 1)} className="grid h-[1.8vw] w-[1.8vw] max-md:h-[7vw] max-md:w-[7vw] place-items-center rounded-full bg-berry text-cream">−</button>
                  <span className="font-pixel text-[0.9vw] max-md:text-[3.4vw] min-w-[1.2vw] text-center">{l.qty}</span>
                  <button type="button" aria-label={t("more")} onClick={() => setQty(l.slug, l.qty + 1)} className="grid h-[1.8vw] w-[1.8vw] max-md:h-[7vw] max-md:w-[7vw] place-items-center rounded-full bg-mustard text-ink">+</button>
                  <button type="button" aria-label={t("remove")} onClick={() => remove(l.slug)} className="ml-[0.4vw] text-[1vw] max-md:text-[3.4vw] underline underline-offset-4">✕</button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-[0.6vw] max-md:gap-[2vw]">
          {lines.length > 0 && (
            <p data-testid="cart-total" className="flex items-baseline justify-between border-t border-berry/15 pt-[0.8vw] max-md:pt-[3vw] text40 text-[1.2vw] max-md:text-[4.2vw]">
              <span>{t("total")}</span>
              <span className="font-display text-[1.8vw] max-md:text-[6vw]">{total} TL</span>
            </p>
          )}
          {waUrl && lines.length > 0 ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hide
              data-testid="checkout"
              className="group grid place-items-center rounded-full bg-berry px-[1.6vw] py-[0.9vw] max-md:px-[5vw] max-md:py-[3.5vw] text40 text-[1.2vw] max-md:text-[4vw] text-cream transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-ink"
            >
              <RollText>{t("checkout")}</RollText>
            </a>
          ) : (
            <button
              type="button"
              disabled
              data-testid="checkout"
              aria-disabled="true"
              className="grid cursor-not-allowed place-items-center rounded-full bg-berry/40 px-[1.6vw] py-[0.9vw] max-md:px-[5vw] max-md:py-[3.5vw] text40 text-[1.2vw] max-md:text-[4vw] text-cream"
            >
              {lines.length === 0 ? (
                t("checkout")
              ) : (
                <>
                  {t("checkout")} <SoonBadge className="ml-[0.5vw] max-md:ml-[2vw]" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
