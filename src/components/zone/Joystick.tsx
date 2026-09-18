"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { setJoystick } from "@/lib/zone/runtime";
import { useZoneStore } from "@/store/zone";

/**
 * Sürüklenen yön kontrolü (spec 7.1).
 *
 * **`pointer:coarse` koşulu YOK** — masaüstünde de görünür ve fareyle sürüklenir. Zone'un
 * gezilebilir olduğu ancak görünür bir kontrol varsa anlaşılıyor; yalnız dokunmatikte
 * göstermek kontrolü görünmez kılıyordu.
 *
 * Çıktı **dünyaya göredir** (spec 7.4) ve klavyeyle **birebir aynı vektörü** besler:
 * `readInput()` klavye ile joystick'i toplar. Aşağı çekmek `S`/`ArrowDown` ile aynı şeydir —
 * karakter arkasını döner, kamera 180° döner.
 *
 * **Yığın sırası:** sitenin sepet düğmesi `fixed z-60` ve tam olarak aynı köşede duruyor;
 * joystick `z-40` iken onun ALTINDA kalıyor, topuz ve "SÜRÜKLE" etiketi görünmüyordu
 * (Kural 59 gözle bakmada yakalandı). Zone açıkken Zone'un kendi kontrolü öne geçer.
 *
 * Erişilebilirlik: `aria-hidden`. Klavye zaten WASD/ok tuşlarıyla global olarak çalışıyor;
 * ekran okuyucuya **ikinci bir kontrol** sunmak yalnızca kafa karıştırır (karar 2026-09-18,
 * kullanıcı — spec 7.1'deki `role="application"` + `tabindex` önerisinin yerine geçer).
 * Odaklanabilir olmadığı için `aria-hidden` burada güvenli.
 */

const BASE = 112;
const KNOB = 50;
/** Topuz merkezden en fazla bu kadar uzaklaşır (spec 7.1: yarıçap − 18). */
const MAX = BASE / 2 - 18;

export function Joystick() {
  const t = useTranslations("Zone");
  const reduced = useReducedMotion();
  /** POV'da ve pano açıkken gizlenir (spec 7.1). */
  const visible = useZoneStore((s) => s.state === "zone");
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const pad = base.current;
    if (!visible || !pad) return;
    let active = false;

    const place = (e: MouseEvent | TouchEvent) => {
      const k = knob.current;
      if (!k) return;
      const r = pad.getBoundingClientRect();
      const pt = "touches" in e ? e.touches[0] : e;
      if (!pt) return;
      const dx = pt.clientX - (r.left + r.width / 2);
      const dy = pt.clientY - (r.top + r.height / 2);
      // Topuz tabanın içinde kalır; imleç dışarı çıkabilir, vektör doygunluğa ulaşır.
      const d = Math.min(Math.hypot(dx, dy), MAX) || 0;
      const a = Math.atan2(dy, dx);
      const nx = Math.cos(a) * d;
      const ny = Math.sin(a) * d;
      k.style.transform = `translate(${nx}px, ${ny}px)`;
      setJoystick(nx / MAX, ny / MAX);
    };

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      active = true;
      setDragging(true);
      place(e);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!active) return;
      e.preventDefault();
      place(e);
    };
    const end = () => {
      if (!active) return;
      active = false;
      setDragging(false);
      setJoystick(0, 0);
      if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
    };

    pad.addEventListener("mousedown", start);
    pad.addEventListener("touchstart", start, { passive: false });
    /**
     * Hareket ve bırakma **`window`'a** bağlanır, tabana DEĞİL. Tabana bağlanınca imleç
     * pedin dışına çıktığı anda sürükleme ölüyor (prototipte kanıtlandı). `blur` da bırakır:
     * sekme değişince topuz basılı kalmasın.
     */
    window.addEventListener("mousemove", move, { passive: false });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("mouseup", end);
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    window.addEventListener("blur", end);

    return () => {
      pad.removeEventListener("mousedown", start);
      pad.removeEventListener("touchstart", start);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
      window.removeEventListener("blur", end);
      end();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="zone-joystick"
      data-dragging={dragging}
      className="pointer-events-none absolute z-70 flex flex-col items-center gap-[6px]"
      style={{
        right: "calc(22px + env(safe-area-inset-right))",
        bottom: "calc(30px + env(safe-area-inset-bottom))",
      }}
    >
      <div
        ref={base}
        data-cursor-hide
        className="pointer-events-auto rounded-full border-2 border-ink/55 bg-cream/35 backdrop-blur-[2px]"
        style={{
          width: BASE,
          height: BASE,
          touchAction: "none",
          cursor: dragging ? "grabbing" : "grab",
          display: "grid",
          placeItems: "center",
        }}
      >
        <span
          ref={knob}
          data-testid="zone-joystick-knob"
          className="block rounded-full bg-ink"
          style={{
            width: KNOB,
            height: KNOB,
            // Sürüklerken geçiş YOK (topuz parmağı/imleci birebir izler); bırakınca merkeze
            // yumuşak döner. reduced-motion: dönüş anlık, kontrol aynen çalışır.
            transition: dragging || reduced ? "none" : "transform .12s ease-out",
          }}
        />
      </div>
      {/*
        Etiket krem hapın İÇİNDE: zemin sabit değil — altından bordo/krem dama geçiyor ve
        koyu yazı bordo karelerin üstünde okunmuyordu (5.5.11 gözle bakma turunda yakalandı).
        Ayrıca `text-ink/70` **Kural 40'ı ihlal ediyordu**: metin renginde opaklık yasak,
        tam palet rengi kullanılır. Hap, `FramePrompt`'un künye hapıyla aynı dili konuşur.
      */}
      <span className="rounded-full border-2 border-berry bg-cream px-[8px] py-[2px] font-pixel text-[9px] uppercase tracking-[0.18em] text-berry-dk max-md:hidden">
        {t("hint.joystick")}
      </span>
    </div>
  );
}
