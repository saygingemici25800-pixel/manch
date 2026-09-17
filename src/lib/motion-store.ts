import { create } from "zustand";

/** `/lab`'daki reduced-motion emülasyonu + lazy GSAP hazırlık bayrağı. */
interface MotionState {
  /** null = sistem tercihini kullan. */
  forceReduced: boolean | null;
  setForceReduced: (v: boolean | null) => void;
  /** `@/lib/gsap` lazy modülü yüklendi mi (Kural 46). */
  gsapReady: boolean;
  setGsapReady: () => void;
}

export const useMotionStore = create<MotionState>((set) => ({
  forceReduced: null,
  setForceReduced: (forceReduced) => set({ forceReduced }),
  gsapReady: false,
  setGsapReady: () => set({ gsapReady: true }),
}));

export const useGsapReady = () => useMotionStore((s) => s.gsapReady);
