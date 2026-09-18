"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";

import { CharacterSelect } from "@/components/zone/CharacterSelect";
import { ZoneLoader } from "@/components/zone/ZoneLoader";
import { useDialog } from "@/lib/hooks/useDialog";
import { useZoneStore } from "@/store/zone";

/**
 * "ZONE'A GİR" kapısı ve tam ekran perde.
 *
 * **three.js ana sayfaya SIZMAZ:** sahne `next/dynamic` + `{ ssr:false }` ile ve yalnızca
 * perde açıldığında yüklenir. `zone-bundle-check` bunun bekçisi (Kural 61).
 *
 * Perde `fixed inset-0 z-100`: nav (z-80), sepet düğmesi (z-60) ve çerez bandının **üstünde**.
 * Joystick'in sepet düğmesinin altında kalması (5.5.7) tam olarak bu perdenin yokluğundandı.
 *
 * `useDialog`: Esc, Tab focus trap, `<html>` overflow kilidi ve Lenis durdurma — sitenin
 * diğer modalleriyle aynı davranış, ikinci bir gerçekleme yok.
 */
const ZoneCanvas = dynamic(() => import("@/components/zone/ZoneCanvas").then((m) => m.ZoneCanvas), {
  ssr: false,
  loading: () => null,
});

export function ZoneGate() {
  const t = useTranslations("Zone");
  const state = useZoneStore((s) => s.state);
  const enter = useZoneStore((s) => s.enter);
  const exit = useZoneStore((s) => s.exit);
  const ready = useZoneStore((s) => s.ready);
  const curtain = useRef<HTMLDivElement>(null);

  const open = state !== "closed";
  /** Esc: POV'dayken panoyu kapatmak `useZoneControls`'un işi; burada Zone'dan çıkılır. */
  const close = useCallback(() => {
    if (useZoneStore.getState().state === "pov") return;
    exit();
  }, [exit]);
  useDialog(open, close, curtain);

  return (
    <>
      <button
        type="button"
        data-cursor-hide
        data-testid="zone-gate"
        onClick={enter}
        className="rounded-full border-2 border-berry-dk bg-mustard px-[1.8vw] py-[0.7vw] font-ui text-[1.1vw] uppercase tracking-[0.12em] text-berry-dk transition-transform duration-300 hover:scale-105 max-md:px-[6vw] max-md:py-[2.6vw] max-md:text-[4vw]"
      >
        {t("gate")}
      </button>

      {open && (
        <div
          ref={curtain}
          data-testid="zone-curtain"
          data-state={state}
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
          className="fixed inset-0 z-100 grid place-items-center overflow-hidden bg-berry-dk"
        >
          {/* Sahne yalnızca karakter seçildikten sonra kurulur; yükleme ekranı üstünde durur. */}
          {(state === "loading" || state === "zone" || state === "pov") && (
            <ZoneCanvas className="absolute inset-0 h-full w-full" onReady={ready} />
          )}

          {state === "select" && <CharacterSelect />}
          {state === "loading" && <ZoneLoader />}

          <button
            type="button"
            data-cursor-hide
            data-testid="zone-exit"
            onClick={exit}
            className="absolute right-[1.5vw] top-[1.5vw] z-90 rounded-full border-2 border-cream bg-transparent px-[1.2vw] py-[0.45vw] font-ui text-[0.9vw] uppercase tracking-[0.12em] text-cream transition-colors duration-300 hover:bg-cream hover:text-berry-dk max-md:right-[5vw] max-md:top-[5vw] max-md:px-[4vw] max-md:py-[1.6vw] max-md:text-[3.2vw]"
          >
            {t("exit")}
          </button>
        </div>
      )}
    </>
  );
}
