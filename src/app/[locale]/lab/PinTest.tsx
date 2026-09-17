"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** R15 izole test: Lenis (root, native scroll) + ScrollTrigger.pin. pinType varsayılan ("fixed"). */
export default function PinTest({ pinType }: { pinType?: "fixed" | "transform" }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      gsap.timeline({
        scrollTrigger: {
          trigger: ".pin-wrap",
          start: "top top",
          end: "+=150%",
          pin: true,
          pinType,
          scrub: 0.5,
        },
      })
        .to(".layer-a", { y: "-14vw", ease: "none" }, 0)
        .to(".layer-b", { y: "14vw", ease: "none" }, 0)
        .to(".counter", { textContent: 100, snap: { textContent: 1 }, ease: "none" }, 0);
    },
    { scope: root, dependencies: [reduced, pinType], revertOnUpdate: true },
  );

  return (
    <div ref={root}>
      <div data-testid="pin-wrap" className="pin-wrap relative flex h-[60vh] max-md:h-[70vh] items-center justify-center overflow-hidden rounded-[1vw] max-md:rounded-[3vw] bg-sky">
        <div className="layer-a absolute h-[6vw] w-[24vw] max-md:h-[14vw] max-md:w-[60vw] rounded-full bg-mustard" />
        <div className="layer-b absolute h-[6vw] w-[24vw] max-md:h-[14vw] max-md:w-[60vw] rounded-full bg-berry" />
        <p className="relative font-display text-[5vw] max-md:text-[14vw] text-ink"><span className="counter">0</span>%</p>
      </div>
    </div>
  );
}
