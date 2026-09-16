import { create } from "zustand";

/** /lab'daki "reduced-motion emülasyonu" için global override. null = sistem tercihini kullan. */
interface MotionState {
  forceReduced: boolean | null;
  setForceReduced: (v: boolean | null) => void;
}

export const useMotionStore = create<MotionState>((set) => ({
  forceReduced: null,
  setForceReduced: (forceReduced) => set({ forceReduced }),
}));
