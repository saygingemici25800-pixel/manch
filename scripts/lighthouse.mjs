// Kural 43 — Performance + A11y + SEO, **desktop ve mobile**, her sayfa **iki kez**:
// preloader'sız (?nopreload=1) ve preloader'lı. Her iki varyant da PROD build'de ölçülür
// (dev sunucuda ölçüm YAPILMAZ: minify'sız bundle TBT'yi 3–5× şişirir).
// `?nopreload=1` prod'da yalnızca NEXT_PUBLIC_ALLOW_NOPRELOAD=1 ile build edilmişse çalışır.
// Hedef = preloader'sız mobile: Performance ≥ 90, LCP < 2.5 s, CLS < 0.1.
// Preloader'lı LCP olduğu gibi raporlanır (hedef değildir; zemin bilinçli).
//
// chrome-launcher pnpm strict'te hoist edilmiyor → Chromium'u playwright açar, LH'ye `port` verilir.
// Kullanım: NEXT_PUBLIC_ALLOW_NOPRELOAD=1 pnpm build && pnpm start -p 3101
//           CHROME=<yol> OUT=docs/screens/faz-8-baseline.json node scripts/lighthouse.mjs
import { chromium } from "playwright-core";
import lighthouse from "lighthouse";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3101";
const OUT = process.env.OUT ?? "docs/screens/faz-7-lighthouse.json";
const ONLY = process.env.ONLY;            // "a11y" → yalnızca A11y+SEO (Faz 7 kabulü)
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ["/tr", "/tr/menu", "/tr/contact"];
const PORT = 9222;

const CATS = ONLY === "a11y" ? ["accessibility", "seo"] : ["performance", "accessibility", "seo"];
const FORMS = ONLY === "a11y"
  ? [{ name: "mobile", opts: { formFactor: "mobile", screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } } }]
  : [
      { name: "mobile", opts: { formFactor: "mobile", screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } } },
      { name: "desktop", opts: { formFactor: "desktop", screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } },
    ];
const VARIANTS = ONLY === "a11y" ? [{ name: "nopreload", q: "?nopreload=1" }]
  : [{ name: "nopreload", q: "?nopreload=1" }, { name: "preloader", q: "" }];

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: [`--remote-debugging-port=${PORT}`] });

// Tek Lighthouse koşusu ±10 puan / ±1 s oynayabiliyor (ölçüldü 2026-09-18) →
// varsayılan 3 koşu, medyan raporlanır. RUNS=1 ile hızlı bakılabilir.
const RUNS = Number(process.env.RUNS ?? 3);
const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const rows = [];
for (const path of PAGES) {
  for (const form of FORMS) {
    for (const v of VARIANTS) {
      const samples = [];
      let lastFails = [];
      for (let run = 0; run < RUNS; run++) {
      const res = await lighthouse(
        BASE + path + v.q,
        { port: PORT, output: "json", logLevel: "error", onlyCategories: CATS },
        { extends: "lighthouse:default", settings: { ...form.opts, throttlingMethod: "simulate" } },
      );
      const c = res.lhr.categories;
      const a = res.lhr.audits;
      const fails = Object.values(a)
        .filter((x) => x.score !== null && x.score < 1 && CATS.some((k) => c[k].auditRefs.some((r) => r.id === x.id)))
        .map((x) => x.id);
      samples.push({
        perf: c.performance ? Math.round(c.performance.score * 100) : null,
        a11y: Math.round(c.accessibility.score * 100),
        seo: Math.round(c.seo.score * 100),
        lcp: Math.round(a["largest-contentful-paint"]?.numericValue ?? -1),
        cls: Number((a["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(4)),
        tbt: Math.round(a["total-blocking-time"]?.numericValue ?? -1),
        fcp: Math.round(a["first-contentful-paint"]?.numericValue ?? -1),
      });
      lastFails = fails;
      }
      rows.push({
        path, form: form.name, variant: v.name, runs: RUNS,
        perf: med(samples.map((x) => x.perf)),
        a11y: med(samples.map((x) => x.a11y)),
        seo: med(samples.map((x) => x.seo)),
        lcp: med(samples.map((x) => x.lcp)),
        cls: med(samples.map((x) => x.cls)),
        tbt: med(samples.map((x) => x.tbt)),
        fcp: med(samples.map((x) => x.fcp)),
        perfSamples: samples.map((x) => x.perf),
        lcpSamples: samples.map((x) => x.lcp),
        fails: lastFails,
      });
    }
  }
}
await browser.close();

console.log(`sayfa        | form    | varyant   | perf | A11y | SEO |  LCP  |  CLS   | TBT  | ${RUNS} koşu perf / LCP`);
console.log("-------------|---------|-----------|------|------|-----|-------|--------|-----");
for (const r of rows) {
  console.log(`${r.path.padEnd(12)} | ${r.form.padEnd(7)} | ${r.variant.padEnd(9)} | ${String(r.perf ?? "—").padStart(4)} | ${String(r.a11y).padStart(4)} | ${String(r.seo).padStart(3)} | ${String(r.lcp).padStart(5)} | ${r.cls.toFixed(4)} | ${String(r.tbt).padStart(4)} | [${r.perfSamples.join(",")}] [${r.lcpSamples.join(",")}]`);
}
writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), base: BASE, rows }, null, 2));
console.log(`\n→ ${OUT}`);

// Kural 43 hedefi: preloader'sız mobile
const target = rows.filter((r) => r.form === "mobile" && r.variant === "nopreload");
const bad = target.filter((r) => (r.perf ?? 100) < 90 || r.lcp >= 2500 || r.cls >= 0.1);
if (ONLY === "a11y") {
  const b2 = rows.filter((r) => r.a11y < 95 || r.seo < 95);
  console.log(b2.length ? `✗ eşik altı: ${b2.map((x) => x.path).join(", ")}` : "✓ A11y ≥ 95 ve SEO ≥ 95");
  process.exit(b2.length ? 1 : 0);
}
console.log(bad.length
  ? `✗ hedef altı (preloader'sız mobile): ${bad.map((r) => `${r.path} perf=${r.perf} lcp=${r.lcp} cls=${r.cls}`).join(" · ")}`
  : "✓ preloader'sız mobile: perf ≥ 90, LCP < 2500 ms, CLS < 0.1");
