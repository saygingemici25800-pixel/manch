// Tek font tanım dosyası (next/font "font definitions file" kalıbı, Kural 21).
// Her font tek instance; @theme inline'daki --font-* bu değişkenleri tüketir.
import { Modak, Mouse_Memoirs, Press_Start_2P } from "next/font/google";

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

// Kural 18: font-pixel = Press Start 2P (12/12 TR karakteri). Silkscreen ğşıĞŞİ içermediği
// için kullanılmaz; /lab'da karşılaştırma amaçlı font-pixel-alt olarak durur (preload: false).
export const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-press-start",
});

export const fontVariables = [
  modak.variable,
  mouseMemoirs.variable,
  pressStart.variable,
].join(" ");
