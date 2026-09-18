/**
 * Zone dokuları — hepsi runtime'da `<canvas>` 2D ile üretilir (spec bölüm 1).
 * Blender yok, .glb yok, indirilecek doku yok.
 *
 * Prototipteki (`docs/reference/manch-zone-prototype.html`) fonksiyonların TS karşılıkları.
 * Renkler `@/styles/tokens` üzerinden gelir — prototip eski `berry #7A1F4B` değerini
 * kullanıyordu, proje tokeni **#6a1f3b** (karar 2026-09-18).
 *
 * Kural 59 / spec 4.2: yazı içeren dokular `document.fonts.ready` sonrası YENİDEN çizilir,
 * yoksa Google fontları geç geldiği için yedek fontla kalırlar. `redrawTextTextures()` bunun için.
 */
import * as THREE from "three";

import { colors } from "@/styles/tokens";

const C = {
  berry: colors.berry,
  berryDk: colors["berry-dk"],
  sky: colors.sky,
  tile: colors.tile,
  cream: colors.cream,
  paper: colors.paper,
  pink: colors.pink,
  mustard: colors.mustard,
  ink: colors.ink,
} as const;

/** berry'nin rgba karşılığı — künye metninde yarı saydam kullanılır. */
const BERRY_RGB = "106, 31, 59";

function cv(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function tex(c: HTMLCanvasElement, rx?: number, ry?: number) {
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  if (rx) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry ?? rx);
  }
  return t;
}

/** Yüzeye ince grain serpiştirir (site genelindeki .06 dokusuyla aynı fikir). */
function grain(x: CanvasRenderingContext2D, size: number, count: number, alpha: number) {
  x.globalAlpha = alpha;
  x.fillStyle = C.ink;
  for (let i = 0; i < count; i++) x.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  x.globalAlpha = 1;
}

/* ---------------------------------- zemin ---------------------------------- */

/** Bordo–krem dama, 128 px kare, `repeat(10, 26)`. */
export function floorTexture() {
  const c = cv(256, 256);
  const x = c.getContext("2d")!;
  x.fillStyle = C.cream;
  x.fillRect(0, 0, 256, 256);
  x.fillStyle = C.berry;
  x.fillRect(0, 0, 128, 128);
  x.fillRect(128, 128, 128, 128);
  grain(x, 256, 1400, 0.06);
  return tex(c, 10, 26);
}

/* --------------------------------- duvarlar -------------------------------- */

/** Mavi karo + beyaz derz, 64 px grid, `repeat(6, 3)`. */
export function tileTexture() {
  const c = cv(256, 256);
  const x = c.getContext("2d")!;
  x.fillStyle = C.tile;
  x.fillRect(0, 0, 256, 256);
  x.strokeStyle = "rgba(255,255,255,.55)";
  x.lineWidth = 6;
  for (let i = 0; i <= 256; i += 64) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, 256);
    x.moveTo(0, i);
    x.lineTo(256, i);
    x.stroke();
  }
  grain(x, 256, 900, 0.05);
  return tex(c, 6, 3);
}

/** Yazı çizilecek duvarlar için karo zeminli canvas (tekrarsız, tek parça). */
function tiledWall(w: number, h: number, step: number) {
  const c = cv(w, h);
  const x = c.getContext("2d")!;
  x.fillStyle = C.tile;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "rgba(255,255,255,.5)";
  x.lineWidth = 8;
  for (let i = 0; i <= w; i += step) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, h);
    x.stroke();
  }
  for (let k = 0; k <= h; k += step) {
    x.beginPath();
    x.moveTo(0, k);
    x.lineTo(w, k);
    x.stroke();
  }
  return c;
}

export interface PlaqueText {
  /** "MANCH" */
  title: string;
  /** "F E T H İ Y E · P A S P A T U R · 2 0 2 6" */
  place: string;
  /** Künye gövdesi — boş string paragraf arası demek. */
  body: readonly string[];
  /** "el yapımı, her katmanda" */
  footer: string;
}

/** Arka duvar — müze künyesi (spec 4.1). Metin i18n'den gelir. */
export function backWallTexture(t: PlaqueText) {
  const W = 2048;
  const H = 854;
  const c = tiledWall(W, H, 160);
  const x = c.getContext("2d")!;
  const left = W / 2 - 560;

  x.textAlign = "left";
  x.fillStyle = C.berry;
  x.font = '700 116px Modak, "Arial Black", sans-serif';
  x.fillText(t.title, left, 208);

  x.fillStyle = `rgba(${BERRY_RGB},.55)`;
  x.font = '400 28px "Press Start 2P", monospace';
  x.fillText(t.place, left + 8, 258);

  x.strokeStyle = `rgba(${BERRY_RGB},.35)`;
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(left, 300);
  x.lineTo(left + 1120, 300);
  x.stroke();

  x.fillStyle = "rgba(30,20,26,.88)";
  x.font = '400 46px "Mouse Memoirs", Arial, sans-serif';
  let y = 368;
  for (const line of t.body) {
    if (line) x.fillText(line, left, y);
    y += line ? 62 : 62 * 0.55;
  }

  // künye kenarlığı — sağ alt köşe
  x.strokeStyle = `rgba(${BERRY_RGB},.3)`;
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(left + 1120, y - 46);
  x.lineTo(left + 1120, y + 34);
  x.lineTo(left + 760, y + 34);
  x.stroke();

  x.fillStyle = `rgba(${BERRY_RGB},.6)`;
  x.font = '400 26px "Press Start 2P", monospace';
  x.fillText(t.footer, left, y + 64);

  return tex(c);
}

/** Ön duvar (z = +20) — kamera döndüğü için şart (spec bölüm 4). */
export function frontWallTexture(lines: readonly [string, string, string]) {
  const W = 2048;
  const H = 854;
  const c = tiledWall(W, H, 160);
  const x = c.getContext("2d")!;
  x.fillStyle = C.berry;
  x.textAlign = "center";
  x.font = '700 168px Modak, "Arial Black", sans-serif';
  x.fillText(lines[0], W / 2, 320);
  x.fillText(lines[1], W / 2, 470);
  x.font = '700 120px Modak, "Arial Black", sans-serif';
  x.fillText(lines[2], W / 2, 600);
  return tex(c);
}

/* -------------------------------- çerçeveler -------------------------------- */

/**
 * Görsel gelmeden çerçeve içeriği (Kural 7: kırık görsel yok, renkli blok).
 * `ZONE_FRAMES[].art` yüklenebildiğinde `TextureLoader` bunun yerine geçer.
 */
export function artPlaceholderTexture(title: string, kicker: string, waiting: string,
                                      bg: string = C.berry, fg: string = C.cream) {
  const c = cv(420, 600);
  const x = c.getContext("2d")!;
  x.fillStyle = bg;
  x.fillRect(0, 0, 420, 600);

  x.strokeStyle = fg;
  x.globalAlpha = 0.25;
  x.lineWidth = 3;
  for (let i = -600; i < 600; i += 26) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i + 600, 600);
    x.stroke();
  }
  x.globalAlpha = 1;

  x.fillStyle = fg;
  x.textAlign = "center";
  x.font = '400 30px "Mouse Memoirs", Arial, sans-serif';
  x.fillText(kicker, 210, 96);

  x.font = '400 86px Modak, "Arial Black", sans-serif';
  const words = title.split(" ");
  let y = 300 - (words.length - 1) * 44;
  for (const w of words) {
    x.fillText(w, 210, y);
    y += 88;
  }

  x.globalAlpha = 0.75;
  x.font = '400 22px "Press Start 2P", monospace';
  x.fillText(waiting, 210, 552);
  return tex(c);
}

/* ------------------------------ zemin decal'ları ----------------------------- */

/** Ayak izi (spec 8.3) — 18'lik havuzda sönerek kullanılır. */
export function footprintTexture() {
  const c = cv(64, 64);
  const x = c.getContext("2d")!;
  x.clearRect(0, 0, 64, 64);
  x.fillStyle = "rgba(27,27,27,.5)";
  x.beginPath();
  x.ellipse(32, 26, 13, 18, 0, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.ellipse(32, 50, 9, 7, 0, 0, Math.PI * 2);
  x.fill();
  return tex(c);
}

/** Tablonun önündeki halka: kesikli dış çember + ince iç çember + içe bakan 4 ok (spec 5.1). */
export function markerTexture() {
  const c = cv(512, 512);
  const x = c.getContext("2d")!;
  x.clearRect(0, 0, 512, 512);

  x.strokeStyle = "rgba(27,27,27,.8)";
  x.lineWidth = 11;
  x.setLineDash([34, 26]);
  x.beginPath();
  x.arc(256, 256, 214, 0, Math.PI * 2);
  x.stroke();
  x.setLineDash([]);

  x.strokeStyle = "rgba(27,27,27,.35)";
  x.lineWidth = 5;
  x.beginPath();
  x.arc(256, 256, 168, 0, Math.PI * 2);
  x.stroke();

  x.strokeStyle = "rgba(27,27,27,.7)";
  x.lineWidth = 13;
  x.lineCap = "round";
  x.lineJoin = "round";
  for (let i = 0; i < 4; i++) {
    x.save();
    x.translate(256, 256);
    x.rotate((i * Math.PI) / 2);
    x.beginPath();
    x.moveTo(-26, -140);
    x.lineTo(0, -110);
    x.lineTo(26, -140);
    x.stroke();
    x.restore();
  }
  return tex(c);
}

/** Halkanın nabzı — beyaz çizilir, materyalde `mustard` ile renklendirilir. */
export function pulseTexture() {
  const c = cv(256, 256);
  const x = c.getContext("2d")!;
  x.clearRect(0, 0, 256, 256);
  x.strokeStyle = "#fff";
  x.lineWidth = 14;
  x.beginPath();
  x.arc(128, 128, 110, 0, Math.PI * 2);
  x.stroke();
  return tex(c);
}

/** Karakterin altındaki yumuşak gölge — gölge haritası kapalı (spec 3.1). */
export function shadowTexture() {
  const c = cv(128, 128);
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(27,27,27,.55)");
  g.addColorStop(1, "rgba(27,27,27,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return tex(c);
}

/* ------------------------------ font tuzağı (4.2) ----------------------------- */

/**
 * Google fontları canvas'a GEÇ yüklenir; ilk çizimde yedek fontla çıkan yazılı dokular
 * öyle kalır. Sahne kurulduktan sonra bir kez çağrılır: eski doku dispose edilir,
 * yenisi üretilir, `needsUpdate` işaretlenir.
 */
export async function redrawTextTextures(
  redraw: () => void,
): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await document.fonts.ready;
  redraw();
}
