// globals.css @theme bloğunun JS aynası (Kural 21). İkisi elle senkron tutulur.
// Kullanım: /lab önizlemesi, canvas/SVG gibi CSS değişkeni okuyamayan yerler.

export const colors = {
  // MARKA KİTİ (karar 2026-09-28) — globals.css @theme ile elle senkron (Kural 21).
  // `tile` ile `sky` aynı değerde: sınıf adları korundu, dosyalar açılmadı.
  berry: "#77133E",
  sky: "#C3E5F7",
  tile: "#C3E5F7",
  cream: "#FFF9F2",
  ink: "#1b1b1b",
} as const;

export type ColorToken = keyof typeof colors;
export const colorTokens = Object.keys(colors) as ColorToken[];

export const fonts = {
  display: { token: "--font-display", label: "Modak", class: "font-display" },
  ui: { token: "--font-ui", label: "Mouse Memoirs", class: "font-ui" },
  pixel: { token: "--font-pixel", label: "Press Start 2P", class: "font-pixel" },
} as const;

export type FontToken = keyof typeof fonts;
export const fontTokens = Object.keys(fonts) as FontToken[];

/** Kural 21: her fontta bu 12 karakter doğrulanır. */
export const TR_GLYPHS = ["ğ", "ş", "ı", "İ", "ç", "ö", "ü", "Ğ", "Ş", "Ç", "Ö", "Ü"] as const;

export const easing = { jelly: "cubic-bezier(0.4, 1.6, 0.7, 0.95)" } as const;
