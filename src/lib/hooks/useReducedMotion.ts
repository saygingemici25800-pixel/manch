"use client";

import { useSyncExternalStore } from "react";

import { useMotionStore } from "@/lib/motion-store";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
// SSR'da animasyonlu varyant render edilir; hydrate sonrası gerçek tercih devreye girer
// (useSyncExternalStore sayesinde uyuşmazlık yok).
const getServerSnapshot = () => false;

/** Kural 26: sistem tercihi ∨ /lab override'ı. Her motion primitive bunu okur. */
export function useReducedMotion(): boolean {
  const system = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const forced = useMotionStore((s) => s.forceReduced);
  return forced ?? system;
}
