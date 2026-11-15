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
  dispose: () => void;
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
