// Faz 5.5 kabul kriteri: three.js / fiber / drei ana bundle'a SIZMAMALI (spec bölüm 9).
// Zone `next/dynamic` ile ayrı chunk olacak; bu script her adımda çalıştırılır.
//
// Kullanım: pnpm start -p 3101 çalışırken → node scripts/zone-bundle-check.mjs
import { gzipSync } from "node:zlib";

const BASE = process.env.BASE ?? "http://localhost:3101";
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ["/tr", "/tr/menu", "/tr/about", "/tr/contact"];
const LIMIT_MAIN = 200;   // Kural 46
const LIMIT_ZONE = 180;   // spec bölüm 9

// Minify sonrası hayatta kalan, three'ye özgü diziler. Dinamik import'un chunk ADI da
// "three" içerebildiği için tek bir isme bakmak yanıltıcı — birden çok imza aranır.
const THREE_SIGNS = ["WebGLRenderer", "BufferGeometry", "PerspectiveCamera", "Quaternion", "MeshBasicMaterial"];

const g = (buf) => +(gzipSync(buf, { level: 9 }).length / 1024).toFixed(1);

let fail = 0;
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
  if (leaked) fail++;
  console.log(`${path.padEnd(12)} | ${String(gz).padStart(9)} ${over ? "✗" : "✓"}    | ${leaked ? "✗ SIZDI: " + hits.join(" · ") : "✓ yok"}`);
}

console.log(`\nana bundle limiti ${LIMIT_MAIN} kB gz · Zone chunk limiti ${LIMIT_ZONE} kB gz`);
if (fail) {
  console.error(`\n✗ three.js ${fail} sayfanın ilk yüklemesine SIZDI — Zone'u next/dynamic + { ssr:false } ile yükleyin`);
  process.exit(1);
}
console.log("\n✓ three.js hiçbir sayfanın ilk yüklemesinde yok");
