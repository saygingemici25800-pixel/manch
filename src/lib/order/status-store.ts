import { useEffect } from "react";
import { create } from "zustand";

import { localStatus, statusAt, type OrderStatus, type OrderStatusResponse } from "@/lib/order/status-core";

/**
 * İstemcide canlı sipariş durumu. Statik sayfaya GÖMÜLMEZ — saat ilerledikçe ve sahip
 * panelden kapattıkça değişir. Sepet / sipariş tahtası açıkken tazelenir.
 *
 * İnceleme düzeltmeleri (2026-11-13):
 *   · Ağ hatası SON BİLİNEN sunucu durumunu silmez. İlk yazımda tek bir başarısız istek
 *     sahibin "kapalı" kararını istemcide "açık"a çeviriyordu. Yerel saat yedeği yalnız
 *     hiç cevap alınmamışsa devreye girer.
 *   · 60 sn → 20 sn, sekme görünür olunca hemen tazeleme, kapanış anı yerelde yeniden
 *     hesaplanır (`statusAt`) — kapanıştan sonra "açık" kalan pencere daralır.
 */
interface State {
  resp: OrderStatusResponse | null;
  /** `resp` alındığı andaki monoton zaman (performance.now). */
  perfAt: number;
  refresh: () => Promise<void>;
}

export const useOrderStatusStore = create<State>()((set) => ({
  resp: null,
  perfAt: 0,
  refresh: async () => {
    try {
      const r = await fetch("/api/order-status", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      set({ resp: (await r.json()) as OrderStatusResponse, perfAt: performance.now() });
    } catch {
      /* bilinçli olarak dokunma: son bilinen cevap korunur */
    }
  },
}));

function evaluate(resp: OrderStatusResponse | null, perfAt: number): OrderStatus {
  return resp ? statusAt(resp, performance.now() - perfAt) : localStatus();
}

/** Okuma. Seçiciler KARARLI değerleri alır; değerlendirme render'da yapılır. */
export function useOrderStatus(): OrderStatus {
  const resp = useOrderStatusStore((s) => s.resp);
  const perfAt = useOrderStatusStore((s) => s.perfAt);
  return evaluate(resp, perfAt);
}

/** Sunucunun bildirdiği fiyat imzası (henüz cevap yoksa null). */
export function useServerPricesVersion(): string | null {
  return useOrderStatusStore((s) => s.resp?.pricesVersion ?? null);
}

/** `active` iken: hemen, 20 sn'de bir ve sekme her görünür olduğunda tazeler. */
export function useOrderStatusPolling(active: boolean) {
  const refresh = useOrderStatusStore((s) => s.refresh);
  useEffect(() => {
    if (!active) return;
    void refresh();
    const id = setInterval(() => void refresh(), 20_000);
    const onVis = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active, refresh]);
}

// Dev/QA: bekçiler durumun yüklendiğini buradan bekler (yalnız development).
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__ORDER_STATUS__ = useOrderStatusStore;
}
