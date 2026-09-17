"use client";

import { useEffect, useState } from "react";

import { TR_GLYPHS } from "@/styles/tokens";

type Row = { label: string; missing: string[]; error?: string };

/**
 * Kural 21: TR kapsamını "latin-ext" etiketine güvenmeden doğrular.
 *
 * Yöntem: karakteri `<gerçek aile>, monospace` ve düz `monospace` ile canvas'a çizip
 * pikselleri karşılaştırır; aynıysa glyph hedefte yok, monospace'e düşmüştür.
 *
 * İki tuzak (2026-09-18):
 *  1) canvas `ctx.font` **CSS değişkeni çözmez** → `var(--font-modak)` geçilemez;
 *     değişken `getComputedStyle` ile gerçek aile adına çevrilir.
 *  2) next/font değişkeni `'__Modak_x', '__Modak_Fallback_x'` şeklindedir; fallback
 *     yerel Arial türevidir ve TR karakterleri **vardır** → ölçüm yanlış "var" derdi.
 *     Bu yüzden yalnızca **ilk** aile (gerçek webfont) kullanılır.
 */
export function GlyphCheck({ families }: { families: { label: string; cssVar: string }[] }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await document.fonts.ready;

      const size = 48;
      const c = document.createElement("canvas");
      c.width = size * 2;
      c.height = size * 2;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const rootStyle = getComputedStyle(document.documentElement);

      // Tarayıcı `ctx.font` okumasında tek kelimelik aile adının tırnaklarını düşürür
      // ("Modak" → Modak), çok kelimeliyi korur → karşılaştırma normalize edilir.
      const norm = (v: string) => v.replace(/["']/g, "").toLowerCase();

      const draw = (ch: string, family: string) => {
        ctx.font = `${size}px ${family}, monospace`;
        // Kapı: atama geçersizse ctx.font eski değerde kalır → ölçüm anlamsız olur.
        if (!norm(ctx.font).includes(norm(family))) return null;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.textBaseline = "middle";
        ctx.fillText(ch, 4, size);
        return ctx.getImageData(0, 0, c.width, c.height).data.join(",");
      };

      const next: Row[] = families.map(({ label, cssVar }) => {
        // Tuzak 2: sadece ilk aile (gerçek webfont), fallback değil.
        const family = rootStyle.getPropertyValue(cssVar).split(",")[0].trim();
        if (!family) return { label, missing: [], error: `${cssVar} tanımsız` };

        const base = draw("x", "monospace");
        const probe = draw("x", family);
        if (base === null || probe === null) return { label, missing: [], error: "ölçülemedi" };
        if (base === probe) return { label, missing: [], error: `${family} yüklenmemiş` };

        const missing = TR_GLYPHS.filter((ch) => {
          const a = draw(ch, family);
          const b = draw(ch, "monospace");
          return a !== null && b !== null && a === b;
        });
        return { label, missing };
      });

      if (!cancelled) setRows(next);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [families]);

  if (!rows) {
    return <p className="font-ui text-[1vw] uppercase max-md:text-[3.2vw]">Ölçülüyor…</p>;
  }

  return (
    <ul data-testid="glyphcheck" className="flex flex-col gap-[0.6vw] max-md:gap-[2vw]">
      {rows.map((r) => (
        <li key={r.label} className="font-ui text-[1.1vw] max-md:text-[3.4vw]">
          <span className="font-bold">{r.label}:</span>{" "}
          {r.error ? (
            <span className="text-berry-dk">⚠ {r.error}</span>
          ) : r.missing.length === 0 ? (
            <span className="text-berry">
              ✓ {TR_GLYPHS.length}/{TR_GLYPHS.length} TR karakteri var
            </span>
          ) : (
            <span className="text-berry-dk">
              ✗ eksik ({r.missing.length}): {r.missing.join(" ")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
