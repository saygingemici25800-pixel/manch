import "server-only";

import { unstable_cache } from "next/cache";

import { mergePrices, type PriceMap } from "@/lib/prices";
import { getStore } from "@/lib/store";

export const PRICES_TAG = "menu-prices";

/**
 * Panel ezmeleri — önbellekli. Sayfalar statik kalır (Kural 46/72: her istekte depoya
 * gidilmez); fiyat değişince panel `revalidateTag(PRICES_TAG, { expire: 0 })` +
 * `revalidatePath` çağırır. Süreye bağlı yenileme YOK — tazeleme yalnız etiketle.
 *
 * `{ expire: 0 }` BİLEREK: Next 16'nın önerdiği `"max"` profili değişiklikten sonraki ilk
 * isteğe **eski fiyatı** servis eder. Fiyatta kabul edilemez.
 */
const readOverrides = unstable_cache(async () => getStore().getPrices(), ["menu-prices-v1"], { tags: [PRICES_TAG] });

/**
 * HATA YUTULMAZ (çalışma anında). İlk yazımda Redis hatasında menu.ts fiyatlarına
 * düşülüyordu; bu, sayfa yeniden üretilirken anlık bir aksaklığın sahibin fiyatlarını
 * sessizce geri almasına ve ISR sayfasına gömülmesine yol açıyordu (inceleme 2026-11-13).
 * Şimdi hata fırlar → Next yeniden üretimi başarısız sayar ve **önceki sayfayı korur**.
 *
 * Tek istisna BUILD: depo henüz bağlı değilken (ya da build anında erişilemezken) deploy
 * kırılmasın, sayfalar menu.ts fiyatlarıyla üretilsin.
 */
export async function getEffectivePrices(): Promise<PriceMap> {
  try {
    return mergePrices(await readOverrides());
  } catch (e) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.error("[MANCH] build: fiyat ezmeleri okunamadı, menu.ts fiyatları kullanılıyor:", e);
      return mergePrices({});
    }
    throw e;
  }
}
