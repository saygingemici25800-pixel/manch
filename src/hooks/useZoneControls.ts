"use client";

import { useEffect } from "react";

import { pressKey, releaseAllInput, releaseKey } from "@/lib/zone/runtime";
import { useZoneStore } from "@/store/zone";

/**
 * Klavye → `lib/zone/runtime` (spec bölüm 7.2).
 *
 * Hook yalnızca olayları bağlar; girdi durumunu runtime modülü tutar (Kural 25 — mutasyon
 * plain fonksiyonların içinde). Joystick (5.5.10) aynı modüle `setJoystick()` ile yazacak,
 * ikisi `readInput()` içinde toplanır.
 *
 * **Dinleyici HER ZAMAN bağlı kalır; durumu tuş tuş süzüyoruz.** İlk hâlinde POV açılınca
 * dinleyicinin tamamı kaldırılıyordu — hareket gerçekten duruyordu ama `Esc` de duyulmuyordu,
 * yani tabloya girilip bir daha çıkılamıyordu. Kapatılacak olan **hareket**, çıkış değil.
 *
 * `<Canvas>` DIŞINDA çağrılır: pencere olayları sahneye ait değil.
 */

/** Sayfa kaydırmasın diye engellenen tuşlar (spec 7.2). */
const SCROLLERS = new Set([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

export function useZoneControls() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const zone = useZoneStore.getState();

      // Esc her durumda duyulur: POV'dan çıkışın tek klavye yolu.
      if (k === "escape") {
        if (zone.state === "pov") zone.closeFrame();
        return;
      }
      // POV'da (ve Zone kapalıyken) hareket girdisi yok — spec 6.1.
      if (zone.state !== "zone") return;

      pressKey(k);
      if (SCROLLERS.has(k)) e.preventDefault();
      if (k === "e" && zone.nearFrame) zone.openFrame(zone.nearFrame);
    };
    const up = (e: KeyboardEvent) => releaseKey(e.key.toLowerCase());

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseAllInput);

    /**
     * POV'a geçerken basılı kalan tuşlar bırakılır. Yoksa POV'dayken tuş bırakılsa bile
     * `keyup` süzülmediği için değil, girdi kümesinde kaldığı için çıkışta karakter
     * kendiliğinden yürümeye devam ederdi.
     */
    const unsubscribe = useZoneStore.subscribe((s, prev) => {
      if (s.state !== prev.state && s.state !== "zone") releaseAllInput();
    });

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseAllInput);
      unsubscribe();
      releaseAllInput();
    };
  }, []);
}
