"use client";

import dynamic from "next/dynamic";

/**
 * Kural 56'nın `next/dynamic` karşılığı: uçuştaki chunk isteği hızlı gezinmede iptal olur ve
 * **yakalanmamış** promise reddine (`ChunkLoadError`) dönüşür — WebKit'te 2026-09-19'da
 * `MenuOverlay`'de yakalandı (lab-check oynaklığı: 3 koşuda 1 kırmızı).
 * Ham `import()`'ları `.catch()` ile kapatmıştık ama `dynamic()`'e verilen yükleyici dışarıda
 * kalmıştı. Bu parçalar zaten isteğe bağlı UI: gelmezse sessizce hiçbir şey render edilmez.
 */
const soft = <T,>(load: () => Promise<{ default: T }>) =>
  load().catch(() => ({ default: (() => null) as T }));


// Kural 46: SSR çıktısına gerek olmayan, GSAP taşıyan layout parçaları —
// ilk yükleme JS'inden ve HTML'den çıkar.
const CursorTrail = dynamic(() => soft(() => import("@/components/motion/CursorTrail")), { ssr: false });
const MenuOverlay = dynamic(() => soft(() => import("@/components/layout/MenuOverlay")), { ssr: false });
const PageTransition = dynamic(() => soft(() => import("@/components/layout/PageTransition")), { ssr: false });
// Talep üzerine açılan / hydrate sonrası anlamlı olan UI — ilk yükleme JS'inden çıkar.
// Sepet zaten `persist` store'a bağlı (Kural 30: hydrate öncesi boş render edilir),
// CookieBanner 1.2 s gecikmeli, InfoModal kapalı başlar.
const Cart = dynamic(() => soft(() => import("@/components/layout/Cart")), { ssr: false });
const InfoModal = dynamic(() => soft(() => import("@/components/layout/InfoModal")), { ssr: false });
const CookieBanner = dynamic(() => soft(() => import("@/components/layout/CookieBanner")), { ssr: false });

export default function LayoutDeferred() {
  return (
    <>
      <CursorTrail />
      <MenuOverlay />
      <PageTransition />
      <Cart />
      <InfoModal />
      <CookieBanner />
    </>
  );
}
