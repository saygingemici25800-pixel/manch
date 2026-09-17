"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
/** SSR: dokunmatik varsayılır → imleç izi sunucuda hiç render edilmez. */
const getServerSnapshot = () => false;

/** Masaüstü (hover + fine pointer) mi? CursorTrail bunu okur. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
