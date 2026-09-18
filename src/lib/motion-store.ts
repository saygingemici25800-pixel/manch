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

// Dev/QA: scripts/lab-check.mjs reduced-motion override'ını buradan yapar.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__MOTION__ = useMotionStore;
}
