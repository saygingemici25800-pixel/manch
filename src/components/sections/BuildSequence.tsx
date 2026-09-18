"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLazyGsap } from "@/lib/hooks/useLazyGsap";

/** Görsel dosyaları: /images/process/<file>.jpg */
const FRAMES = ["01-season", "02-smash", "03-sauce", "04-patty", "05-rib", "06-final"] as const;

/**
 * R15b BuildSequence (karar 2026-09-18 — R15 pinned anatomi iptal).
 *
 * Dikey akan bölüm; kareler scroll'la **çapraz geçiş** yapar (opacity + hafif scale).
 * **Pin YOK** — `scrub` yeterli; eski sitedeki pin + `scrollIntoView` tuzağı (Kural 32)
 * hiç doğmuyor.
 *
 * Kural 50: ilk kare her zaman **animasyonsuz görünür** başlar (`opacity:1` CSS'te);
 * GSAP yalnızca 2–6. kareleri kontrol eder ve bölüm fold altındaysa devreye girer.
 * Reduced motion: hiç ScrollTrigger kurulmaz — 6 kare **dikey liste** olarak,
 * her biri kendi adım metniyle görünür (içerik kaybı yok).
 */
export function BuildSequence() {
  const root = useRef<HTMLDivElement>(null);
  const t = useTranslations("Home");
  const reduced = useReducedMotion();

  const steps = t("build.steps").split("|");
  const alts = t("build.alts").split("|");

  useLazyGsap(
    (g) => {
      const el = root.current;
      if (!el || reduced) return;

      const frames = Array.from(el.querySelectorAll<HTMLElement>("[data-frame]"));
      const labels = Array.from(el.querySelectorAll<HTMLElement>("[data-label]"));
      if (frames.length < 2) return;

      // Kural 50: ilk kare + ilk etiket asla gizlenmez.
      g.gsap.set(frames.slice(1), { autoAlpha: 0, scale: 1.04 });
      g.gsap.set(labels.slice(1), { autoAlpha: 0, y: 12 });

      const tl = g.gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 70%",
          end: "bottom 30%",
          scrub: 0.6,
        },
      });

      frames.forEach((frame, i) => {
        if (i === 0) return;
        tl.to([frames[i - 1], labels[i - 1]], { autoAlpha: 0, duration: 0.4 }, i - 1)
          .to(frame, { autoAlpha: 1, scale: 1, duration: 0.4 }, i - 1)
          .to(labels[i], { autoAlpha: 1, y: 0, duration: 0.4 }, i - 1);
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        g.gsap.set([...frames, ...labels], { clearProps: "opacity,visibility,transform" });
      };
    },
    [reduced],
  );

  // Reduced motion: dikey liste — her kare kendi metniyle.
  if (reduced) {
    return (
      <div className="flex flex-col gap-[3vw] max-md:gap-[9vw]">
        {FRAMES.map((f, i) => (
          <figure key={f} className="flex flex-col gap-[0.8vw] max-md:gap-[3vw]">
            <Image
              src={`/images/process/${f}.jpg`}
              alt={alts[i] ?? ""}
              width={1090}
              height={696}
              quality={75}
              sizes="(min-width: 768px) 60vw, 92vw"
              className="w-full rounded-[1.5vw] object-cover max-md:rounded-[4vw]"
            />
            <figcaption className="flex items-baseline gap-[1vw] font-ui text-[1.2vw] uppercase text-berry max-md:text-[4vw]">
              <span className="font-pixel text-[0.9vw] text-berry max-md:text-[3vw]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {steps[i]}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={root}
      data-build-sequence=""
      className="grid grid-cols-[1fr_auto] items-center gap-[3vw] max-md:grid-cols-1 max-md:gap-[5vw]"
    >
      {/* kare yığını — hepsi üst üste, ilki görünür */}
      <div className="relative aspect-[1090/696] w-full overflow-hidden rounded-[1.5vw] bg-berry max-md:rounded-[4vw]">
        {FRAMES.map((f, i) => (
          <Image
            key={f}
            data-frame={i}
            src={`/images/process/${f}.jpg`}
            alt={alts[i] ?? ""}
            fill
            quality={75}
            sizes="(min-width: 768px) 60vw, 92vw"
            className="object-cover"
            style={i === 0 ? undefined : { opacity: 0 }}
          />
        ))}
      </div>

      {/* adım etiketleri — hepsi üst üste, ilki görünür */}
      <ol className="relative min-h-[6vw] w-[18vw] max-md:min-h-[18vw] max-md:w-full">
        {steps.map((step, i) => (
          <li
            key={step}
            data-label={i}
            className="absolute inset-x-0 top-0 flex flex-col gap-[0.4vw] max-md:gap-[1.5vw]"
            style={i === 0 ? undefined : { opacity: 0 }}
          >
            <span className="font-pixel text-[2vw] text-berry max-md:text-[6vw]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-[1.6vw] leading-tight text-berry max-md:text-[5.5vw]">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
