// globals.css @theme ile birebir aynı tutulur; /lab sayfası ve JS tarafı (ör. GSAP renk tween'leri) buradan okur.
export const colors = {
  berry: "#7A1F4B",
  "berry-dk": "#4E1030",
  sky: "#C4E4F3",
  tile: "#8FC3D6",
  cream: "#F4EEE6",
  paper: "#E9DCC6",
  pink: "#E9A3B8",
  mustard: "#F6C343",
  ink: "#1B1B1B",
} as const;

export type ColorToken = keyof typeof colors;

export const fonts = [
  { token: "display", label: "Modak", cssVar: "--font-modak", className: "font-display", enOnly: false },
  { token: "ui", label: "Mouse Memoirs", cssVar: "--font-mouse-memoirs", className: "font-ui", enOnly: false },
  { token: "pixel", label: "Silkscreen", cssVar: "--font-silkscreen", className: "font-pixel", enOnly: true },
] as const;

export const trTestChars = "ğüşıöçĞÜŞİÖÇ";
