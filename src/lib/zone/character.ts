/**
 * Misu & Miyu — 4 açılık sprite seti (spec bölüm 8).
 *
 * İki kaynak, TEK arayüz:
 *   1. `drawCapy()` — koddan üretilen geçici sprite (çizimler gelene kadar)
 *   2. `TextureLoader` — `public/images/mascots/` altındaki 8 gerçek PNG
 *
 * `createCharacterSet()` **her zaman önce çizilmiş sprite'ı döndürür** (sahne beklemez),
 * arka planda PNG'leri dener ve gelirse alanları YERİNDE değiştirir. Sahne kodu her karede
 * `set[view]` okur; hangi kaynaktan geldiğini bilmez, bilmesi de gerekmez.
 * Çizimler düştüğünde `MASCOT_SPRITE_BASE` sabiti dolar — **başka hiçbir şey değişmez** (spec 8.2).
 */
import * as THREE from "three";

import { trackTexture } from "@/lib/zone/textures";
import { colors } from "@/styles/tokens";

import type { Character } from "@/store/zone";

export type CharView = "back" | "back34" | "side" | "front";

export const CHAR_VIEWS: readonly CharView[] = ["back", "back34", "side", "front"];

/**
 * Çizimler (8 PNG) geldiğinde burası `"/images/mascots"` olur; şu an dosyalar YOK.
 *
 * Neden otomatik yoklama yapmıyoruz: var olmayan PNG'ye atılan istek 404 üretir, Kural 53'ün
 * ağ denetimine takılır ve konsolu kirletir — üstelik Zone ana sayfaya bağlanınca (5.5.10)
 * her açılışta 8 boş istek demek olur. Dev'de `?sprites=<yol>` ile aynı yol denenebilir
 * (`resolveSpriteBase`), böylece yükleyici ölü kod olarak kalmaz.
 */
export const MASCOT_SPRITE_BASE: string | null = null;

function resolveSpriteBase(override?: string | null): string | null {
  if (override !== undefined) return override;
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search).get("sprites");
    if (q) return q.replace(/\/$/, "");
  }
  return MASCOT_SPRITE_BASE;
}

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

/* ------------------------------- sprite seti ------------------------------- */

export interface CharacterSet {
  back: THREE.Texture;
  back34: THREE.Texture;
  side: THREE.Texture;
  front: THREE.Texture;
  /** QA/lab okur: geçici çizim mi, gerçek PNG mi ekranda. */
  source: "drawn" | "png";
  dispose: () => void;
}

const SPRITE_W = 220;
const SPRITE_H = 280;

function drawnTexture(who: Character, view: CharView, anisotropy: number) {
  const c = document.createElement("canvas");
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  drawCapy(c.getContext("2d")!, view, who, SPRITE_W, SPRITE_H);
  const t = trackTexture(new THREE.CanvasTexture(c), "sprite");
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

/**
 * Sprite setini üretir. Çizilmiş sprite'lar **senkron** hazırdır; PNG'ler varsa
 * yüklendikçe değil, **dördü birden** yüklendiğinde yerine geçer — yarım set
 * (iki gerçek + iki çizim) dönerken zıplayan bir karakter demek olurdu.
 */
export function createCharacterSet(
  who: Character,
  { anisotropy = 4, base }: { anisotropy?: number; base?: string | null } = {},
): CharacterSet {
  const set: CharacterSet = {
    back: drawnTexture(who, "back", anisotropy),
    back34: drawnTexture(who, "back34", anisotropy),
    side: drawnTexture(who, "side", anisotropy),
    front: drawnTexture(who, "front", anisotropy),
    source: "drawn",
    dispose: () => {},
  };

  let disposed = false;
  set.dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const v of CHAR_VIEWS) set[v].dispose();
  };

  const root = resolveSpriteBase(base);
  if (root) {
    const loader = new THREE.TextureLoader();
    const all = CHAR_VIEWS.map(
      (v) =>
        new Promise<[CharView, THREE.Texture]>((resolve, reject) => {
          loader.load(`${root}/${who}-${v}.png`, (t) => resolve([v, t]), undefined, reject);
        }),
    );
    void Promise.all(all)
      .then((loaded) => {
        if (disposed) {
          // sahne bu arada kapandı — yeni dokular da bırakılır, yoksa sızıntı olur
          for (const [, t] of loaded) trackTexture(t, "sprite").dispose();
          return;
        }
        for (const [v, t] of loaded) {
          trackTexture(t, "sprite");
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = anisotropy;
          set[v].dispose(); // çizilmiş yedek gider
          set[v] = t;
        }
        set.source = "png";
      })
      // Kural 56: isteğe bağlı varlık — gelmezse sessizce çizilmiş sprite'ta kalınır.
      .catch(() => {});
  }

  return set;
}

/* ---------------------------- tekil set yönetimi ---------------------------- */

/**
 * Sprite setleri **karakter başına** tutulur: 5.5.4'ten itibaren sahnede aynı anda İKİ maskot var
 * (oyuncu + NPC). Tek bir tekil set olsaydı ikisi birbirinin dokusunu bırakırdı — NPC her karede
 * `acquire` çağırdıkça set sıfırdan üretilir, oyuncununki çöpe giderdi.
 *
 * Bileşenler her karede `acquire…` çağırır; karakter ve anizotropi değişmedikçe aynı set döner.
 * Mutasyon bu modülün içinde kalır — Kural 25.
 */
const sets = new Map<Character, { anisotropy: number; set: CharacterSet }>();

export function acquireCharacterSet(who: Character, anisotropy: number): CharacterSet {
  const current = sets.get(who);
  if (current && current.anisotropy === anisotropy) return current.set;
  current?.set.dispose();
  const set = createCharacterSet(who, { anisotropy });
  sets.set(who, { anisotropy, set });
  return set;
}

/** Sahne kapanınca iki setin ikisi de bırakılır (spec bölüm 9). */
export function releaseCharacterSets() {
  for (const { set } of sets.values()) set.dispose();
  sets.clear();
}
