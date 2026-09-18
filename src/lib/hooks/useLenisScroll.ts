"use client";

import { useEffect } from "react";

import { useLenis } from "@/lib/lenis-store";

type ScrollEvent = { direction: number; velocity: number; scroll: number };

/** `lenis/react`'in callback'li `useLenis(cb)` karşılığı — instance gelince abone olur. */
export function useLenisScroll(cb: (e: ScrollEvent) => void, deps: readonly unknown[] = []) {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    const handler = (e: unknown) => cb(e as ScrollEvent);
    lenis.on("scroll", handler);
    return () => {
      lenis.off("scroll", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lenis, ...deps]);
}
