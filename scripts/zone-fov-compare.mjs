// Faz 5.5.11 · "mobil portrede salon dar tünel gibi okunuyor" TODO'su için KARŞILAŞTIRMA kareleri.
//
// Bu script bir karar vermez ve hiçbir sabiti değiştirmez — yalnızca o anki kaynaktan
// portre görüntüsü alır. Adaylar `lib/zone/frames.ts` GEÇİCİ olarak elle değiştirilip
// her biri için ayrı çağrılır, sonra dosya geri alınır. Böylece "öneri" bir tahmin değil,
// yan yana bakılabilen bir kare olur.
//
// Kullanım: LABEL=mevcut CHROME=<yol> node scripts/zone-fov-compare.mjs
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3000";
const LABEL = process.env.LABEL ?? "mevcut";
const OUT = "docs/screens";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
page.setDefaultTimeout(90000);
await fetch(`${BASE}/tr/lab/zone`).catch(() => {});
await page.goto(`${BASE}/tr/lab/zone`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__ZONE_STATS__?.().canvases === 1);
await page.waitForTimeout(2000);

// Lab kromu ölçümü kirletmesin (5.5.8: lab aracı ürünün eylemini örtüyordu).
await page.evaluate(() => {
  for (const sel of ["[data-testid=zone-readout]", "[data-testid=zone-toggle]", "[data-testid=zone-close-frame]", "nav", "header"]) {
    document.querySelectorAll(sel).forEach((el) => { el.style.visibility = "hidden"; });
  }
});
// Salonun ortasında, künyeye bakan başlangıç duruşu — kırılımlar arası aynı kare.
await page.waitForTimeout(600);
const s = await page.evaluate(() => window.__ZONE_STATS__());
const aspect = 390 / 844;
const hFov = (2 * Math.atan(Math.tan((s.cam.fov * Math.PI) / 180 / 2) * aspect) * 180) / Math.PI;

/* "Salonun yüzde kaçı görünüyor" metriği YANILTICI çıktı: analitik olarak CAM_DIST 7.5 ile
   FOV_MAX 85.1 aynı oranı veriyordu, ama ekranda biri tabloları TAM gösterirken öteki
   kesiyordu. Çünkü tablolar yan duvarda BELİRLİ derinliklerde duruyor; bakış mesafesindeki
   ortalama genişlik onların kadraja girip girmediğini söylemiyor.
   Bu yüzden ölçüt değiştirildi: her tablonun EKRAN dikdörtgeninin kadraja düşen oranı
   (`__ZONE_ART_RECT__` — 5.5.5'ten beri var olan kanca). */
const frames = await page.evaluate(() => {
  const out = {};
  for (const id of ["menu", "crew", "mascot", "visit"]) {
    const r = window.__ZONE_ART_RECT__(id);
    if (!r) { out[id] = null; continue; }
    const w = r.right - r.left, h = r.bottom - r.top;
    const vx = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const vy = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    out[id] = w > 0 && h > 0 ? +((vx * vy) / (w * h) * 100).toFixed(0) : 0;
  }
  return out;
});
await page.screenshot({ path: `${OUT}/faz-5.5.11-fov-${LABEL}-390.png` });
const fstr = Object.entries(frames).map(([k, v]) => `${k} %${v ?? "-"}`).join(" · ");
console.log(`${LABEL.padEnd(18)} vFOV ${String(s.cam.fov.toFixed(1)).padStart(5)}°  yatay ${hFov.toFixed(1)}°  kamera z ${String(s.cam.z).padStart(5)}  | tablo kadrajda: ${fstr}`);
await browser.close();
