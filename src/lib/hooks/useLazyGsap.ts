"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useGsapReady } from "@/lib/motion-store";

/** `@/lib/gsap` modülü (tek registerPlugin noktası) — lazy import edilir, ilk yükleme JS'ine girmez (Kural 46). */
export type GsapBundle = typeof import("@/lib/gsap");
type Cleanup = void | (() => void);

/**
 * useGSAP'ın lazy karşılığı: `@/lib/gsap` effect içinde `import()` edilir, gsap.context ile sarılır,
 * cleanup'ta context revert + isteğe bağlı temizleyici. SSR içerik korunur (component'ler normal render eder).
 * Bağımlılıklar Kural 36 gereği primitive/kararlı olmalı.
 */
export function useLazyGsap(
  setup: (g: GsapBundle, ctx: gsap.Context) => Cleanup,
  deps: readonly unknown[],
  scope?: RefObject<Element | null>,
) {
  // Kural 25: render'da ref yazılmaz — setup, effect'in koştuğu render'ın kapanımıdır (useGSAP ile aynı semantik)
  useEffect(() => {
    let cancelled = false;
    let ctx: gsap.Context | undefined;
    let cleanup: Cleanup;
    import("@/lib/gsap").then((g) => {
      if (cancelled) return;
      const scopeEl = scope?.current ?? undefined;
      ctx = g.gsap.context(() => {
        cleanup = setup(g, ctx as gsap.Context);
      }, scopeEl);
    });
    return () => {
      cancelled = true;
      if (typeof cleanup === "function") cleanup();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Event handler'lar için: modül yüklendiyse döner, yoksa null (henüz yüklenmediyse animasyonsuz davran). */
export function useGsapModule(): RefObject<GsapBundle | null> {
  const ref = useRef<GsapBundle | null>(null);
  const ready = useGsapReady();
  useEffect(() => {
    let cancelled = false;
    import("@/lib/gsap").then((g) => {
      if (!cancelled) ref.current = g;
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);
  return ref;
}
