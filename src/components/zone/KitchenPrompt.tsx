"use client";

import { Html } from "@react-three/drei";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { stationAnchor } from "@/lib/zone/kitchen";
import { useZoneStore } from "@/store/zone";

/**
 * Açık mutfak istasyonunun yanında asılı çağrı: istasyon adı + İNCELE.
 *
 * `FramePrompt`'un kardeşi ve aynı dili konuşur: klavyeyle erişilebilir tek yol bu (sahnedeki
 * kesitlere dokunmak işaretçi yoludur), `E` tuşu da aynı panoyu açar. Pano kapanınca odak
 * buraya döner (`kitchenReturn`). Tezgâhın karakterin durduğu yüzüne asılır (`nearFace`).
 */
export function KitchenPrompt() {
  const t = useTranslations("Zone");
  const station = useZoneStore((s) => s.nearStation);
  const face = useZoneStore((s) => s.nearFace);
  const state = useZoneStore((s) => s.state);
  const nearFrame = useZoneStore((s) => s.nearFrame);
  const openKitchen = useZoneStore((s) => s.openKitchen);
  const kitchenReturn = useZoneStore((s) => s.kitchenReturn);
  const clearKitchenReturn = useZoneStore((s) => s.clearKitchenReturn);
  const btn = useRef<HTMLButtonElement>(null);

  // Odak dönüşü — `drei/<Html>` portalı sonradan bastığı için birkaç kare denenir (FramePrompt).
  useEffect(() => {
    if (!station || state !== "zone" || kitchenReturn !== station) return;
    let raf = 0;
    let tries = 0;
    const tryFocus = () => {
      const b = btn.current;
      if (b) {
        b.focus({ preventScroll: true });
        if (document.activeElement === b) {
          clearKitchenReturn();
          return;
        }
      }
      if (++tries < 20) raf = requestAnimationFrame(tryFocus);
    };
    raf = requestAnimationFrame(tryFocus);
    return () => cancelAnimationFrame(raf);
  }, [station, state, kitchenReturn, clearKitchenReturn]);

  if (!station || state !== "zone" || nearFrame) return null;

  return (
    <Html
      position={stationAnchor(station, face)}
      center={false}
      zIndexRange={[20, 10]}
      style={{ transform: "translate(-50%, 0)", pointerEvents: "auto" }}
    >
      <div
        data-testid="kitchen-prompt"
        data-station={station}
        className="flex w-max flex-col items-center gap-[0.4vw] max-md:gap-[1.5vw]"
      >
        <span className="rounded-full border-2 border-berry bg-cream px-[1vw] py-[0.3vw] font-ui text-[1vw] uppercase tracking-[0.1em] text-berry max-md:px-[3.5vw] max-md:py-[1vw] max-md:text-[3.4vw]">
          {t(`groups.${station}`)}
        </span>
        <button
          type="button"
          ref={btn}
          data-testid="kitchen-enter"
          onClick={() => openKitchen(station)}
          className="rounded-full border-2 border-berry bg-cream px-[1.2vw] py-[0.35vw] font-ui text-[0.95vw] uppercase tracking-[0.12em] text-berry max-md:px-[4vw] max-md:py-[1.2vw] max-md:text-[3.2vw]"
        >
          {t("kitchen.inspect")}
        </button>
      </div>
    </Html>
  );
}
