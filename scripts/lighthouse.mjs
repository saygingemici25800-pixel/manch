// Lighthouse (A11y + SEO) — Playwright'ın Chromium'u ile. Prod server gerektirir:
//   NEXT_PUBLIC_SITE_URL=http://localhost:3100 pnpm build && PORT=3100 pnpm start
// (canonical/hreflang site.url'den üretilir; sunucu adresiyle eşleşmezse LH "invalid canonical" der)
// Kullanım: node scripts/lighthouse.mjs [çıktı.json]
import fs from "node:fs";
import lighthouse from "lighthouse";
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.argv[2] ?? "docs/screens/faz-7-lighthouse.json";
const PAGES = ["/tr", "/tr/menu", "/tr/contact"];
const TARGET = { accessibility: 95, seo: 95 };

// chrome-launcher pnpm'de hoist edilmiyor → Playwright Chromium'u CDP portuyla aç, Lighthouse porta bağlanır
const PORT = 9333;
const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
const chrome = { port: PORT, kill: () => browser.close() };
const results = {};
let ok = true;
for (const path of PAGES) {
  const r = await lighthouse(`${BASE}${path}`, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["accessibility", "seo"],
    // Preloader 1.8 s + çıkış: yükleme sonrası bekle
    pauseAfterLoadMs: 3500,
    disableStorageReset: true,
  });
  const lhr = r.lhr;
  const scores = { accessibility: Math.round(lhr.categories.accessibility.score * 100), seo: Math.round(lhr.categories.seo.score * 100) };
  const failing = Object.values(lhr.audits)
    .filter((a) => a.score !== null && a.score < 1 && (a.scoreDisplayMode === "binary" || a.scoreDisplayMode === "numeric"))
    .map((a) => ({ id: a.id, title: a.title, score: a.score, items: (a.details?.items ?? []).slice(0, 5).map((i) => i.node?.selector ?? i.node?.snippet ?? i.source ?? "").filter(Boolean) }));
  results[path] = { scores, failing };
  const pass = scores.accessibility >= TARGET.accessibility && scores.seo >= TARGET.seo;
  ok &&= pass;
  console.log(`${pass ? "✓" : "✗"} ${path}  A11y ${scores.accessibility}  SEO ${scores.seo}`);
  for (const f of failing) console.log(`    - [${f.id}] ${f.title}${f.items.length ? " → " + f.items.join(" | ").slice(0, 200) : ""}`);
}
await chrome.kill();
fs.writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), base: BASE, target: TARGET, results }, null, 2));
console.log("written", OUT);
process.exit(ok ? 0 : 1);
