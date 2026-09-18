/**
 * Maskot çizimi ve açı → görünüm eşlemesi — **three.js'siz.**
 *
 * Neden ayrı dosya: `CharacterSelect` (kapı ekranı, ana sayfada) yalnızca `drawCapy`'ye
 * ihtiyaç duyuyor. Bunlar three içeren `character.ts`'te dururken kapı bileşeni onu statik
 * import ediyordu ve **three ana sayfaya sızıyordu** — `/tr` ilk yüklemesi 215.5 → 318.8 kB gz
 * (2026-09-18; `zone-bundle-check` yakaladı). Burada yalnızca `CanvasRenderingContext2D` var.
 *
 * Kural 61'in kardeşi: sızıntı, ağır kütüphaneyi **dolaylı** çeken bir client component'ten de
 * gelir — o bileşenin kütüphaneyi doğrudan import etmesi gerekmez.
 */
import { colors } from "@/styles/tokens";

import type { Character } from "@/store/zone";

export type CharView = "back" | "back34" | "side" | "front";

export const CHAR_VIEWS: readonly CharView[] = ["back", "back34", "side", "front"];

/* ------------------------------ açı → görünüm ------------------------------ */

/** |rel| 0 = sırtı dönük … π = yüzü bize dönük. 5 kova, 4 çizim (spec 8.1). */
const VIEW_BY_BUCKET: readonly CharView[] = ["back", "back34", "side", "front", "front"];

export function viewFor(rel: number): CharView {
  return VIEW_BY_BUCKET[Math.min(4, Math.round(Math.abs(rel) / (Math.PI / 4)))];
}

/**
 * Sol taraf için ayrı çizim YOK — `scale.x = -1` ile aynalanır (spec 8.1).
 * `back` ve `front` simetrik oldukları için aynalanmaz (aynalamak boşuna doku değişimi olur).
 */
export function mirrorFor(rel: number, view: CharView): boolean {
  return rel < 0 && view !== "back" && view !== "front";
}

/* ------------------------- geçici sprite: drawCapy ------------------------- */

/**
 * Prototipteki `drawCapy()`'nin TS karşılığı. Line-art kapibara: bordo kontur, beyaz dolgu.
 * Misu kulaklıklı, Miyu güneş gözlüklü (spec 8: logodaki gözlüklü figür **Miyu**).
 * `back34` ve `side` **sola** bakar — sağ taraf kodda aynalanır.
 */
export function drawCapy(
  x: CanvasRenderingContext2D,
  view: CharView,
  who: Character,
  w: number,
  h: number,
) {
  const s = w / 220;
  const cx = w / 2;
  const ground = h - 10 * s;

  x.clearRect(0, 0, w, h);
  x.lineJoin = "round";
  x.lineCap = "round";
  x.strokeStyle = colors.berry;
  x.fillStyle = "#fff";

  const side = view === "side";
  const b34 = view === "back34";
  const front = view === "front";
  const lean = side ? 26 * s : b34 ? 13 * s : 0;

  // bacaklar
  x.lineWidth = 6 * s;
  for (const dx of [-26, 26]) {
    x.beginPath();
    x.ellipse(cx + dx * s + lean * 0.3, ground - 8 * s, 13 * s, 9 * s, 0, 0, 7);
    x.fill();
    x.stroke();
  }

  // gövde
  x.lineWidth = 7 * s;
  x.beginPath();
  x.ellipse(cx + lean * 0.25, ground - 62 * s, (side ? 56 : 48) * s, 58 * s, 0, 0, 7);
  x.fill();
  x.stroke();

  // kafa
  const hy = ground - 156 * s;
  const hx = cx + lean;
  x.beginPath();
  x.ellipse(hx, hy, (side ? 54 : 52) * s, 44 * s, 0, 0, 7);
  x.fill();
  x.stroke();

  // burun/ağız kütlesi — arkadan görünmez
  if (side) {
    x.beginPath();
    x.ellipse(hx - 46 * s, hy + 12 * s, 26 * s, 22 * s, 0, 0, 7);
    x.fill();
    x.stroke();
  } else if (front) {
    x.beginPath();
    x.ellipse(hx, hy + 20 * s, 30 * s, 20 * s, 0, 0, 7);
    x.fill();
    x.stroke();
  } else if (b34) {
    x.beginPath();
    x.ellipse(hx - 40 * s, hy + 14 * s, 18 * s, 15 * s, 0, 0, 7);
    x.fill();
    x.stroke();
  }

  // kulaklar
  x.lineWidth = 6 * s;
  for (const [ex, ey] of side ? [[18, -40]] : [[-36, -34], [36, -34]]) {
    x.beginPath();
    x.ellipse(hx + ex * s, hy + ey * s, 13 * s, 11 * s, 0, 0, 7);
    x.fill();
    x.stroke();
  }

  // yüz — sırtı dönükken yok
  x.fillStyle = colors.berry;
  if (front) {
    x.beginPath();
    x.arc(hx - 19 * s, hy - 2 * s, 5 * s, 0, 7);
    x.fill();
    x.beginPath();
    x.arc(hx + 19 * s, hy - 2 * s, 5 * s, 0, 7);
    x.fill();
    x.lineWidth = 4 * s;
    x.beginPath();
    x.arc(hx, hy + 16 * s, 9 * s, 0.2 * Math.PI, 0.8 * Math.PI);
    x.stroke();
  } else if (side) {
    x.beginPath();
    x.arc(hx - 12 * s, hy - 6 * s, 5 * s, 0, 7);
    x.fill();
  }

  // aksesuar — karakterin imzası, her açıdan görünür
  x.fillStyle = "#fff";
  x.lineWidth = 6 * s;
  if (who === "misu") {
    // kulaklık
    x.beginPath();
    x.arc(hx, hy - 6 * s, 50 * s, Math.PI * 1.12, Math.PI * 1.88);
    x.stroke();
    for (const [px, py] of side ? [[46, -6]] : [[-50, -4], [50, -4]]) {
      x.beginPath();
      x.ellipse(hx + px * s, hy + py * s, 12 * s, 17 * s, 0, 0, 7);
      x.fill();
      x.stroke();
    }
  } else {
    // güneş gözlüğü, kafanın üstünde
    x.beginPath();
    x.ellipse(hx - 20 * s, hy - 34 * s, 15 * s, 11 * s, 0, 0, 7);
    x.fill();
    x.stroke();
    x.beginPath();
    x.ellipse(hx + 20 * s, hy - 34 * s, 15 * s, 11 * s, 0, 0, 7);
    x.fill();
    x.stroke();
    x.beginPath();
    x.moveTo(hx - 6 * s, hy - 36 * s);
    x.lineTo(hx + 6 * s, hy - 36 * s);
    x.stroke();
  }

  // ince tişört bandı — ikisini uzaktan ayırır
  x.strokeStyle = who === "misu" ? colors.berry : colors.tile;
  x.lineWidth = 9 * s;
  x.beginPath();
  x.moveTo(cx - 34 * s + lean * 0.25, ground - 96 * s);
  x.lineTo(cx + 34 * s + lean * 0.25, ground - 96 * s);
  x.stroke();
  x.strokeStyle = colors.berry;
}
