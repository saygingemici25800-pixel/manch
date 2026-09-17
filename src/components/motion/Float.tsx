"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface Props {
  children: ReactNode;
  /** saniye; ikinci öğe için farklı ver, senkron görünmesin */
  duration?: number;
  delay?: number;
  className?: string;
}

/** Idle float: yumuşak sinüs yukarı-aşağı + hafif dönüş (maskot). Reduced motion: statik. */
export default function Float({ children, duration = 3.2, delay = 0, className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      gsap.to(".inner", { y: "-1.2vw", rotation: 2, duration, delay, ease: "sine.inOut", yoyo: true, repeat: -1 });
    },
    { scope: root, dependencies: [reduced, duration, delay], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={className}>
      <div className="inner will-change-transform">{children}</div>
    </div>
  );
}
