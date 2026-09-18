"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

/**
 * spec bölüm 1: Three.js SSR'da patlar — sahne **asla** sunucuda render edilmez.
 * `next/dynamic` + `{ ssr: false }` aynı zamanda three'yi ayrı chunk'a alır;
 * `scripts/zone-bundle-check.mjs` bunu her adımda doğrular.
 */
const ZoneCanvas = dynamic(
  () => import("@/components/zone/ZoneCanvas").then((m) => m.ZoneCanvas),
  { ssr: false, loading: () => <div className="h-full w-full bg-cream" /> },
);

export function ZoneStage() {
  /**
   * Aç/kapa düğmesi — sahnenin gerçek mount/unmount döngüsünü test eder (spec bölüm 9).
   * Sayfa navigasyonu ile ölçmek YANILTICI: tam yükleme modül sayaçlarını sıfırlar,
   * sızıntı olsa bile test geçer (2026-09-18'de bu hataya düşüldü).
   * Zone zaten ana sayfada açılıp kapanacak, navigasyonla değil.
   */
  const [mounted, setMounted] = useState(true);

  return (
    <>
      {mounted ? <ZoneCanvas className="h-full w-full" /> : <div className="h-full w-full bg-paper" />}
      <button
        type="button"
        data-testid="zone-toggle"
        data-mounted={mounted}
        onClick={() => setMounted((v) => !v)}
        className="absolute bottom-[2vw] left-[2vw] z-90 rounded-full border-2 border-berry bg-cream px-[1.2vw] py-[0.5vw] font-ui text-[0.9vw] uppercase tracking-[0.1em] text-berry max-md:bottom-[5vw] max-md:left-[5vw] max-md:px-[4vw] max-md:py-[2vw] max-md:text-[3vw]"
      >
        {mounted ? "SAHNEYİ KAPAT" : "SAHNEYİ AÇ"}
      </button>
    </>
  );
}
