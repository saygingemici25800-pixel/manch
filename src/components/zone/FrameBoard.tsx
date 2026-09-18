"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { getFrame } from "@/lib/zone/frames";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useZoneStore } from "@/store/zone";

/**
 * POV panosu (spec 6.2).
 *
 * **Tam ekran DEĞİL:** ortada çerçeve gibi duran bir kart; kenarlarda 3D sahne görünmeye
 * devam eder — kullanıcı Zone'dan çıkmadığını görsün diye. `<Canvas>` DIŞINDA, normal DOM:
 * kaydırma, odak ve klavye böyle doğru çalışır.
 *
 * İçerik panoları ayrı adımlarda geliyor (`OrderBoard` 5.5.7, `StoryBoard` 5.5.9); burası
 * onların kabuğu — başlık şeridi, kapatma ve gövde.
 *
 * Yığın sırası: sitenin sepet düğmesi (`fixed z-60`) panonun üstüne binmesin diye z-75.
 * Zone tam ekran kapısı geldiğinde (5.5.9) site kromu zaten perdenin altında kalacak.
 *
 * Odak (spec bölüm 10): açılınca odak panoya taşınır, kapanınca **tetikleyen çerçevenin**
 * GİR butonuna döner (`returnFocus`, `FramePrompt` tarafında tamamlanır).
 */
export function FrameBoard() {
  const t = useTranslations("Zone");
  const reduced = useReducedMotion();
  const state = useZoneStore((s) => s.state);
  const pov = useZoneStore((s) => s.pov);
  const closeFrame = useZoneStore((s) => s.closeFrame);
  const card = useRef<HTMLDivElement>(null);

  const open = state === "pov" && pov !== null;

  useEffect(() => {
    /**
     * `preventScroll`: kart zaten kadrajın ortasında duruyor; odak vermek tarayıcıyı sayfayı
     * kaydırmaya itiyordu (ölçüldü: `scrollY` 0 → 123, kartın üstü kadrajın 32 px dışına
     * çıkıyor ve künye satırı kesiliyordu). Kaydırmaya ihtiyaç yok.
     */
    if (open) card.current?.focus({ preventScroll: true });
  }, [open, pov]);

  if (!open) return null;
  const frame = getFrame(pov);
  if (!frame) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-75 grid place-items-center p-[2vw] max-md:p-[4vw]">
      <div
        ref={card}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(`frames.${frame.id}`)}
        data-testid="frame-board"
        data-frame={frame.id}
        style={
          reduced
            ? undefined
            : { animation: "zone-board-in .45s cubic-bezier(.4,1.4,.7,.95) both" }
        }
        className="pointer-events-auto flex w-[min(92vw,720px)] max-h-[min(86vh,900px)] flex-col overflow-y-auto border-[14px] border-ink bg-cream shadow-[0_40px_90px_rgba(27,27,27,0.45)] outline outline-[6px] outline-ink/25"
      >
        {/* sticky üst şerit — kart kaydırılsa da başlık ve çıkış görünür kalır */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-[2vw] bg-berry px-[1.4vw] py-[0.9vw] max-md:px-[4vw] max-md:py-[3vw]">
          <div className="min-w-0">
            <p className="font-pixel text-[0.6vw] uppercase tracking-[0.2em] text-cream max-md:text-[2.2vw]">
              {t(`kickers.${frame.id}`)}
            </p>
            <h2 className="truncate font-display text-[2vw] leading-[1.1] text-cream max-md:text-[6vw]">
              {t(`frames.${frame.id}`)}
            </h2>
          </div>
          <button
            type="button"
            data-testid="frame-board-back"
            onClick={closeFrame}
            className="shrink-0 rounded-full border-2 border-berry-dk bg-mustard px-[1.1vw] py-[0.4vw] font-ui text-[0.95vw] uppercase tracking-[0.12em] text-berry-dk max-md:px-[4vw] max-md:py-[1.4vw] max-md:text-[3.2vw]"
          >
            {t("back")}
          </button>
        </div>

        <div className="p-[1.4vw] max-md:p-[4vw]">
          <div className="relative aspect-[4/3] w-full overflow-hidden border-2 border-ink/20 bg-paper">
            <Image
              src={frame.art}
              alt={t(`frames.${frame.id}`)}
              fill
              sizes="(max-width: 768px) 92vw, 720px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
