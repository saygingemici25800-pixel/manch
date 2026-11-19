import "server-only";

import { hoursWindow } from "@/lib/hours";
import { combineStatus, type OrderStatus } from "@/lib/order/status-core";
import { site } from "@/lib/site";
import { getStore } from "@/lib/store";
import { cachedStoreRead } from "@/lib/store/cached";

export const ORDERING_TAG = "ordering";

/**
 * Elle aç/kapa anahtarı — KISA önbellek. Durum ucu herkese açık ve kimliksiz; her istek
 * Redis'e gitseydi biri ucu döverek Upstash kotasını tüketebilir, kota bitince de
 * anahtar okunamaz → "açık" sayılır ve sahibin "kapalı" kararı düşerdi (inceleme
 * 2026-11-13). Sahip düğmeye basınca `revalidateTag(ORDERING_TAG, { expire: 0 })` → anında.
 * Saat hesabı önbelleğin DIŞINDA, her istekte yapılır. Development'ta önbellek yok (Kural 83).
 */
const readOrdering = cachedStoreRead(async () => getStore().getOrderingEnabled(), ["ordering-v1"], {
  tags: [ORDERING_TAG],
  revalidate: 30,
});

/**
 * Sunucu otoritesi. Depo okunamazsa elle düğme "açık" sayılır (sitenin sipariş alması
 * tamamen depoya bağlı kalmasın), saat kuralı her koşulda uygulanır.
 */
export async function getOrderStatus(now: Date = new Date()): Promise<OrderStatus> {
  let manual = true;
  try {
    manual = await readOrdering();
  } catch (e) {
    console.error("[MANCH] sipariş anahtarı okunamadı, açık sayılıyor:", e);
  }
  return combineStatus(manual, hoursWindow(now, site.hours));
}

/**
 * Test saati — `x-test-now` başlığı YALNIZ şu iki durumda dinlenir:
 *   · development sunucusu (`NODE_ENV !== "production"`) — Vercel'de hiç olmaz
 *   · yerel prod build `ORDER_TEST_CLOCK=1` ile başlatılmışsa (Vercel'de tanımlanmaz)
 *
 * NEDEN ŞART: bekçiler (`lab-check`, `zone-camera-check`) gerçek saatte koşuyor. Saat
 * kuralı gelince gece 23:45'te koşan bir `lab-check` sepeti GERÇEKTEN kapalı bulur ve
 * "gönder etkin" kontrolü düşer — yani bekçi günün saatine bağımlı, oynak olurdu
 * (Kural 60: ölçtüğün şey ürün mü, ortam mı?). Bekçiler sabit bir açık saat gönderir;
 * "saat dışında kapalı mı" sorusu da gece yarısını beklemeden sorulabilir.
 */
export function clockFrom(req: Request): Date {
  const testable = process.env.NODE_ENV !== "production" || process.env.ORDER_TEST_CLOCK === "1";
  if (!testable) return new Date();
  const h = req.headers.get("x-test-now");
  const d = h ? new Date(h) : null;
  return d && !Number.isNaN(d.getTime()) ? d : new Date();
}
