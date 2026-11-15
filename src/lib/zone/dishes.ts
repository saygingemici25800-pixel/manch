/**
 * Tezgâhtaki burger kesitleri — `art.ts` ile aynı kalıp: **önce yer tutucu, sonra gerçek
 * görsel.** Sahne beklemez; `TextureLoader` bitince doku yerinde değişir. Görsel
 * yüklenemezse yer tutucu kalır (Kural 7).
 *
 * Doku defterine bağlı (`trackTexture`): sahne kapanınca `releaseDishes()` hepsini bırakır,
 * `zone-leak-check` aç-kapa-aç'ta sayının sabit kaldığını ölçer.
 */
import * as THREE from "three";

import { dishPlaceholderTexture, trackTexture } from "@/lib/zone/textures";

interface Dish {
  texture: THREE.Texture;
  source: "placeholder" | "image";
  /**
   * Görselin altındaki şeffaf payın yüksekliğe oranı (0..1). Kesitlerde %14–19 —
   * sprite tabağa bu kadar gömülmezse burger **havada** durur (2026-11-15, kullanıcı).
   * Gerçek görsel gelince alfadan ölçülür; slug başına sabit gömülmez.
   */
  base: number;
  dispose: () => void;
}

/** Yer tutucu için tahmini pay (kesitlerin ölçülen ortalaması). */
const BASE_GUESS = 0.16;

/** Alfa > 40 olan en alt satır → alttaki şeffaf payın oranı. Ölçülemezse tahmin. */
function measureBase(img: CanvasImageSource & { width: number; height: number }): number {
  try {
    const n = 96;
    const c = document.createElement("canvas");
    c.width = n;
    c.height = n;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return BASE_GUESS;
    ctx.drawImage(img, 0, 0, n, n);
    const a = ctx.getImageData(0, 0, n, n).data;
    for (let y = n - 1; y >= 0; y--) {
      for (let x = 0; x < n; x++) if (a[(y * n + x) * 4 + 3] > 40) return (n - 1 - y) / n;
    }
  } catch {
    // ölçülemezse tahmin
  }
  return BASE_GUESS;
}

const dishes = new Map<string, Dish>();

/** Aynı `slug` için hep aynı nesne — render/kare içinde çağrılması güvenli (idempotent). */
export function acquireDish(slug: string, url: string, anisotropy: number): Dish {
  const current = dishes.get(slug);
  if (current) return current;

  let disposed = false;
  const dish: Dish = {
    texture: dishPlaceholderTexture(),
    source: "placeholder",
    base: BASE_GUESS,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      dish.texture.dispose();
    },
  };
  dishes.set(slug, dish);

  new THREE.TextureLoader().load(
    url,
    (t) => {
      if (disposed) {
        trackTexture(t, "dish").dispose();
        return;
      }
      trackTexture(t, "dish");
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = anisotropy;
      dish.texture.dispose(); // yer tutucu gider
      dish.texture = t;
      dish.source = "image";
      dish.base = measureBase(t.image as HTMLImageElement);
    },
    undefined,
    // Kural 56: görsel gelmezse sessizce yer tutucuda kalınır.
    () => {},
  );

  return dish;
}

/** Dev/QA: hangi kesit gerçek görseli aldı. */
export function dishSources(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [slug, d] of dishes) out[slug] = d.source;
  return out;
}

/** Dev/QA: her kesitin ölçülen alt payı. */
export function dishBases(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [slug, d] of dishes) out[slug] = d.base;
  return out;
}

export function releaseDishes() {
  for (const d of dishes.values()) d.dispose();
  dishes.clear();
}

/**
 * Sahne üstünde gezinirken imleç (tıklanabilir nesnede el). Kural 25: dış nesne mutasyonu
 * closure'da yapılmaz, plain fonksiyona taşınır.
 */
export function setSceneCursor(el: HTMLElement, cursor: string) {
  el.style.cursor = cursor;
}
