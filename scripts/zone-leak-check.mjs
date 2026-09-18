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
/** Sahne KAPALIYKEN canlı doku sayısı — `__ZONE_STATS__` o anda yok, defter modülden okunur. */
const readClosed = () => p.evaluate(() => (window.__ZONE_TEXTURES__ ? window.__ZONE_TEXTURES__() : null));

await p.goto(`${BASE}/tr/lab/zone`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => document.querySelector("canvas") !== null, { timeout: 20000 });
await p.waitForTimeout(2000);

const rows = [];
for (let i = 1; i <= ROUNDS; i++) {
  // KAPAT — sahne unmount olur
  await p.locator("[data-testid=zone-toggle]").click();
  await p.waitForFunction(() => document.querySelector("canvas") === null, { timeout: 10000 });
  await p.waitForTimeout(500);
  const closed = await readClosed();
  // AÇ — sahne yeniden mount olur
  await p.locator("[data-testid=zone-toggle]").click();
  await p.waitForFunction(() => document.querySelector("canvas") !== null, { timeout: 20000 });
  await p.waitForTimeout(1200);

  const st = await read();
  rows.push({ round: i, closedAlive: closed?.alive ?? -1, closedLabels: closed?.byLabel, ...(st ?? {}) });
  console.log(`  tur ${i}: created=${st?.created} disposed=${st?.disposed} alive=${st?.alive} canvas=${st?.canvases} doku=${st?.textures?.alive} (üretilen ${st?.textures?.created}) ölü-bağ=${st?.staleMaps} · kapalıyken ${closed?.alive}`);
}

// Sızıntı ölçütü: `created` her turda artar (normal), ama `alive` (= created - disposed)
// ve canvas sayısı SABİT kalmalı. Artıyorsa bağlam/nesne bırakılmıyor demektir.
const alive = rows.map((r) => r.alive);
const canvases = rows.map((r) => r.canvases);
// Elle üretilen dokular: bağlam sayacı bunları göremez (her mount yeni renderer açar,
// eski renderer'ın `info` sayaçları onunla gider) — ayrı defterden okunur.
const textures = rows.map((r) => r.textures?.alive ?? -1);
const stableAlive = alive.every((v) => v === alive[0]);
const stableCanvas = canvases.every((v) => v === canvases[0]);
const stableTex = textures.every((v) => v === textures[0]);
// Sızıntının kardeşi: doku bırakılmış ama sahne onu kullanmaya devam ediyor. Sayaçlar
// temiz görünür, ekran beyaz çıkar — bu yüzden ayrıca denetlenir.
const stale = rows.map((r) => r.staleMaps ?? -1);
const noStale = stale.every((v) => v === 0);
// spec bölüm 9: "Zone kapanınca ... tüm geometry/material/texture dispose".
// Kapalıyken canlı doku 0 DEĞİLSE bir sahip bırakmayı unutmuş demektir — sayı sabit kalsa bile.
const closedAlive = rows.map((r) => r.closedAlive);
const closedClean = closedAlive.every((v) => v === 0);

console.log(`\ncanlı bağlam: [${alive.join(", ")}]  ${stableAlive ? "✓ sabit" : "✗ ARTIYOR"}`);
console.log(`canvas      : [${canvases.join(", ")}]  ${stableCanvas ? "✓ sabit" : "✗ ARTIYOR"}`);
console.log(`canlı doku  : [${textures.join(", ")}]  ${stableTex ? "✓ sabit" : "✗ ARTIYOR"}`);
console.log(`ölü doku bağı: [${stale.join(", ")}]  ${noStale ? "✓ yok" : "✗ SAHNE ÖLÜ DOKU KULLANIYOR"}`);
console.log(`kapalıyken    : [${closedAlive.join(", ")}]  ${closedClean ? "✓ 0" : "✗ KAPANINCA DOKU BIRAKILMIYOR"}`);
if (!closedClean) console.log(`   kalanlar: ${JSON.stringify(rows.at(-1)?.closedLabels)}`);
const clean = errs.filter((e) => !/Download the React DevTools|Failed to load resource/.test(e));
console.log(`konsol      : ${clean.length} hata`);
clean.slice(0, 3).forEach((e) => console.log("  ! " + e.slice(0, 160)));

await b.close();
const ok = stableAlive && stableCanvas && stableTex && noStale && closedClean && clean.length === 0;
console.log(ok ? "\n✓ sızıntı yok" : "\n✗ SIZINTI veya konsol hatası");
process.exit(ok ? 0 : 1);
