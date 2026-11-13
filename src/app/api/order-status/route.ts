import { getEffectivePrices } from "@/lib/menu-prices";
import { clockFrom, getOrderStatus } from "@/lib/order/status";
import type { OrderStatusResponse } from "@/lib/order/status-core";
import { priceVersion } from "@/lib/prices";

/**
 * Canlı sipariş durumu — her istekte hesaplanır, önbelleğe ALINMAZ (saat ilerledikçe ve
 * sahip panelden kapattıkça değişir). Statik sayfalara gömülmez (Kural 46).
 *
 * Cevapta iki yardımcı alan:
 *   · `now` — sunucu saati. İstemci kapanış anını KENDİ saatiyle değil, bu saat +
 *     monoton süre ile yeniden değerlendirir (cihaz saati yanlışsa bile doğru kapanır).
 *   · `pricesVersion` — etkin fiyat tablosunun imzası. İstemcininki farklıysa sekme
 *     panelden önce açılmıştır: sayfa verisi tazelenir, o arada gönder kapalı kalır.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const now = clockFrom(req);
  const status = await getOrderStatus(now);
  let pricesVersion: string | null = null;
  try {
    pricesVersion = priceVersion(await getEffectivePrices());
  } catch {
    /* fiyat tablosu okunamadı — sürüm denetimi bu cevapta atlanır */
  }
  const body: OrderStatusResponse = { ...status, now: now.toISOString(), pricesVersion };
  return Response.json(body, { headers: { "cache-control": "no-store" } });
}
