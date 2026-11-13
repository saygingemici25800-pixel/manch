import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";
import { useOrderStatusStore } from "@/lib/order/status-store";
import { priceVersion, type PriceMap } from "@/lib/prices";

/**
 * Sekmedeki fiyatlar sunucununkiyle aynı mı? Değilse (panel arada fiyat değiştirdi)
 * sayfa verisi tazelenir; tazelenene kadar gönder kapalı tutulur. Durum her yoklandığında
 * (20 sn) hâlâ eskiyse yeniden denenir — tek denemede ISR henüz yenilenmemişse takılmasın.
 */
export function usePricesStale(prices: PriceMap): boolean {
  const server = useOrderStatusStore((s) => s.resp?.pricesVersion ?? null);
  const perfAt = useOrderStatusStore((s) => s.perfAt);
  const stale = server !== null && server !== priceVersion(prices);
  const router = useRouter();
  useEffect(() => {
    if (stale) router.refresh();
  }, [stale, perfAt, router]);
  return stale;
}
