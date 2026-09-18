"use client";

import { useEffect } from "react";

import { pressKey, releaseAllInput, releaseKey } from "@/lib/zone/runtime";

/**
 * Klavye → `lib/zone/runtime` (spec bölüm 7.2).
 *
 * Hook yalnızca olayları bağlar; girdi durumunu runtime modülü tutar (Kural 25 — mutasyon
 * plain fonksiyonların içinde). Joystick (5.5.6) aynı modüle `setJoystick()` ile yazacak,
 * ikisi `readInput()` içinde toplanır.
 *
 * `<Canvas>` DIŞINDA çağrılır: pencere olayları sahneye ait değil.
 */

/** Sayfa kaydırmasın diye engellenen tuşlar (spec 7.2). */
const SCROLLERS = new Set([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

export function useZoneControls(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      // POV'a girerken basılı kalan tuş, çıkışta karakteri kaçırır.
      releaseAllInput();
      return;
    }
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      pressKey(k);
      if (SCROLLERS.has(k)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => releaseKey(e.key.toLowerCase());

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseAllInput);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseAllInput);
      releaseAllInput();
    };
  }, [enabled]);
}
