import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartLine {
  slug: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  /** toast için: son eklenen ürün + zaman damgası */
  lastAdded: { slug: string; at: number } | null;
  add: (slug: string, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  count: () => number;
}

/** R12 — sepet, localStorage'da kalıcı (Kural 30: hydrate sonrası okunur). */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      lastAdded: null,
      add: (slug, qty = 1) =>
        set((s) => {
          const i = s.lines.findIndex((l) => l.slug === slug);
          const lines = i === -1
            ? [...s.lines, { slug, qty }]
            : s.lines.map((l, j) => (j === i ? { ...l, qty: l.qty + qty } : l));
          return { lines, lastAdded: { slug, at: Date.now() } };
        }),
      remove: (slug) => set((s) => ({ lines: s.lines.filter((l) => l.slug !== slug) })),
      setQty: (slug, qty) =>
        set((s) => ({
          lines: qty <= 0
            ? s.lines.filter((l) => l.slug !== slug)
            : s.lines.map((l) => (l.slug === slug ? { ...l, qty } : l)),
        })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
    }),
    {
      name: "manch-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

// Dev/QA: scripts/lab-check.mjs store'a buradan erişir (prod'da tree-shake edilir).
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__CART__ = useCartStore;
}
