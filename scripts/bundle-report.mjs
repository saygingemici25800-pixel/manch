// Kural 46 — gerçek ilk yükleme JS'i: sunucu HTML'indeki <script src> dosyaları.
// `nomodule` polyfill hariç; gz sütunu esas. Hedef: ana sayfa ≤ 220 kB gz
// (Kural 46, revize 2026-09-19: 200 → 220 — 200 ölçüm yapılmadan konmuş bir
// tahmindi, kalan ağırlık çatının kendisi. Gerekçe kuralda).
// NOT (Kural, Faz 8): sayfa argümanı `argv.slice(2)` ile alınır — `find(startsWith("/"))`
// argv[0]'daki node yolunu yakalayıp yanlış sayfayı ölçüyordu.
import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BASE = process.env.BASE ?? "http://localhost:3101";
const OUT = process.env.OUT ?? "docs/screens/faz-8-bundle-baseline.json";
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ["/tr", "/tr/menu", "/tr/about", "/tr/contact"];

const rows = {};
for (const path of PAGES) {
  const html = await fetch(BASE + path).then((r) => r.text());
  const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*>/g)]
    .filter((m) => !/nomodule/.test(m[0]))
    .map((m) => m[1])
    .filter((u) => u.startsWith("/_next/"));
  const uniq = [...new Set(srcs)];
  let raw = 0, gz = 0;
  const files = [];
  for (const u of uniq) {
    const buf = Buffer.from(await fetch(BASE + u).then((r) => r.arrayBuffer()));
    const g = gzipSync(buf, { level: 9 }).length;
    raw += buf.length; gz += g;
    files.push({ file: u.split("/").pop(), rawKB: +(buf.length / 1024).toFixed(1), gzKB: +(g / 1024).toFixed(1) });
  }
  files.sort((a, b) => b.gzKB - a.gzKB);
  rows[path] = { files: uniq.length, firstLoadRawKB: +(raw / 1024).toFixed(1), firstLoadGzKB: +(gz / 1024).toFixed(1), top: files.slice(0, 5) };
}

/* Limit, LCP'nin ERKEN UYARI VEKİLİDİR — amacın kendisi değil (Kural 46).
   Bayt hedefi tek başına ölçüt olsaydı 218 kB'lik bir sayfa "başarısız" sayılırdı;
   oysa gerçek kapı Kural 72'nin LCP ölçümü. */
const LIMIT = 220; // Kural 46 (revize 2026-09-19)
/* UYARI eşiği (karar 2026-09-20): limitin %98'i. Pay 0.7 kB'ye indiğinde fark edilmesi
   için — sınıra dayandığımızı AŞMADAN ÖNCE görmek istiyoruz. Uyarı çıkış kodunu
   değiştirmez (kapı hâlâ LIMIT), yalnız görünür kılar. */
const WARN = +(LIMIT * 0.98).toFixed(1);
const damga = (gz) => (gz > LIMIT ? "✗ AŞIYOR" : gz >= WARN ? `⚠ SINIRDA (pay ${+(LIMIT - gz).toFixed(1)} kB)` : "✓");
console.log(`sayfa        | dosya | raw kB | gz kB | limit ${LIMIT} gz (uyarı ${WARN})`);
console.log("-------------|-------|--------|-------|-------------");
let asan = 0, sinirda = 0;
for (const [p, r] of Object.entries(rows)) {
  if (r.firstLoadGzKB > LIMIT) asan++; else if (r.firstLoadGzKB >= WARN) sinirda++;
  console.log(`${p.padEnd(12)} | ${String(r.files).padStart(5)} | ${String(r.firstLoadRawKB).padStart(6)} | ${String(r.firstLoadGzKB).padStart(5)} | ${damga(r.firstLoadGzKB)}`);
}
console.log("\n/tr en büyük 5 chunk (gz):");
for (const f of rows["/tr"]?.top ?? []) console.log(`  ${String(f.gzKB).padStart(6)} kB  ${f.file}`);
writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), base: BASE, limitGzKB: LIMIT, warnGzKB: WARN, rows }, null, 2));
if (sinirda)
  console.log(
    `\n⚠ ${sinirda} sayfa limitin %98'inde. Bu "aşmak üzeresin" demek DEĞİL —\n` +
      `  sıradaki özellik ağırlığını HAK ETMELİ demek.\n` +
      `  220'yi gerçekten aşan bir değişiklik geldiğinde kapı otomatik kırmızı sayılmaz:\n` +
      `  Kural 72 koşullarında LCP yeniden ölçülür, hedefin altındaysa limit KANITLA revize\n` +
      `  edilir. Limit, rahatsız ettiği için yükseltilmez.`,
  );
if (asan) console.error(`\n✗ ${asan} sayfa ${LIMIT} kB gz limitini AŞIYOR (Kural 46).`);
console.log(`\n→ ${OUT}`);
