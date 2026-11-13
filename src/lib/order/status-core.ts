import { hoursWindow, type HoursWindow } from "@/lib/hours";
import { site } from "@/lib/site";

/**
 * Sipariş alınıyor mu? — **elle açık VE çalışma saatinde.**
 *
 * Sahip paneldeki düğmeyle istediği an kapatabilir; saat dışında ise düğme açık olsa bile
 * kapalıdır (karar 2026-11-13, kullanıcı: "kapanış saatinde kapansın"). Saat dışında
 * elle açmak bilerek YOK — basit tutuldu, ihtiyaç doğarsa ayrı bir "zorla aç" eklenir.
 *
 * Kapalıyken **sepet görünür ve ürün eklenebilir**; yalnız gönder kapalıdır.
 *
 * Bu modül istemci + sunucu ortak: sunucu otoritedir, istemci yalnız sunucuya
 * ulaşamazsa aynı kuralı kendi saatiyle uygular (yedek).
 */
export interface OrderStatus {
  open: boolean;
  /** Kapalıysa sebebi — arayüz metnini seçer. */
  reason: "manual" | "hours" | null;
  /** Açıksa bugünkü kapanış. */
  closesAt: string | null;
  /** Saat yüzünden kapalıysa sıradaki açılış. */
  opensAt: string | null;
  opensToday: boolean;
}

export function combineStatus(manualOpen: boolean, w: HoursWindow): OrderStatus {
  if (!manualOpen) return { open: false, reason: "manual", closesAt: null, opensAt: null, opensToday: false };
  if (!w.withinHours) return { open: false, reason: "hours", closesAt: null, opensAt: w.opensAt, opensToday: w.opensToday };
  return { open: true, reason: null, closesAt: w.closesAt, opensAt: null, opensToday: false };
}

/** İstemci yedeği: sunucuya ulaşılamazsa elle düğme "açık" sayılır, SAAT yine uygulanır. */
export function localStatus(now: Date = new Date()): OrderStatus {
  return combineStatus(true, hoursWindow(now, site.hours));
}

/** `/api/order-status` cevabı: durum + sunucu saati + fiyat tablosu imzası. */
export interface OrderStatusResponse extends OrderStatus {
  now: string;
  pricesVersion: string | null;
}

/**
 * Sunucu cevabını, ALINDIĞINDAN BERİ GEÇEN süreyle yeniden değerlendirir. Kapanış anı
 * (23:29 → 23:30) sonraki yoklamayı beklemeden yakalanır. Saat KAYNAĞI cihaz değil sunucu:
 * `now` + monoton süre (`performance.now()` farkı) — telefonun saati yanlışsa bile doğru.
 * Kapalı cevap kapalı kalır; açılış bir sonraki tazelemede gelir.
 */
export function statusAt(resp: OrderStatusResponse, elapsedMs: number): OrderStatus {
  if (!resp.open) return resp;
  const w = hoursWindow(new Date(Date.parse(resp.now) + Math.max(0, elapsedMs)), site.hours);
  return w.withinHours ? resp : combineStatus(true, w);
}
