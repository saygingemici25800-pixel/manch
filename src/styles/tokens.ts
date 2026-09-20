// globals.css @theme bloğunun JS aynası (Kural 21). İkisi elle senkron tutulur.
// Kullanım: /lab önizlemesi, canvas/SVG gibi CSS değişkeni okuyamayan yerler.

export const colors = {
  berry: "#6a1f3b",
  "berry-dk": "#4e1030",
  sky: "#c4e4f3",
  tile: "#8fc3d6",
  cream: "#f4eee6",
  paper: "#e9dcc6",
  pink: "#e9a3b8",
  mustard: "#f6c343",
  ink: "#1b1b1b",

  // Malzeme ikonları (CursorTrail) — cheddar ayrı token almaz, mustard'ı kullanır.
  tomato: "#c6412f",
  lettuce: "#6a9440",
  pickle: "#55762c",
  patty: "#7b4a2e",
  brioche: "#d9a15b",
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
