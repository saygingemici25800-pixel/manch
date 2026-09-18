import { create } from "zustand";

import type { FrameId } from "@/lib/zone/frames";

/**
 * Zone durum makinesi (spec bölüm 6).
 *
 *   closed → select → loading → zone ⇄ pov
 *                                 └──→ closed  (ÇIKIŞ / Esc)
 *
 * Sipariş burada tutulmaz: Zone'daki sepet **mevcut `useCartStore`'a** yazar (spec bölüm 1).
 */
export type ZoneState = "closed" | "select" | "loading" | "zone" | "pov";
export type Character = "misu" | "miyu";

const CHAR_KEY = "manch_char";

interface ZoneStore {
  state: ZoneState;
  character: Character | null;
  /** Yakınlıktaki çerçeve — prompt ve halka parlaması buna bakar. */
  nearFrame: FrameId | null;
  /** POV'da açık olan çerçeve. */
  pov: FrameId | null;
  /** Loader yüzdesi (0–100). */
  progress: number;
  /**
   * POV kapanınca odağın döneceği çerçeve (spec bölüm 10). `openFrame` doldurur,
   * `FramePrompt` yeniden mount olunca kendi GİR butonuna odağı alır ve temizler.
   */
  returnFocus: FrameId | null;

  /** "ZONE'A GİR" — karakter hatırlanıyorsa doğrudan yüklemeye geçer. */
  enter: () => void;
  select: (character: Character) => void;
  setProgress: (progress: number) => void;
  ready: () => void;
  setNearFrame: (id: FrameId | null) => void;
  openFrame: (id: FrameId) => void;
  clearReturnFocus: () => void;
  closeFrame: () => void;
  exit: () => void;
}

/** Kural 30: `sessionStorage` yalnızca effect/handler içinde okunur, render'da değil. */
function readCharacter(): Character | null {
  try {
    const v = sessionStorage.getItem(CHAR_KEY);
    return v === "misu" || v === "miyu" ? v : null;
  } catch {
    return null;
  }
}

export const useZoneStore = create<ZoneStore>((set, get) => ({
  state: "closed",
  character: null,
  nearFrame: null,
  pov: null,
  progress: 0,
  returnFocus: null,

  enter: () => {
    const remembered = readCharacter();
    set({
      state: remembered ? "loading" : "select",
      character: remembered,
      progress: 0,
      nearFrame: null,
      pov: null,
      returnFocus: null,
    });
  },

  select: (character) => {
    try {
      sessionStorage.setItem(CHAR_KEY, character);
    } catch {
      /* private mode vb. — hatırlamadan devam */
    }
    set({ character, state: "loading", progress: 0 });
  },

  setProgress: (progress) => set({ progress: Math.max(0, Math.min(100, progress)) }),

  ready: () => set({ state: "zone", progress: 100 }),

  setNearFrame: (nearFrame) => {
    if (get().nearFrame !== nearFrame) set({ nearFrame });
  },

  openFrame: (pov) => set({ state: "pov", pov, returnFocus: pov }),

  clearReturnFocus: () => set({ returnFocus: null }),

  /** POV'dan çıkış — `camAng` DEĞİŞMEMİŞ olmalı (spec 6.1), o kamera hook'unda tutulur. */
  closeFrame: () => set({ state: "zone", pov: null }),

  exit: () => set({ state: "closed", pov: null, nearFrame: null, progress: 0, returnFocus: null }),
}));

/** Seçilmeyen maskot — salonun dibinde NPC olarak durur (spec 8.3). */
export const otherCharacter = (c: Character): Character => (c === "misu" ? "miyu" : "misu");

// Dev/QA: lab-check ve sızıntı testi store'a buradan erişir (prod'da tree-shake edilir).
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__ZONE__ = useZoneStore;
}
