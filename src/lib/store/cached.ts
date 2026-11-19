import "server-only";

import { unstable_cache } from "next/cache";

/**
 * Depo okuması için `unstable_cache` — **yalnız production'da**. Development'ta okuma
 * doğrudan depoya gider (Kural 83).
 *
 * NEDEN (2026-11-19): dev deposu `.data/admin-store.json`, yani AYNI dosyayı paylaşan
 * birden çok süreç var (dev sunucusu + `admin-check`'in yerel prod sunucusu, bekçinin
 * `depoSifirla()` ile dosyayı silmesi). Bir süreçteki `revalidateTag` yalnız O sürecin
 * bellekteki etiket listesine yazılır; dev'in `.next/dev/cache/fetch-cache` girdisi ise
 * DİSKTE ve bir yıl geçerli. Dosya başka süreçten değişince dev girdisi sonsuza dek bayat
 * kalıyor, yeniden başlatma da kurtarmıyordu (etiket listesi bellekte, girdi diskte).
 *
 * İkinci etken: `unstable_cache` anahtarı `cb.toString()` içerir ve Turbopack içe
 * aktarılan adı katmana göre yazar (`[app-rsc]` / `[app-route]`) → layout ile
 * `/api/order-status` AYRI girdi okur. Biri bayat kalınca sayfanın fiyat imzası
 * sunucununkinden ayrışıyor, sepet "fiyatlar güncellendi" deyip gönderi kapatıyordu.
 *
 * Production'da (Vercel, Neon) tek yazıcı paneldir ve etiket geçersizleme kalıcıdır; iki
 * girdi aynı etiketle birlikte düşer. Önbellek orada kalır (kota + statik sayfa, Kural 80).
 */
export function cachedStoreRead<T>(
  read: () => Promise<T>,
  keyParts: string[],
  options: { tags: string[]; revalidate?: number | false },
): () => Promise<T> {
  if (process.env.NODE_ENV !== "production") return read;
  return unstable_cache(read, keyParts, options);
}
