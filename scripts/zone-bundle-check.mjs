// Faz 5.5 kabul kriteri: three.js / fiber / drei ana bundle'a SIZMAMALI (spec bölüm 9).
// Zone `next/dynamic` ile ayrı chunk olacak; bu script her adımda çalıştırılır.
//
// Kullanım: pnpm start -p 3101 çalışırken → node scripts/zone-bundle-check.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BASE = process.env.BASE ?? "http://localhost:3101";
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ["/tr", "/tr/menu", "/tr/about", "/tr/contact"];
const LIMIT_MAIN = 220;   // Kural 46 (revize 2026-09-19: 200 → 220, gerekçe kuralda)
const LIMIT_ZONE = 260;   // spec bölüm 9 (180 → 260, karar 2026-09-18)

// Minify sonrası hayatta kalan, three'ye özgü diziler. Dinamik import'un chunk ADI da
// "three" içerebildiği için tek bir isme bakmak yanıltıcı — birden çok imza aranır.
const THREE_SIGNS = ["WebGLRenderer", "BufferGeometry", "PerspectiveCamera", "Quaternion", "MeshBasicMaterial"];

const g = (buf) => +(gzipSync(buf, { level: 9 }).length / 1024).toFixed(1);

let leaks = 0;
let oversize = 0;
console.log("sayfa        | ilk yükleme gz | three imzası");
console.log("-------------|----------------|--------------------------");

for (const path of PAGES) {
  const html = await fetch(BASE + path).then((r) => r.text());
  const srcs = [...new Set(
    [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*>/g)]
      .filter((m) => !/nomodule/.test(m[0]))
      .map((m) => m[1])
      .filter((u) => u.startsWith("/_next/")),
  )];

  let gz = 0;
  const hits = [];
  for (const u of srcs) {
    const buf = Buffer.from(await fetch(BASE + u).then((r) => r.arrayBuffer()));
    gz += g(buf);
    const text = buf.toString("utf8");
    const found = THREE_SIGNS.filter((s) => text.includes(s));
    if (found.length >= 2) hits.push(`${u.split("/").pop()} (${found.join(",")})`);
  }
  gz = +gz.toFixed(1);

  const leaked = hits.length > 0;
  const over = gz > LIMIT_MAIN;
  if (leaked) leaks++;
  console.log(`${path.padEnd(12)} | ${String(gz).padStart(9)} ${over ? "✗" : "✓"}    | ${leaked ? "✗ SIZDI: " + hits.join(" · ") : "✓ yok"}`);
}

console.log(`\nana bundle limiti ${LIMIT_MAIN} kB gz · Zone chunk limiti ${LIMIT_ZONE} kB gz`);

/* ---------------------------------------------------------------------------
   Zone chunk'ı: `next/dynamic` ile ayrılan, three/fiber/drei taşıyan parçalar.
   Ana bundle'da three ARAMAK yetmez — "sızmadı" demek "ne kadar" demek değil.
   Build çıktısındaki chunk'lar taranır; three imzası taşıyanların gz toplamı Zone yüküdür.
--------------------------------------------------------------------------- */
const DIST = process.env.NEXT_DIST_DIR ?? ".next";
const CHUNK_DIR = join(DIST, "static", "chunks");

function walk(dir) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".js")) out.push(full);
  }
  return out;
}

const files = walk(CHUNK_DIR);
if (files.length === 0) {
  console.log(`\nZone chunk ölçülemedi: ${CHUNK_DIR} bulunamadı (NEXT_DIST_DIR doğru mu?)`);
} else {
  const zoneChunks = [];
  for (const f of files) {
    const buf = readFileSync(f);
    const text = buf.toString("utf8");
    const found = THREE_SIGNS.filter((sig) => text.includes(sig));
    if (found.length >= 2) zoneChunks.push({ file: f.split("/").pop(), gz: g(buf) });
  }
  const zoneGz = +zoneChunks.reduce((n, c) => n + c.gz, 0).toFixed(1);
  console.log(`\nZone chunk (three imzalı ${zoneChunks.length} parça): ${zoneGz} kB gz ${zoneGz <= LIMIT_ZONE ? "✓" : "✗ LİMİT AŞILDI"}`);
  for (const c of zoneChunks.sort((a, b) => b.gz - a.gz).slice(0, 5)) {
    console.log(`   ${String(c.gz).padStart(7)} kB gz  ${c.file}`);
  }
  if (zoneGz > LIMIT_ZONE) oversize = zoneGz;
}
// İki ayrı kusur, iki ayrı mesaj: "sızdı" ile "büyük" aynı şey değil.
if (leaks) {
  console.error(`\n✗ three.js ${leaks} sayfanın ilk yüklemesine SIZDI — Zone'u next/dynamic + { ssr:false } ile yükleyin`);
}
if (oversize) {
  console.error(`\n✗ Zone chunk ${oversize} kB gz — limit ${LIMIT_ZONE} kB (sızıntı YOK, yalnızca boyut)`);
}
if (leaks || oversize) process.exit(1);
console.log("\n✓ three.js hiçbir sayfanın ilk yüklemesinde yok · Zone chunk limit içinde");
