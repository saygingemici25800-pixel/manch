"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};
/** Kural 30: persist store'ları (localStorage) hydrate'ten önce render etme — SSR'da false, client'ta true. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
