"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

interface Family {
  label: string;
  cssVar: string;
}

interface Props {
  families: readonly Family[];
  chars: string;
  labels: { checking: string; ok: string; missing: string; notLoaded: string };
}

type Row = { label: string; status: "checking" | "notLoaded" | "done"; missing: string[] };

/** next/font değişkeninden gerçek family adını çek: `'__Modak_abc', '__Modak_Fallback_abc'` → `__Modak_abc` */
function primaryFamily(cssVar: string): string | null {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  const m = raw.match(/^'([^']+)'|^"([^"]+)"|^([^,]+)/);
  const fam = (m?.[1] ?? m?.[2] ?? m?.[3])?.trim();
  return fam || null;
}

/** Glyph var mı? Font'un kendi genişliği iki farklı referans fallback'ten de farklıysa var. */
function hasGlyph(ctx: CanvasRenderingContext2D, fam: string, ch: string): boolean {
  const px = "160px";
  const w = (font: string) => {
    ctx.font = font;
    return ctx.measureText(ch).width;
  };
  const mono = w(`${px} monospace`);
  const serif = w(`${px} serif`);
  const withMono = w(`${px} "${fam}", monospace`);
  const withSerif = w(`${px} "${fam}", serif`);
  const eq = (a: number, b: number) => Math.abs(a - b) < 0.25;
  // glyph yoksa her iki ölçüm referansına düşer
  return !(eq(withMono, mono) && eq(withSerif, serif));
}

export default function GlyphCheck({ families, chars, labels }: Props) {
  const [rows, setRows] = useState<Row[]>(() =>
    families.map((f) => ({ label: f.label, status: "checking", missing: [] })),
  );

  useEffect(() => {
    let cancelled = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    (async () => {
      const next: Row[] = [];
      for (const f of families) {
        const fam = primaryFamily(f.cssVar);
        if (!fam) {
          next.push({ label: f.label, status: "notLoaded", missing: [] });
          continue;
        }
        try {
          await document.fonts.load(`160px "${fam}"`, chars + "A");
        } catch {
          /* aşağıda kontrol edilir */
        }
        // Kontrol karakteri: "A" yoksa font hiç yüklenmemiştir
        if (!hasGlyph(ctx, fam, "A")) {
          next.push({ label: f.label, status: "notLoaded", missing: [] });
          continue;
        }
        const missing = [...chars].filter((ch) => !hasGlyph(ctx, fam, ch));
        next.push({ label: f.label, status: "done", missing });
      }
      if (!cancelled) setRows(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [families, chars]);

  return (
    <ul className="flex flex-col gap-[0.5vw] max-md:gap-[2vw] text-[1.1vw] max-md:text-[3.8vw] uppercase tracking-wide">
      {rows.map((r) => {
        const bad = r.status === "notLoaded" || r.missing.length > 0;
        return (
          <li key={r.label} className="flex flex-wrap items-center gap-[0.8vw] max-md:gap-[2.5vw]">
            <span className="w-[10vw] max-md:w-full font-display normal-case tracking-normal">{r.label}</span>
            <span
              className={clsx(
                "rounded-full px-[0.9vw] py-[0.2vw] max-md:px-[3vw] max-md:py-[1vw]",
                r.status === "checking" && "bg-paper text-berry-dk",
                r.status === "done" && !bad && "bg-mustard text-ink",
                bad && "bg-berry text-cream",
              )}
            >
              {r.status === "checking" && labels.checking}
              {r.status === "notLoaded" && labels.notLoaded}
              {r.status === "done" && (r.missing.length === 0 ? labels.ok : labels.missing)}
            </span>
            {r.missing.length > 0 && (
              <span className="font-pixel text-berry">{r.missing.join(" ")}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
