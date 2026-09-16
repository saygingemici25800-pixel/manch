// Tek font tanım dosyası (next/font "font definitions file" kalıbı).
// Her font tek instance; @theme'deki --font-display / --font-ui / --font-pixel bu değişkenleri tüketir.
import { Modak, Mouse_Memoirs, Silkscreen } from "next/font/google";

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

// Kural 18 (karar 2026-09-17): Silkscreen ğşıĞŞİ içermez → font-pixel SADECE İngilizce metinlerde (tape/marquee).
export const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-silkscreen",
});

export const fontVariables = [modak.variable, mouseMemoirs.variable, silkscreen.variable].join(" ");
