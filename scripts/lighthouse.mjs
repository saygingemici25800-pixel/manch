// Lighthouse — A11y + SEO + Performance; desktop + mobile; preloader'lı ve preloader'sız (?nopreload=1, sadece non-production).
// Kural 43: hedef = preloader'SIZ mobile Performance ≥ 90, LCP < 2.5 s, CLS < 0.1; preloader'lı LCP sadece raporlanır.
// Server (ölçüm build'i): NEXT_PUBLIC_SITE_URL=http://localhost:3100 NEXT_PUBLIC_ALLOW_NOPRELOAD=1 pnpm build && PORT=3100 pnpm start
//   (her iki varyant da prod build'de ölçülür; dev sunucu minify'sız olduğundan TBT'yi 3–5× şişirir — kullanılmaz)
// Kullanım: node scripts/lighthouse.mjs <çıktı.json> [--base URL] [--pages /tr,/tr/menu] [--only a11y,seo,perf] [--form mobile,desktop]
import fs from "node:fs";
import lighthouse from "lighthouse";
import { chromium } from "playwright-core";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg("--base", process.env.BASE ?? "http://localhost:3100");
const OUT = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "docs/screens/lighthouse.json";
const PAGES = arg("--pages", "/tr,/tr/menu,/tr/contact").split(",");
const CATS = arg("--only", "a11y,seo,perf").split(",");
const FORMS = arg("--form", "mobile,desktop").split(",");
const PRELOAD = arg("--preloader", "both"); // both | with | without
const TARGET = { accessibility: 95, seo: 95, performance: 90, lcp: 2500, cls: 0.1 };
const catMap = { a11y: "accessibility", seo: "seo", perf: "performance" };

const PORT = 9333;
const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
const results = {};
let ok = true;
const variants = PRELOAD === "both" ? ["nopreload", "preloader"] : PRELOAD === "without" ? ["nopreload"] : ["preloader"];
for (const form of FORMS) {
  for (const variant of variants) {
    for (const path of PAGES) {
      const url = `${BASE}${path}${variant === "nopreload" ? "?nopreload=1" : ""}`;
      const r = await lighthouse(url, {
        port: PORT, output: "json", logLevel: "error",
        onlyCategories: CATS.map((c) => catMap[c]),
        formFactor: form,
        screenEmulation: form === "mobile" ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
        throttlingMethod: "simulate",
        pauseAfterLoadMs: variant === "preloader" ? 3500 : 1000,
        disableStorageReset: true,
      });
      const lhr = r.lhr;
      const c = lhr.categories;
      const scores = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v.score * 100)]));
      const a = lhr.audits;
      const metrics = {
        lcp: Math.round(a["largest-contentful-paint"]?.numericValue ?? -1),
        cls: Number((a["cumulative-layout-shift"]?.numericValue ?? -1).toFixed(3)),
        tbt: Math.round(a["total-blocking-time"]?.numericValue ?? -1),
        fcp: Math.round(a["first-contentful-paint"]?.numericValue ?? -1),
        si: Math.round(a["speed-index"]?.numericValue ?? -1),
        // LH 13: element `lcp-breakdown-insight` details.items[] içinde type:"node"
        lcpElement: (a["lcp-breakdown-insight"]?.details?.items ?? []).find((i) => i.type === "node")?.selector ?? null,
      };
      const clsItems = (a["layout-shift-elements"]?.details?.items ?? a["layout-shifts"]?.details?.items ?? []).slice(0, 5).map((i) => ({ node: i.node?.selector ?? i.node?.snippet ?? "?", score: Number((i.score ?? i.layoutShiftScore ?? 0).toFixed(3)) }));
      const failing = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && ["binary", "numeric"].includes(x.scoreDisplayMode) && !/-metric$/.test(x.id))
        .map((x) => ({ id: x.id, score: x.score, savingsMs: x.details?.overallSavingsMs ?? undefined })).slice(0, 12);
      const key = `${form}|${variant}|${path}`;
      results[key] = { form, variant, path, scores, metrics, clsItems, failing };
      // hedef: sadece preloader'sız mobile
      const gate = variant === "nopreload" && form === "mobile";
      const pass = (scores.accessibility ?? 100) >= TARGET.accessibility && (scores.seo ?? 100) >= TARGET.seo &&
        (!gate || ((scores.performance ?? 0) >= TARGET.performance && metrics.lcp < TARGET.lcp && metrics.cls < TARGET.cls));
      if (gate) ok &&= pass;
      console.log(`${gate ? (pass ? "✓" : "✗") : "·"} ${form.padEnd(7)} ${variant.padEnd(9)} ${path.padEnd(12)} perf ${String(scores.performance ?? "-").padStart(3)}  a11y ${scores.accessibility ?? "-"}  seo ${scores.seo ?? "-"}  LCP ${metrics.lcp}ms  CLS ${metrics.cls}  TBT ${metrics.tbt}ms  lcp=${metrics.lcpElement ?? "?"}`);
    }
  }
}
await browser.close();
fs.writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), base: BASE, target: TARGET, results }, null, 2));
console.log("written", OUT);
process.exit(ok ? 0 : 1);
