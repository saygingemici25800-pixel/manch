import type Lenis from "lenis";
import { create } from "zustand";

/**
 * Kural 24 (revize 2026-09-18): Lenis artık `lenis/react` provider'ı ile değil,
 * **lazy** kurulup bu store üzerinden paylaşılır — `lenis/react` ilk yükleme JS'ine
 * 21.6 kB gz ekliyordu (Kural 46 hedefi 200 kB). Provider'ın tek işlevi context
 * paylaşımıydı; store aynısını sağlıyor ve ağaç sarmalanmadığı için SSR bozulmuyor.
 */
interface LenisState {
  lenis: Lenis | null;
  setLenis: (l: Lenis | null) => void;
}

export const useLenisStore = create<LenisState>((set) => ({
  lenis: null,
  setLenis: (lenis) => set({ lenis }),
}));

/** Lenis örneği — modül henüz yüklenmediyse `null`. Çağıranlar `lenis?.` ile korunur. */
export const useLenis = () => useLenisStore((s) => s.lenis);
