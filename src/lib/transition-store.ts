import { create } from "zustand";
import type { Locale } from "@/i18n/routing";

export type TransitionPhase = "idle" | "cover" | "covering" | "covered" | "reveal";

/**
 * R2 PageTransition durum makinesi (Kural 29).
 * TransitionLink → trigger(href) → PageTransition perdeyi kapatır → router.push → pathname değişince açar.
 * href null: sadece demo (kapat-aç), navigasyon yok.
 */
interface TransitionState {
  phase: TransitionPhase;
  href: string | null;
  locale: Locale | undefined;
  trigger: (href: string | null, locale?: Locale) => void;
  setPhase: (phase: TransitionPhase) => void;
}

export const useTransitionStore = create<TransitionState>((set, get) => ({
  phase: "idle",
  href: null,
  locale: undefined,
  trigger: (href, locale) => {
    if (get().phase !== "idle") return;
    set({ phase: "cover", href, locale });
  },
  setPhase: (phase) => set({ phase }),
}));

// Dev/QA: scripts/lab-check.mjs store'a buradan erişir (prod'da tree-shake edilir).
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__TRANSITION__ = useTransitionStore;
}
