// Kural 46 — gerçek ilk yükleme JS'i: sunucu HTML'indeki <script src> dosyaları.
// `nomodule` polyfill hariç; gz sütunu esas. Hedef: ana sayfa ≤ 200 kB gz.
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

const LIMIT = 200;
console.log("sayfa        | dosya | raw kB | gz kB | limit 200 gz");
console.log("-------------|-------|--------|-------|-------------");
for (const [p, r] of Object.entries(rows)) {
  console.log(`${p.padEnd(12)} | ${String(r.files).padStart(5)} | ${String(r.firstLoadRawKB).padStart(6)} | ${String(r.firstLoadGzKB).padStart(5)} | ${r.firstLoadGzKB <= LIMIT ? "✓" : "✗ AŞIYOR"}`);
}
console.log("\n/tr en büyük 5 chunk (gz):");
for (const f of rows["/tr"]?.top ?? []) console.log(`  ${String(f.gzKB).padStart(6)} kB  ${f.file}`);
writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), base: BASE, limitGzKB: LIMIT, rows }, null, 2));
console.log(`\n→ ${OUT}`);
