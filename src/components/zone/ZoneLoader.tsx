"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useZoneStore } from "@/store/zone";

/**
 * Yükleme ekranı: % sayacı + dönen mesajlar.
 *
 * Yüzde **sahte bir animasyon değil**: sahne hazır olduğunda (`ZoneCanvas` ilk kareyi
 * kurunca) 100'e gider ve ekran kalkar. Arada %92'ye kadar yumuşak ilerler — indirme
 * süresi cihaza göre değişiyor, kullanıcıya donmuş bir ekran göstermemek için.
 */
export function ZoneLoader() {
  const t = useTranslations("Zone");
  const progress = useZoneStore((s) => s.progress);
  const setProgress = useZoneStore((s) => s.setProgress);
  const lines = t("loader.lines").split("|");
  const [line, setLine] = useState(0);

  useEffect(() => {
    const tick = window.setInterval(() => {
      const p = useZoneStore.getState().progress;
      if (p < 92) setProgress(p + Math.max(1, Math.round((92 - p) / 12)));
    }, 120);
    const rotate = window.setInterval(() => setLine((i) => i + 1), 900);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(rotate);
    };
  }, [setProgress]);

  return (
    <div data-testid="zone-loader" className="flex w-[min(70vw,520px)] flex-col items-center gap-[1vw] max-md:gap-[4vw]">
      <p aria-live="polite" className="text-center font-display text-[2vw] leading-[1.15] text-cream max-md:text-[6vw]">
        {lines[line % lines.length]}
      </p>
      <div className="h-[0.5vw] w-full overflow-hidden rounded-full bg-cream/25 max-md:h-[2vw]">
        <i
          data-testid="zone-progress"
          data-value={progress}
          style={{ width: `${progress}%` }}
          className="block h-full rounded-full bg-mustard transition-[width] duration-200"
        />
      </div>
      <span className="font-pixel text-[0.8vw] text-mustard max-md:text-[3vw]">{progress}%</span>
    </div>
  );
}
