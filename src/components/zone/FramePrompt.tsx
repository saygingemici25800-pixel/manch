"use client";

import { Html } from "@react-three/drei";
import { useTranslations } from "next-intl";

import { frameStop, getFrame, PROMPT_HEIGHT } from "@/lib/zone/frames";
import { useZoneStore } from "@/store/zone";

/**
 * Halkanın üstünde beliren çağrı (spec 5.2): başlık + GİR butonu.
 *
 * Konum `frameStop` + `PROMPT_HEIGHT` (1.35). İlk tasarımda 4.15'teydi — tavana yakın,
 * bakışın dışında kalıyordu. 1.35'te başlık, buton ve zemin halkası **tek bir çağrı**
 * olarak okunuyor.
 *
 * `drei/<Html>` ile normal DOM: TR karakter sorunu yok, klavyeyle erişilebilir (spec bölüm 1).
 */
export function FramePrompt() {
  const t = useTranslations("Zone");
  const nearFrame = useZoneStore((s) => s.nearFrame);
  const state = useZoneStore((s) => s.state);
  const openFrame = useZoneStore((s) => s.openFrame);

  // POV'da gizlenir (spec bölüm 6): pano açıkken çağrı anlamsız.
  if (!nearFrame || state !== "zone") return null;
  const frame = getFrame(nearFrame);
  if (!frame) return null;
  const [x, , z] = frameStop(frame);

  return (
    <Html
      position={[x, PROMPT_HEIGHT, z]}
      center={false}
      // Tabloya arkası dönükken de okunur kalsın diye sahneye gömülmez.
      zIndexRange={[20, 10]}
      style={{ transform: "translate(-50%, -100%)", pointerEvents: "auto" }}
    >
      <div
        data-testid="frame-prompt"
        data-frame={frame.id}
        className="flex w-max flex-col items-center gap-[0.4vw] max-md:gap-[1.5vw]"
      >
        <span className="rounded-full border-2 border-berry bg-cream px-[1vw] py-[0.3vw] font-ui text-[1vw] uppercase tracking-[0.1em] text-berry max-md:px-[3.5vw] max-md:py-[1vw] max-md:text-[3.4vw]">
          {t(`frames.${frame.id}`)}
        </span>
        <button
          type="button"
          data-testid="frame-enter"
          onClick={() => openFrame(frame.id)}
          className="rounded-full border-2 border-berry-dk bg-mustard px-[1.2vw] py-[0.35vw] font-ui text-[0.95vw] uppercase tracking-[0.12em] text-berry-dk max-md:px-[4vw] max-md:py-[1.2vw] max-md:text-[3.2vw]"
        >
          {t("enter")}
        </button>
      </div>
    </Html>
  );
}
