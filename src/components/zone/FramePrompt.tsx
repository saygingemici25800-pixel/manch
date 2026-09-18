"use client";

import { Html } from "@react-three/drei";
import { useTranslations } from "next-intl";

import { getFrame, promptAnchor } from "@/lib/zone/frames";
import { useZoneStore } from "@/store/zone";

/**
 * Tablonun önünde asılı çağrı (spec 5.2): başlık + GİR butonu.
 *
 * Yükseklik `PROMPT_HEIGHT` (1.35) — ilk tasarımda 4.15'teydi, tavana yakın ve bakışın
 * dışındaydı. Yatayda `promptAnchor`: duvardan 0.9 birim önde, böylece karakter duvara
 * dayandığında bile prompt kamera ile tablonun arasına girmez.
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
  const anchor = promptAnchor(frame);

  return (
    <Html
      position={anchor}
      center={false}
      // Tabloya arkası dönükken de okunur kalsın diye sahneye gömülmez.
      zIndexRange={[20, 10]}
      /**
       * `translate(-50%, 0)` — kutu çapadan AŞAĞI sarkar.
       *
       * Spec 5.2 `-100%` diyordu (yukarı doğru). Çapa 0.9 birim öne alındıktan sonra bile,
       * karakter duvara dayalıyken tablonun alt kenarının altında ekranda yalnızca ~35 px
       * boşluk kalıyor; kutu ~58 px olduğu için yukarı doğru büyüyünce görselin üstüne
       * biniyordu (masaüstü 22.6 px, portre 36.4 px — ölçüldü). Aşağı sarkınca çapa
       * yüksekliği (1.35) ve dünya konumu AYNEN korunur, kutu tablonun altında kalır ve
       * zemin halkasıyla dikey hizası daha da netleşir.
       */
      style={{ transform: "translate(-50%, 0)", pointerEvents: "auto" }}
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
