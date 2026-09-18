"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { drawCapy } from "@/lib/zone/capy";
import { useZoneStore, type Character } from "@/store/zone";

/**
 * Misu / Miyu seçim ekranı (spec bölüm 6 akışı).
 *
 * Yüzler **tek yerden** gelir: `drawCapy()` — sahnedeki sprite'ları da o üretiyor. 8 gerçek
 * PNG düştüğünde `character.ts`'teki `MASCOT_SPRITE_BASE` dolar ve sahne otomatik geçer;
 * burası da aynı kaynaktan beslendiği için **tek yerden** güncellenir.
 */

const W = 220;
const H = 280;

function Face({ who }: { who: Character }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    // Retina'da bulanmasın: piksel tamponu iki kat, CSS boyutu sabit.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr;
    c.height = H * dpr;
    const x = c.getContext("2d");
    if (!x) return;
    x.scale(dpr, dpr);
    drawCapy(x, "front", who, W, H);
  }, [who]);
  /**
   * CSS ölçüsü YALNIZCA sınıfla verilir, `style` ile DEĞİL.
   *
   * İlk hâli `style={{ width: W, height: H }}` + `className="max-md:w-[36vw]"` idi:
   * satır içi stil sınıfı **her zaman** ezer, yani mobil genişlik kuralı hiç çalışmadı.
   * Sonuç 390×844'te seçim bloğunun 526 px olması (viewport 390) — ikinci kart ve başlık
   * kadraj dışında kalıyordu. Kural 37'nin kardeşi: orada sınıf sırası, burada satır içi
   * stil önceliği aynı kusuru üretiyor.
   *
   * `W`/`H` piksel TAMPONUNU belirlemeye devam eder (çizim çözünürlüğü); ekrandaki boyut
   * sınıflardan gelir, en-boy oranı 220/280 = 11/14 ile korunur.
   */
  return <canvas ref={canvas} aria-hidden="true" className="aspect-[11/14] w-[220px] max-md:w-[36vw]" />;
}

export function CharacterSelect() {
  const t = useTranslations("Zone");
  const select = useZoneStore((s) => s.select);

  return (
    <div data-testid="zone-select" className="flex flex-col items-center gap-[2vw] max-md:gap-[6vw]">
      <h2 className="text-center font-display text-[3vw] leading-[1.1] text-cream max-md:text-[8vw]">
        {t("select.title")}
      </h2>
      <div className="flex gap-[2vw] max-md:gap-[4vw]">
        {(["misu", "miyu"] as const).map((who) => (
          <button
            key={who}
            type="button"
            data-testid={`zone-pick-${who}`}
            onClick={() => select(who)}
            className="group flex flex-col items-center gap-[0.6vw] rounded-[1.4vw] border-2 border-cream/40 bg-cream/10 px-[1.6vw] py-[1.2vw] transition-transform duration-300 hover:-translate-y-[0.5vw] hover:border-mustard max-md:gap-[2vw] max-md:rounded-[4vw] max-md:px-[4vw] max-md:py-[3vw]"
          >
            <Face who={who} />
            <span className="font-display text-[1.6vw] text-cream max-md:text-[5vw]">
              {t(`select.${who}`)}
            </span>
            <span className="font-pixel text-[0.6vw] uppercase tracking-[0.18em] text-mustard max-md:text-[2.4vw]">
              {t(`select.${who}Note`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
