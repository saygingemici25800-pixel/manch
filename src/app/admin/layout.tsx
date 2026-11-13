import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { fontVariables } from "@/styles/fonts";
import "@/styles/globals.css";

/**
 * Yönetim paneli — sitenin `[locale]` ağacının DIŞINDA, kendi `<html>`'iyle.
 * Nav, preloader, imleç izi, Lenis, çerez bandı burada YOK: sahip telefondan hızlıca
 * fiyat girip sipariş açıp kapatsın, site deneyimi araya girmesin.
 *
 * Bilerek tanınan iki istisna (CLAUDE.md Kural 80):
 *   · metinler Türkçe ve bileşende — tek kullanıcı, tek dil (Kural 5 kamu yüzü içindir)
 *   · ölçüler `rem` — panel telefonda okunur olmalı, vw tabanlı görüntü dili gereksiz (Kural 8)
 */
export const metadata: Metadata = {
  title: "MANCH Panel",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={fontVariables}>
      <body className="min-h-screen bg-cream font-sans text-ink">{children}</body>
    </html>
  );
}
