"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const TRAIL_LEN = 18;

/** Geçici malzeme ikonları (gerçek ikonlar Faz 7 — TODO). Sıra: marul, domates, peynir, köfte. */
const ICONS = [
  <circle key="lettuce" cx="12" cy="12" r="8" fill="#7CBF6A" />,
  <circle key="tomato" cx="12" cy="12" r="8" fill="#E24B3B" />,
  <rect key="cheese" x="4" y="4" width="16" height="16" rx="2" fill="var(--color-mustard)" />,
  <circle key="patty" cx="12" cy="12" r="8" fill="#6B3F2A" />,
];

/**
 * R8 — Desktop-only: beyaz 2px iz path + buzlu cam dairede dönen malzeme ikonu.
 * `data-cursor-hide` taşıyan elemanların üstünde daire gizlenir. Reduced motion / coarse pointer: render edilmez.
 */
export default function CursorTrail() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const [icon, setIcon] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER);
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useGSAP(
    () => {
      if (!enabled || reduced || !root.current) return;
      const poly = root.current.querySelector<SVGPolylineElement>("polyline")!;
      const disc = root.current.querySelector<HTMLDivElement>(".disc")!;
      const pts: [number, number][] = [];
      let hidden = false;
      let moved = false; // ilk mousemove'a kadar disk görünmez (mouseenter tek başına göstermez)

      const toX = gsap.quickTo(disc, "x", { duration: 0.35, ease: "power3.out" });
      const toY = gsap.quickTo(disc, "y", { duration: 0.35, ease: "power3.out" });

      const onMove = (e: MouseEvent) => {
        if (!moved) {
          moved = true;
          gsap.set(disc, { x: e.clientX, y: e.clientY });
          if (!hidden) gsap.to(disc, { autoAlpha: 1, duration: 0.3 });
        }
        pts.push([e.clientX, e.clientY]);
        if (pts.length > TRAIL_LEN) pts.shift();
        toX(e.clientX);
        toY(e.clientY);
        const hide = !!(e.target as Element | null)?.closest?.("[data-cursor-hide]");
        if (hide !== hidden) {
          hidden = hide;
          gsap.to(disc, { scale: hide ? 0 : 1, autoAlpha: hide ? 0 : 1, duration: 0.25, overwrite: true });
        }
      };
      const onLeave = () => gsap.to(disc, { autoAlpha: 0, duration: 0.3 });
      const onEnter = () => moved && !hidden && gsap.to(disc, { autoAlpha: 1, duration: 0.3 });

      // İz: her tick'te en eski noktayı düşür → hareket durunca iz kendiliğinden erir
      const tick = () => {
        if (pts.length > 1 && gsap.ticker.frame % 2 === 0) pts.shift();
        poly.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
      };
      gsap.ticker.add(tick);

      const rotate = gsap.to(disc.querySelector("svg"), { rotation: 360, duration: 6, ease: "none", repeat: -1 });
      const cycle = window.setInterval(() => setIcon((i) => (i + 1) % ICONS.length), 1400);

      window.addEventListener("mousemove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
      document.documentElement.addEventListener("mouseenter", onEnter);

      return () => {
        gsap.ticker.remove(tick);
        rotate.kill();
        window.clearInterval(cycle);
        window.removeEventListener("mousemove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
        document.documentElement.removeEventListener("mouseenter", onEnter);
      };
    },
    { scope: root, dependencies: [enabled, reduced], revertOnUpdate: true },
  );

  if (!enabled || reduced) return null;

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 z-100">
      <svg className="absolute inset-0 h-full w-full">
        <polyline
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ mixBlendMode: "difference" }}
        />
      </svg>
      <div
        className="disc absolute left-0 top-0 grid h-[3.2vw] w-[3.2vw] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-white/25 backdrop-blur-md"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]">
          {ICONS[icon]}
        </svg>
      </div>
    </div>
  );
}
