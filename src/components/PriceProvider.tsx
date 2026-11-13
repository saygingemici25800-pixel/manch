"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { PriceMap } from "@/lib/prices";

/**
 * Etkin fiyatlar (panel ezmesi + menu.ts) — layout sunucuda okur, buradan dağıtılır.
 *
 * NEDEN BAĞLAM: fiyatı okuyan altı yerden ikisi (`Cart`, `OrderBoard`) istemcide statik
 * `getProduct()` kullanıyordu. Panelden fiyat değişince sayfadaki kart yeni fiyatı,
 * sepet eski fiyatı gösterecekti — WhatsApp mesajına da eski tutar yazılacaktı.
 * Tek kaynak: bu bağlam. SSR'da da dolu olduğu için ilk HTML doğru fiyatla gelir,
 * hidrasyon uyuşmazlığı yok.
 */
const PriceContext = createContext<PriceMap | null>(null);

export function PriceProvider({ prices, children }: { prices: PriceMap; children: ReactNode }) {
  return <PriceContext.Provider value={prices}>{children}</PriceContext.Provider>;
}

/** Tüm tablo — toplam hesaplayan yerler (sepet, sipariş tahtası, gönderim) için. */
export function usePrices(): PriceMap {
  const v = useContext(PriceContext);
  if (!v) throw new Error("usePrices: PriceProvider dışında çağrıldı");
  return v;
}

/** Tek ürün fiyatı. `null` = YAKINDA (sipariş edilemez). */
export function usePrice(slug: string): number | null {
  return usePrices()[slug] ?? null;
}
