// FAZ B-2 bekçisi — ETKİSİZ VARYANT (tautoloji) avcısı.
//
// Kusur sınıfı: `text-cream ... hover:text-cream`. Sınıf duruyor, `transition-colors`
// dönüyor, ekranda HİÇBİR ŞEY olmuyor. `grep` "hover sınıfı var" der ve geçer.
// Kural 79-A'nın ikinci yüzü: iki token birleşince varyant dinlenme durumuyla aynı
// sınıfa düşer. 2026-11-13'te üç yerde birden bulundu — `MenuOverlay` linkleri,
// `BlobButton` SVG dolgusu ve `Footer` menü linkleri.
//
// Tarayıcı GEREKTİRMEZ: kaynak üstünde, deterministik, saniyeler sürer.
// Kullanım: node scripts/tautoloji-check.mjs
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const KOK = "src";
/** Dinlenme durumunu değiştirmesi beklenen varyantlar. */
const VARYANT = /(?:^|\s)((?:group-)?(?:hover|focus-visible|focus|active)(?:\/[\w-]+)?:)([a-z-]+-[\w[\]./%-]+)/g;
/** Yalnız RENK/GÖRÜNÜM sınıfları — `scale`, `translate` gibi dönüşümler kapsam dışı. */
const RENK_ONEK = /^(text|bg|fill|stroke|border|ring|outline|decoration|shadow)-/;

let pass = 0, fail = 0;
const ok = (c, l, e = "") => { if (c) { pass++; console.log(`  ✓ ${l}${e ? " — " + e : ""}`); } else { fail++; console.log(`  ✗ ${l}${e ? " — " + e : ""}`); } };

async function* dosyalar(dir) {
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const yol = join(dir, d.name);
    if (d.isDirectory()) yield* dosyalar(yol);
    else if (/\.tsx?$/.test(d.name)) yield yol;
  }
}

/** Bir className dizgisi içinde etkisiz kalan varyantları döndürür. */
export function tautolojiler(dizgi) {
  const parcalar = dizgi.split(/\s+/).filter(Boolean);
  // Taban = varyant öneki TAŞIMAYAN sınıflar (`md:`/`max-md:` kırılım önekleri soyulur).
  const taban = new Set(
    parcalar
      .filter((c) => !/(?:^|:)(?:group-)?(?:hover|focus-visible|focus|active)(?:\/[\w-]+)?:/.test(c))
      .map((c) => c.replace(/^(?:max-)?(?:sm|md|lg|xl|2xl):/, "")),
  );
  const bulunan = [];
  for (const m of dizgi.matchAll(VARYANT)) {
    const [, onek, deger] = m;
    if (!RENK_ONEK.test(deger)) continue;
    if (taban.has(deger)) bulunan.push(`${onek}${deger}`);
  }
  return bulunan;
}

console.log("TAUTOLOJİ TARAMASI — etkisiz hover/odak varyantları\n");
const kirli = [];
let tarandi = 0;
for await (const yol of dosyalar(KOK)) {
  const s = await readFile(yol, "utf8");
  tarandi++;
  // className="..." · className={clsx("...", ...)} · className={`...`} — hepsinde
  // tırnak/backtick içi dizgileri topluyoruz.
  for (const m of s.matchAll(/["'`]([^"'`\n]*?(?:hover|focus-visible|focus|active):[^"'`\n]*?)["'`]/g)) {
    const t = tautolojiler(m[1]);
    if (t.length) kirli.push(`${yol}: ${[...new Set(t)].join(" ")}`);
  }
}

ok(tarandi > 50, "kaynak tarandı", `${tarandi} dosya`); // Kural 77(a): ölçmediğini raporlama
ok(kirli.length === 0, "etkisiz hover/odak varyantı YOK", kirli.slice(0, 6).join(" | ") || `${tarandi} dosya temiz`);

// --- ÇİFT YÖNLÜ: yüklem gerçekten ayırt ediyor mu (Kural 60/77-b) ---
ok(tautolojiler("text-cream transition-colors hover:text-cream").length === 1,
  "sonda: TAUTOLOJİ yakalanıyor", "text-cream + hover:text-cream");
ok(tautolojiler("text-cream transition-colors hover:text-sky").length === 0,
  "sonda: GERÇEK değişim yanlış alarm vermiyor", "text-cream + hover:text-sky");
ok(tautolojiler("fill-berry group-hover/blob:fill-berry").length === 1,
  "sonda: group-hover varyantı da yakalanıyor", "fill-berry + group-hover/blob:fill-berry");
ok(tautolojiler("hover:scale-105 scale-105").length === 0,
  "sonda: dönüşüm sınıfı kapsam DIŞI (yanlış alarm yok)", "scale-105");

console.log(`\n${pass}/${pass + fail} ${fail ? "✗" : "✓"}`);
process.exit(fail ? 1 : 0);
