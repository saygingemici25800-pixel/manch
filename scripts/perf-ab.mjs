// A/B/C kare-hızı değil, LCP karşılaştırması — VARYANTLARI DÖNÜŞÜMLÜ ölçer.
//
// Neden dönüşümlü: ardışık iki tam Lighthouse koşusu arasında makine durumu kayıyor.
// 2026-09-19'da ölçüldü: /menu'ye dokunan bir değişiklikten sonra DOKUNULMAYAN /tr de
// 3142 → 3487 ms oynadı (±350 ms). Kayma, ölçülmek istenen etkiden büyük olunca
// "önce/sonra" iki ayrı koşu hiçbir şey kanıtlamaz (Kural 60).
// Çözüm: varyantlar aynı oturumda, tur tur, sırayla ölçülür; her turda hepsi aynı
// makine durumunu görür. Medyan turlar üzerinden alınır.
//
// Kullanım: CHROME=<yol> node scripts/perf-ab.mjs /tr /tr/menu
import { chromium } from "playwright-core";
import lighthouse from "lighthouse";

const VARIANTS = (process.env.VARIANTS ?? "V0=3102,V1=3103,V2=3101")
  .split(",").map((s) => { const [name, port] = s.split("="); return { name, port: Number(port) }; });
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ["/tr", "/tr/menu"];
const ROUNDS = Number(process.env.ROUNDS ?? 3);
const PORT = 9224;

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: [`--remote-debugging-port=${PORT}`] });
const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const data = {};

for (let r = 0; r < ROUNDS; r++) {
  for (const v of VARIANTS) {
    for (const path of PAGES) {
      const res = await lighthouse(`http://localhost:${v.port}${path}?nopreload=1`, {
        port: PORT, output: "json", logLevel: "error",
        onlyCategories: ["performance"], formFactor: "mobile",
        screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
      });
      const a = res.lhr.audits;
      const key = `${path}|${v.name}`;
      (data[key] ??= { lcp: [], perf: [], tbt: [] });
      data[key].lcp.push(Math.round(a["largest-contentful-paint"].numericValue));
      data[key].perf.push(Math.round(res.lhr.categories.performance.score * 100));
      data[key].tbt.push(Math.round(a["total-blocking-time"].numericValue));
    }
  }
  console.log(`  tur ${r + 1}/${ROUNDS} bitti`);
}
await browser.close();

console.log(`\nsayfa        | varyant | LCP medyan |  perf | TBT | örnekler`);
console.log(`-------------|---------|------------|-------|-----|----------`);
for (const path of PAGES) {
  const base = data[`${path}|${VARIANTS[0].name}`];
  for (const v of VARIANTS) {
    const d = data[`${path}|${v.name}`];
    if (!d) continue;
    const l = med(d.lcp);
    const delta = v === VARIANTS[0] ? "" : `  (${l - med(base.lcp) >= 0 ? "+" : ""}${l - med(base.lcp)} ms)`;
    console.log(`${path.padEnd(12)} | ${v.name.padEnd(7)} | ${String(l).padStart(6)} ms${delta.padEnd(12)} | ${String(med(d.perf)).padStart(5)} | ${String(med(d.tbt)).padStart(3)} | ${d.lcp.join(", ")}`);
  }
}
