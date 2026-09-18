"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useZoneStore, type Character } from "@/store/zone";

/**
 * spec bölüm 1: Three.js SSR'da patlar — sahne **asla** sunucuda render edilmez.
 * `next/dynamic` + `{ ssr: false }` aynı zamanda three'yi ayrı chunk'a alır;
 * `scripts/zone-bundle-check.mjs` bunu her adımda doğrular.
 */
const ZoneCanvas = dynamic(
  () => import("@/components/zone/ZoneCanvas").then((m) => m.ZoneCanvas),
  { ssr: false, loading: () => <div className="h-full w-full bg-cream" /> },
);

interface Readout {
  nearFrame: string | null;
  char: { x: number; z: number; ang: number };
  cam: { ang: number; x: number | null; z: number | null };
  view: string;
  mirrored: boolean;
  spriteSource: string;
  input: { ix: number; iz: number; len: number };
}

const deg = (rad: number) => `${Math.round((rad * 180) / Math.PI)}°`;

export function ZoneStage() {
  /**
   * Aç/kapa düğmesi — sahnenin gerçek mount/unmount döngüsünü test eder (spec bölüm 9).
   * Sayfa navigasyonu ile ölçmek YANILTICI: tam yükleme modül sayaçlarını sıfırlar,
   * sızıntı olsa bile test geçer (2026-09-18'de bu hataya düşüldü, Kural 62).
   */
  const [mounted, setMounted] = useState(true);
  const character = useZoneStore((s) => s.character);
  const zoneState = useZoneStore((s) => s.state);
  const select = useZoneStore((s) => s.select);
  const ready = useZoneStore((s) => s.ready);
  const closeFrame = useZoneStore((s) => s.closeFrame);

  /**
   * Lab'da `ZoneGate` yok (5.5.8'de gelecek), ama sahne gerçek durum makinesine göre
   * davranıyor: `FramePrompt` yalnızca `state === "zone"` iken görünür. Kapıyı taklit
   * etmek yerine store'u gezilebilir duruma alıyoruz — böylece lab, üründeki akışın
   * aynısını gösterir.
   */
  useEffect(() => {
    const s = useZoneStore.getState();
    if (s.state === "closed") {
      if (!s.character) s.select("misu");
      s.ready();
    }
  }, []);

  // 5.5.10'a kadar karakter seçimi yok — lab'da elle seçilir.
  const pick = (who: Character) => {
    select(who);
    ready();
  };

  /** Kamera/karakter açılarını gözle izlemek için: 5 Hz yeter, render yükü yaratmaz. */
  const [readout, setReadout] = useState<Readout | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      const read = (window as unknown as { __ZONE_STATS__?: () => Readout }).__ZONE_STATS__;
      setReadout(read ? read() : null);
    }, 200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {mounted ? <ZoneCanvas className="h-full w-full" /> : <div className="h-full w-full bg-paper" />}

      {/* Nav (z-80) tıklamayı yakalamasın diye z-90 ve nav'dan uzak köşe — Kural 63 ④ */}
      <div className="absolute bottom-[2vw] left-[2vw] z-90 flex flex-col gap-[0.6vw] max-md:bottom-[5vw] max-md:left-[5vw] max-md:gap-[2vw]">
        {readout && (
          <div
            data-testid="zone-readout"
            className="rounded-[0.6vw] border-2 border-berry bg-cream/90 px-[0.8vw] py-[0.5vw] font-pixel text-[0.6vw] leading-[1.9] text-berry max-md:rounded-[2vw] max-md:px-[3vw] max-md:py-[2vw] max-md:text-[2.2vw]"
          >
            <div>kamera {deg(readout.cam.ang)} · karakter {deg(readout.char.ang)}</div>
            <div>
              sprite {readout.view}
              {readout.mirrored ? " (aynalı)" : ""} · {readout.spriteSource}
            </div>
            <div>
              konum x {readout.char.x.toFixed(1)} z {readout.char.z.toFixed(1)}
            </div>
            <div>
              durum {zoneState} · yakın {readout.nearFrame ?? "—"}
            </div>
          </div>
        )}

        <div className="flex gap-[0.6vw] max-md:gap-[2vw]">
          {(["misu", "miyu"] as const).map((who) => (
            <button
              key={who}
              type="button"
              data-testid={`zone-pick-${who}`}
              data-active={character === who}
              onClick={() => pick(who)}
              className={`rounded-full border-2 border-berry px-[1.2vw] py-[0.5vw] font-ui text-[0.9vw] uppercase tracking-[0.1em] max-md:px-[4vw] max-md:py-[2vw] max-md:text-[3vw] ${
                character === who ? "bg-berry text-cream" : "bg-cream text-berry"
              }`}
            >
              {who}
            </button>
          ))}
          {zoneState === "pov" && (
            <button
              type="button"
              data-testid="zone-close-frame"
              onClick={closeFrame}
              className="rounded-full border-2 border-berry-dk bg-mustard px-[1.2vw] py-[0.5vw] font-ui text-[0.9vw] uppercase tracking-[0.1em] text-berry-dk max-md:px-[4vw] max-md:py-[2vw] max-md:text-[3vw]"
            >
              ← GERİ (POV)
            </button>
          )}
          <button
            type="button"
            data-testid="zone-toggle"
            data-mounted={mounted}
            onClick={() => setMounted((v) => !v)}
            className="rounded-full border-2 border-berry bg-cream px-[1.2vw] py-[0.5vw] font-ui text-[0.9vw] uppercase tracking-[0.1em] text-berry max-md:px-[4vw] max-md:py-[2vw] max-md:text-[3vw]"
          >
            {mounted ? "SAHNEYİ KAPAT" : "SAHNEYİ AÇ"}
          </button>
        </div>
      </div>
    </>
  );
}
