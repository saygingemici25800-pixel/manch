"use client";

import dynamic from "next/dynamic";

// Kural 46: SSR çıktısına gerek olmayan, GSAP taşıyan layout parçaları —
// ilk yükleme JS'inden ve HTML'den çıkar.
const CursorTrail = dynamic(() => import("@/components/motion/CursorTrail"), { ssr: false });
const MenuOverlay = dynamic(() => import("@/components/layout/MenuOverlay"), { ssr: false });
const PageTransition = dynamic(() => import("@/components/layout/PageTransition"), { ssr: false });

export default function LayoutDeferred() {
  return (
    <>
      <CursorTrail />
      <MenuOverlay />
      <PageTransition />
    </>
  );
}
