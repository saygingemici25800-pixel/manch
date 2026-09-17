// First Load JS (Next tanımı): ilk HTML'deki <script src> chunk'ları (hydration için gereken) — raw + gzip (zlib, sunucu sıkıştırmasından bağımsız).
// Ayrıca "toplam (networkidle)": mount'ta lazy inen chunk'lar dahil. nomodule polyfill sayılmaz. Kural 46: ana sayfa ilk yükleme ≤ 200 kB gz.
// Kullanım: BASE=http://localhost:3100 node scripts/bundle-report.mjs [out.json] [/tr,/tr/menu,...]
import fs from "node:fs";
import zlib from "node:zlib";
import { chromium } from "playwright-core";
const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.argv.slice(2).find((a) => a.endsWith(".json")) ?? null;
const PAGES = (process.argv.slice(2).find((a) => a.startsWith("/") && !a.endsWith(".json")) ?? "/tr,/tr/menu,/tr/about,/tr/contact").split(",");
const LIMIT_GZ_KB = 200;
const browser = await chromium.launch();
const rows = {};
let ok = true;
for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => sessionStorage.setItem("manch-preloaded", "1"));
  const page = await ctx.newPage();
  const js = new Map();
  page.on("response", async (r) => {
    const u = r.url();
    if (!u.includes("/_next/static/") || !u.endsWith(".js")) return;
    try { const body = await r.body(); js.set(u, { raw: body.length, gz: zlib.gzipSync(body).length }); } catch { /* yoksay */ }
  });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  // "İlk yükleme" = SUNUCU HTML'indeki <script src> (noModule hariç). Turbopack lazy chunk'ları DOM'a sonradan
  // <script> ekler; DOM'a bakmak onları da ilk yükleme sayardı.
  const html = await (await page.request.get(`${BASE}${path}`)).text();
  const initial = new Set(), nomodule = new Set();
  for (const m of html.matchAll(/<script([^>]*)src="([^"]+\.js)"([^>]*)>/g)) {
    const attrs = m[1] + m[3], u = new URL(m[2], BASE).href;
    (/nomodule/i.test(attrs) ? nomodule : initial).add(u);
  }
  for (const u of [...js.keys()]) if (nomodule.has(u)) js.delete(u);
  const sum = (sel) => [...js.entries()].filter(([u]) => sel(u)).reduce((s, [, v]) => ({ raw: s.raw + v.raw, gz: s.gz + v.gz }), { raw: 0, gz: 0 });
  const first = sum((u) => initial.has(u)), total = sum(() => true);
  const kb = (b) => +(b / 1024).toFixed(1);
  const lazy = [...js.entries()].filter(([u]) => !initial.has(u)).sort((a, b) => b[1].raw - a[1].raw).slice(0, 4).map(([u, v]) => `${u.split("/").pop()} ${kb(v.gz)}gz`);
  rows[path] = { initialFiles: [...js.keys()].filter((u) => initial.has(u)).length, firstLoadRawKB: kb(first.raw), firstLoadGzKB: kb(first.gz), totalFiles: js.size, totalRawKB: kb(total.raw), totalGzKB: kb(total.gz), lazyTop: lazy };
  const pass = rows[path].firstLoadGzKB <= LIMIT_GZ_KB;
  if (path === "/tr") ok &&= pass;
  console.log(`${pass ? "✓" : "✗"} ${path.padEnd(12)} First Load ${String(rows[path].initialFiles).padStart(2)} js  ${String(rows[path].firstLoadRawKB).padStart(6)} kB raw  ${String(rows[path].firstLoadGzKB).padStart(5)} kB gz   | networkidle toplam ${rows[path].totalFiles} js ${rows[path].totalRawKB} raw / ${rows[path].totalGzKB} gz   lazy: ${lazy.join(" · ")}`);
  await ctx.close();
}
await browser.close();
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), base: BASE, limitGzKB: LIMIT_GZ_KB, rows }, null, 2));
process.exit(ok ? 0 : 1);
