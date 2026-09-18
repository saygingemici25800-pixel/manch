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
// Ölçüm 2026-09-18: next/font varsayılanı her aileyi preload eder (3 aile × 2 dilim = 6 woff2).
// Press Start 2P yalnızca küçük aksanlarda (marquee bandı, tape, adım numarası) — ilk boyamanın
// LCP adayı değil → `preload: false`. Böylece Modak ve Mouse Memoirs daha erken iniyor.
export const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  variable: "--font-press-start",
});

export const fontVariables = [
  modak.variable,
  mouseMemoirs.variable,
  pressStart.variable,
].join(" ");
