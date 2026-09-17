"use client";

import { useTranslations } from "next-intl";
import TransitionLink from "@/components/motion/TransitionLink";
import { useCartStore } from "@/lib/cart-store";
import { useTransitionStore } from "@/lib/transition-store";
import { useUiStore } from "@/lib/ui-store";

const btn = "group rounded-full bg-berry px-[1.6vw] py-[0.6vw] max-md:px-[5vw] max-md:py-[2vw] text40 text-[1.1vw] max-md:text-[3.8vw] text-cream transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-ink";

export default function LayoutLab() {
  const t = useTranslations("LayoutLab");
  const trigger = useTransitionStore((s) => s.trigger);
  const add = useCartStore((s) => s.add);
  const setInfoOpen = useUiStore((s) => s.setInfoOpen);
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  return (
    <div className="flex flex-wrap gap-[1vw] max-md:gap-[3vw]">
      <button type="button" data-cursor-hide data-testid="lab-transition" onClick={() => trigger(null)} className={btn}>{t("trigger")}</button>
      <TransitionLink href="/" data-cursor-hide data-testid="lab-tl-home" className={btn}>{t("tlHome")}</TransitionLink>
      <button type="button" data-cursor-hide data-testid="lab-add-cart" onClick={() => add("classic-manch")} className={btn}>{t("addTest")}</button>
      <button type="button" data-cursor-hide data-testid="lab-open-cart" onClick={() => setCartOpen(true)} className={btn}>{t("openCart")}</button>
      <button type="button" data-cursor-hide data-testid="lab-open-info" onClick={() => setInfoOpen(true)} className={btn}>{t("openInfo")}</button>
      <button
        type="button"
        data-cursor-hide
        onClick={() => {
          try { sessionStorage.removeItem("manch-preloaded"); localStorage.removeItem("manch-cookie"); sessionStorage.removeItem("manch-cookie"); } catch { /* yoksay */ }
          window.location.reload();
        }}
        className={btn}
      >
        {t("resetPreloader")}
      </button>
    </div>
  );
}
