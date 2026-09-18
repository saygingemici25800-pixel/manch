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

import { CHAR_VIEWS, drawCapy, type CharView } from "@/lib/zone/capy";
import { trackTexture } from "@/lib/zone/textures";

import type { Character } from "@/store/zone";

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

/** Çizim ve görünüm eşlemesi three'siz modülde (`capy.ts`); sahne tarafı buradan tüketir. */
export { CHAR_VIEWS, drawCapy, mirrorFor, viewFor, type CharView } from "@/lib/zone/capy";

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
