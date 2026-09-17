import { create } from "zustand";

/** /lab'daki "reduced-motion emülasyonu" için global override. null = sistem tercihini kullan. */
interface MotionState {
  forceReduced: boolean | null;
  setForceReduced: (v: boolean | null) => void;
  /** `@/lib/gsap` lazy modülü yüklendi mi (TransitionLink perdeyi ancak o zaman kullanır) */
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
