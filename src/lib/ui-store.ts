import { create } from "zustand";

/** Global overlay/dialog durumu — Nav, MenuOverlay, Cart drawer, InfoModal. */
interface UiState {
  menuOpen: boolean;
  cartOpen: boolean;
  infoOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  setCartOpen: (v: boolean) => void;
  setInfoOpen: (v: boolean) => void;
  closeAll: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  menuOpen: false,
  cartOpen: false,
  infoOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setInfoOpen: (infoOpen) => set({ infoOpen }),
  closeAll: () => set({ menuOpen: false, cartOpen: false, infoOpen: false }),
}));
