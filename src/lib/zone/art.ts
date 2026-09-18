/**
 * Çerçeve görselleri (spec bölüm 5).
 *
 * Karakter sprite'larıyla aynı kalıp: **önce yer tutucu, sonra gerçek görsel.** Sahne hiç
 * beklemez; `TextureLoader` bitince doku yerinde değişir, çerçeve kodu bunu bilmez.
 * Görsel yüklenemezse yer tutucu kalır (Kural 7: kırık görsel yok).
 */
import * as THREE from "three";

import type { FrameId } from "@/lib/zone/frames";
import { artPlaceholderTexture, trackTexture } from "@/lib/zone/textures";

export interface ArtTexture {
  texture: THREE.Texture;
  source: "placeholder" | "image";
}

const arts = new Map<FrameId, { key: string; art: ArtTexture; dispose: () => void }>();

/**
 * Bir çerçevenin görselini verir. Aynı `id` + aynı `key` için hep aynı nesne döner
 * (render sırasında çağrılması güvenli — idempotent, bkz. `acquireTexture`).
 */
export function acquireArt(
  id: FrameId,
  url: string,
  text: { title: string; kicker: string; waiting: string },
  anisotropy: number,
): ArtTexture {
  const key = `${url}|${text.title}|${text.kicker}|${anisotropy}`;
  const current = arts.get(id);
  if (current && current.key === key) return current.art;
  current?.dispose();

  const art: ArtTexture = {
    texture: artPlaceholderTexture(text.title, text.kicker, text.waiting),
    source: "placeholder",
  };
  let disposed = false;
  const entry = {
    key,
    art,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      art.texture.dispose();
    },
  };
  arts.set(id, entry);

  new THREE.TextureLoader().load(
    url,
    (t) => {
      if (disposed) {
        trackTexture(t, "art").dispose();
        return;
      }
      trackTexture(t, "art");
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = anisotropy;
      art.texture.dispose(); // yer tutucu gider
      art.texture = t;
      art.source = "image";
    },
    undefined,
    // Kural 56: görsel gelmezse sessizce yer tutucuda kalınır.
    () => {},
  );

  return art;
}

/** Dev/QA: hangi çerçeve gerçek görseli aldı, hangisi yer tutucuda kaldı. */
export function artSources(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, e] of arts) out[id] = e.art.source;
  return out;
}

export function releaseArts() {
  for (const a of arts.values()) a.dispose();
  arts.clear();
}
