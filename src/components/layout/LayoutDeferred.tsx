"use client";

import dynamic from "next/dynamic";

// Kural 46: SSR çıktısına gerek olmayan, GSAP taşıyan layout parçaları —
// ilk yükleme JS'inden ve HTML'den çıkar.
const CursorTrail = dynamic(() => import("@/components/motion/CursorTrail"), { ssr: false });
const MenuOverlay = dynamic(() => import("@/components/layout/MenuOverlay"), { ssr: false });
const PageTransition = dynamic(() => import("@/components/layout/PageTransition"), { ssr: false });
// Talep üzerine açılan / hydrate sonrası anlamlı olan UI — ilk yükleme JS'inden çıkar.
// Sepet zaten `persist` store'a bağlı (Kural 30: hydrate öncesi boş render edilir),
// CookieBanner 1.2 s gecikmeli, InfoModal kapalı başlar.
const Cart = dynamic(() => import("@/components/layout/Cart"), { ssr: false });
const InfoModal = dynamic(() => import("@/components/layout/InfoModal"), { ssr: false });
const CookieBanner = dynamic(() => import("@/components/layout/CookieBanner"), { ssr: false });

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
