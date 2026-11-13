"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Pano kendini tazeler — yeni sipariş sahip sayfayı yenilemeden görünsün. Sekme arka
 * plandayken istek atılmaz (telefonda pil/veri harcamasın).
 */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
