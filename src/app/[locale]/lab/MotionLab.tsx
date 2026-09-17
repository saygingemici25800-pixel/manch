"use client";

import { useEffect, useState } from "react";

import { BlobButton } from "@/components/motion/BlobButton";
import { CursorTrail } from "@/components/motion/CursorTrail";
import { JellyWave } from "@/components/motion/JellyWave";
import { Juggle } from "@/components/motion/Juggle";
import { Marquee } from "@/components/motion/Marquee";
import { RollText } from "@/components/motion/RollText";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { useFinePointer } from "@/lib/hooks/useFinePointer";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useMotionStore } from "@/lib/motion-store";

const LOREM =
  "Smash sesi mutfaktan, ilk ısırık masadan. Aç değiliz, sadece takıntılıyız. Hazır soslara biraz uzağız.";

/** Reduced motion'da her primitive ne yapıyor — gözle doğrulanabilir tablo. */
const REDUCED_TABLE: { name: string; behaviour: string; kind: "kapanır" | "sadeleşir" }[] = [
  { name: "SmoothScroll (R19)", behaviour: "lerp 1 → anlık scroll, yumuşatma yok", kind: "sadeleşir" },
  { name: "SplitReveal", behaviour: "split hiç kurulmaz, metin düz ve görünür", kind: "kapanır" },
  { name: "RollText (R6)", behaviour: "tek kopya render, kaydırma yok", kind: "kapanır" },
  { name: "BlobButton (R7)", behaviour: "wobble + scale yok; dolgu rengi hover'da yine değişir", kind: "sadeleşir" },
  { name: "Marquee (R14)", behaviour: "kayma durur, metin sabit durur", kind: "kapanır" },
  { name: "JellyWave (R9)", behaviour: "esneme yok, dalga şekli statik", kind: "sadeleşir" },
  { name: "Juggle (R18)", behaviour: "zıplama yok, ikonlar dizili", kind: "kapanır" },
  { name: "CursorTrail (R8)", behaviour: "hiç render edilmez (null)", kind: "kapanır" },
];

function Box({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <div data-demo id={id} className="border border-berry/20 p-[1vw] max-md:p-[3vw]">
      <p className="font-ui text-[1vw] uppercase tracking-[0.12em] text-berry max-md:text-[3.2vw]">{title}</p>
      {note ? (
        <p className="mb-[0.6vw] font-ui text-[0.85vw] text-ink max-md:mb-[2vw] max-md:text-[2.8vw]">{note}</p>
      ) : null}
      {children}
    </div>
  );
}

/** Canlı sayaçlar — sızıntı kontrolü (ScrollTrigger + aktif tween). */
function Counters() {
  const [v, setV] = useState({ st: -1, tw: -1, tick: -1 });

  useEffect(() => {
    const read = () => {
      const w = window as Window & {
        __ST_COUNT?: () => number;
        __TWEEN_COUNT?: () => number;
        __TICK?: () => number;
      };
      setV({ st: w.__ST_COUNT?.() ?? -1, tw: w.__TWEEN_COUNT?.() ?? -1, tick: w.__TICK?.() ?? -1 });
    };
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p data-testid="counters" className="font-ui text-[1vw] text-berry-dk max-md:text-[3.2vw]">
      ScrollTrigger: <b data-st>{v.st}</b> · aktif tween: <b data-tw>{v.tw}</b> · ticker frame:{" "}
      <b>{v.tick}</b>
    </p>
  );
}

export function MotionLab() {
  const reduced = useReducedMotion();
  const forced = useMotionStore((s) => s.forceReduced);
  const setForced = useMotionStore((s) => s.setForceReduced);
  const fine = useFinePointer();

  return (
    <div className="flex flex-col gap-[1.2vw] max-md:gap-[4vw]">
      <CursorTrail />

      {/* ---- kontrol paneli ---- */}
      <div className="flex flex-wrap items-center gap-[0.8vw] border border-berry p-[1vw] max-md:gap-[2vw] max-md:p-[3vw]">
        <span className="font-ui text-[1vw] uppercase text-berry max-md:text-[3.2vw]">
          reduced-motion: <b data-testid="reduced-state">{reduced ? "AÇIK" : "KAPALI"}</b>{" "}
          ({forced === null ? "sistem" : "override"})
        </span>
        {([
          ["Sistem", null],
          ["Zorla AÇIK", true],
          ["Zorla KAPALI", false],
        ] as const).map(([label, value]) => (
          <button
            key={label}
            type="button"
            data-cursor-hide
            onClick={() => setForced(value)}
            className={`border border-berry px-[0.8vw] py-[0.3vw] font-ui text-[0.9vw] uppercase max-md:px-[3vw] max-md:py-[1.5vw] max-md:text-[3vw] ${
              forced === value ? "bg-berry text-cream" : "text-berry"
            }`}
          >
            {label}
          </button>
        ))}
        <Counters />
      </div>

      {/* ---- 1 SmoothScroll ---- */}
      <Box id="d-smoothscroll" title="1 · R19 SmoothScroll" note="Lenis root + GSAP ticker (Kural 24). Sayfayı kaydır: ticker frame artmalı, scroll yumuşak olmalı.">
        <p className="font-ui text-[1vw] text-ink max-md:text-[3.2vw]">
          html sınıfı: <code data-testid="lenis-class">lenis lenis-smooth</code> bekleniyor
        </p>
      </Box>

      {/* ---- 2 RollText ---- */}
      <Box id="d-rolltext" title="2 · R6 RollText" note="Üzerine gel: üstteki kopya yukarı, alttaki alttan gelir (300 ms). İkinci kopya aria-hidden (Kural 9).">
        <span className="font-display text-[2.4vw] text-berry max-md:text-[7vw]">
          <RollText>SİPARİŞ VER</RollText>
        </span>
      </Box>

      {/* ---- 3 BlobButton ---- */}
      <Box id="d-blob" title="3 · R7 BlobButton" note="Organik SVG blob, beyaz stroke. Hover: wobble + scale 1.05. data-cursor-hide işaretli (Kural 27).">
        <BlobButton className="h-[6vw] w-[14vw] max-md:h-[18vw] max-md:w-[46vw]">
          <RollText>ORDER NOW</RollText>
        </BlobButton>
      </Box>

      {/* ---- 4 SplitReveal chars ---- */}
      <Box id="d-split-chars" title="4 · SplitReveal — chars" note="Fold ÜSTÜNDE: animasyonsuz görünür başlar (Kural 50).">
        <SplitReveal as="h3" type="chars" className="font-display text-[3vw] text-berry max-md:text-[8vw]">
          HANDMADE HITS
        </SplitReveal>
      </Box>

      {/* ---- 5 SplitReveal lines ---- */}
      <Box id="d-split-lines" title="5 · SplitReveal — lines" note="Aynı kural: fold üstünde dokunulmaz.">
        <SplitReveal as="p" type="lines" className="font-ui text-[1.4vw] text-ink max-md:text-[4vw]">
          {LOREM}
        </SplitReveal>
      </Box>

      {/* ---- 6 Marquee ---- */}
      <Box id="d-marquee" title="6 · R14 Marquee" note="İki bant zıt yönde, -4°/+4° eğik, pixel font. Scroll hızlandıkça timeScale artar.">
        <div className="flex flex-col gap-[3vw] py-[2.5vw] max-md:gap-[9vw] max-md:py-[7vw]">
          <Marquee items={["CRISPY CHICKEN TENDERS", "HANDMADE HITS DIFFERENT"]} direction={1} />
          <Marquee items={["UNITED CHILL BURGER ZONE", "JUICY CENTER", "CRISPY EDGES"]} direction={-1} tilt={4} />
        </div>
      </Box>

      {/* ---- 7 JellyWave ---- */}
      <Box id="d-jellywave" title="7 · R9 JellyWave" note="Scroll hızına göre scaleY 1 → 1.08 esner, transform-origin alt kenar.">
        <div className="bg-berry pt-[3vw] max-md:pt-[8vw]">
          <JellyWave fillClass="fill-cream" />
        </div>
      </Box>

      {/* ---- 8 Juggle ---- */}
      <Box id="d-juggle" title="8 · R18 Juggle" note="Malzeme ikonları sırayla zıplar (stagger döngüsel).">
        <Juggle className="text-berry" />
      </Box>

      {/* ---- 9 CursorTrail ---- */}
      <Box id="d-cursor" title="9 · R8 CursorTrail" note="Sadece masaüstü (hover + fine pointer) ve reduced-motion kapalıyken.">
        <p className="font-ui text-[1vw] text-ink max-md:text-[3.2vw]">
          fine pointer: <b data-testid="fine-pointer">{fine ? "evet" : "hayır"}</b> · aktif:{" "}
          <b data-testid="cursor-active">{fine && !reduced ? "evet" : "hayır"}</b> — aşağıdaki
          kutunun üstünde iz gizlenmeli:
        </p>
        <div
          data-cursor-hide
          className="mt-[0.6vw] grid h-[5vw] place-items-center bg-berry font-ui text-cream max-md:mt-[2vw] max-md:h-[16vw]"
        >
          data-cursor-hide
        </div>
      </Box>

      {/* ---- 10 reduced-motion tablosu ---- */}
      <Box id="d-reduced" title="10 · prefers-reduced-motion davranışı" note="Yukarıdaki düğmeyle değiştir, aşağıdaki demoları gözle karşılaştır.">
        <ul className="flex flex-col gap-[0.3vw] max-md:gap-[1.5vw]">
          {REDUCED_TABLE.map((r) => (
            <li key={r.name} className="font-ui text-[1vw] text-ink max-md:text-[3.2vw]">
              <b className="text-berry">{r.name}</b> — {r.behaviour}{" "}
              <span className={r.kind === "kapanır" ? "text-berry-dk" : "text-berry"}>[{r.kind}]</span>
            </li>
          ))}
        </ul>
      </Box>

      {/* ---- 11 fold testi (Kural 50) ---- */}
      <Box
        id="d-fold"
        title="11 · Kural 50 — fold testi"
        note="Aşağıdaki boşluk sayfayı fold altına iter. Fold ALTINDAKİ SplitReveal scroll ile animasyonla gelir; sayfa açılışında fold ÜSTÜNDE olan 4 ve 5 numaralı demolar hiç gizlenmez."
      >
        <div className="h-[110vh] border-y border-dashed border-berry/40 p-[1vw]">
          <p className="font-ui text-[1vw] text-ink max-md:text-[3.2vw]">
            ↓ bu boşluğun altındaki metin fold altında
          </p>
        </div>
        <SplitReveal
          as="h3"
          type="lines"
          className="font-display text-[2.4vw] text-berry max-md:text-[7vw]"
        >
          FOLD ALTINDA — BU ANİMASYONLA GELİR
        </SplitReveal>
      </Box>
    </div>
  );
}
