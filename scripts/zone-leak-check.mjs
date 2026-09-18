// Faz 5.5 kabul kriteri (spec bölüm 9): Zone aç-kapa-aç'ta bellek/bağlam ARTMAMALI.
// /lab/zone ↔ /lab arasında N kez gidip gelir; her turda canlı WebGL bağlamı,
// canvas sayısı ve sahne nesne sayısı ölçülür. Hepsi sabit kalmalı.
//
// Kullanım: pnpm dev -p 3113 çalışırken → CHROME=<yol> node scripts/zone-leak-check.mjs
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3113";
const ROUNDS = Number(process.env.ROUNDS ?? 6);

const b = await chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));

const read = () => p.evaluate(() => (window.__ZONE_STATS__ ? window.__ZONE_STATS__() : null));

await p.goto(`${BASE}/tr/lab/zone`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => document.querySelector("canvas") !== null, { timeout: 20000 });
await p.waitForTimeout(2000);

const rows = [];
for (let i = 1; i <= ROUNDS; i++) {
  // KAPAT — sahne unmount olur
  await p.locator("[data-testid=zone-toggle]").click();
  await p.waitForFunction(() => document.querySelector("canvas") === null, { timeout: 10000 });
  await p.waitForTimeout(500);
  // AÇ — sahne yeniden mount olur
  await p.locator("[data-testid=zone-toggle]").click();
  await p.waitForFunction(() => document.querySelector("canvas") !== null, { timeout: 20000 });
  await p.waitForTimeout(1200);

  const st = await read();
  rows.push({ round: i, ...(st ?? {}) });
  console.log(`  tur ${i}: created=${st?.created} disposed=${st?.disposed} alive=${st?.alive} canvas=${st?.canvases}`);
}

// Sızıntı ölçütü: `created` her turda artar (normal), ama `alive` (= created - disposed)
// ve canvas sayısı SABİT kalmalı. Artıyorsa bağlam/nesne bırakılmıyor demektir.
const alive = rows.map((r) => r.alive);
const canvases = rows.map((r) => r.canvases);
const stableAlive = alive.every((v) => v === alive[0]);
const stableCanvas = canvases.every((v) => v === canvases[0]);

console.log(`\ncanlı bağlam: [${alive.join(", ")}]  ${stableAlive ? "✓ sabit" : "✗ ARTIYOR"}`);
console.log(`canvas      : [${canvases.join(", ")}]  ${stableCanvas ? "✓ sabit" : "✗ ARTIYOR"}`);
const clean = errs.filter((e) => !/Download the React DevTools|Failed to load resource/.test(e));
console.log(`konsol      : ${clean.length} hata`);
clean.slice(0, 3).forEach((e) => console.log("  ! " + e.slice(0, 160)));

await b.close();
const ok = stableAlive && stableCanvas && clean.length === 0;
console.log(ok ? "\n✓ sızıntı yok" : "\n✗ SIZINTI veya konsol hatası");
process.exit(ok ? 0 : 1);
