// Tek font tanım dosyası (next/font "font definitions file" kalıbı).
// Her font tek instance; @theme'deki --font-display / --font-ui / --font-pixel bu değişkenleri tüketir.
import { Modak, Mouse_Memoirs, Press_Start_2P, Silkscreen } from "next/font/google";

export const modak = Modak({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-modak",
});

export const mouseMemoirs = Mouse_Memoirs({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-mouse-memoirs",
});

// Kural 18 sonucu (2026-09-17): Silkscreen'de ğ ş ı Ğ Ş İ yok (latin-ext dilimi 18 glyph),
// Press Start 2P 12/12 TR karakteri kapsıyor → font-pixel = Press Start 2P.
export const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-press-start",
});

// Silkscreen sadece /lab karşılaştırması için (font-pixel-alt); preload edilmez.
export const silkscreen = Silkscreen({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  variable: "--font-silkscreen",
});

export const fontVariables = [
  modak.variable,
  mouseMemoirs.variable,
  pressStart.variable,
  silkscreen.variable,
].join(" ");
