// Faz 7 kabul ölçümü: A11y + SEO (Faz 8'de Performance eklenecek, Kural 43).
// chrome-launcher pnpm strict'te hoist edilmiyor → Chromium'u playwright açar,
// Lighthouse'a yalnızca `port` verilir.
// Kullanım: pnpm start -p 3101 çalışırken → CHROME=<yol> node scripts/lighthouse.mjs
import { chromium } from "playwright-core";
import lighthouse from "lighthouse";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3101";
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ["/tr", "/tr/menu", "/tr/contact"];
const PORT = 9222;

const browser = await chromium.launch({
  executablePath: process.env.CHROME,
  args: [`--remote-debugging-port=${PORT}`],
});

const rows = [];
for (const path of PAGES) {
  const res = await lighthouse(
    BASE + path + "?nopreload=1",
    { port: PORT, output: "json", logLevel: "error", onlyCategories: ["accessibility", "seo"] },
    { extends: "lighthouse:default", settings: { formFactor: "mobile", screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } } },
  );
  const c = res.lhr.categories;
  const fails = Object.values(res.lhr.audits)
    .filter((a) => a.score !== null && a.score < 1 && ["accessibility", "seo"].some((k) => c[k].auditRefs.some((r) => r.id === a.id)))
    .map((a) => a.id);
  rows.push({ path, a11y: Math.round(c.accessibility.score * 100), seo: Math.round(c.seo.score * 100), fails });
}
await browser.close();

console.log("sayfa         | A11y | SEO | düşen denetimler");
console.log("--------------|------|-----|------------------------------------------");
for (const r of rows) console.log(`${r.path.padEnd(13)} | ${String(r.a11y).padStart(4)} | ${String(r.seo).padStart(3)} | ${r.fails.join(", ") || "—"}`);
writeFileSync("docs/screens/faz-7-lighthouse.json", JSON.stringify({ date: new Date().toISOString(), base: BASE, rows }, null, 2));
const bad = rows.filter((r) => r.a11y < 95 || r.seo < 95);
console.log(bad.length ? `\n✗ eşik altı: ${bad.map((b) => b.path).join(", ")}` : "\n✓ üç sayfa da A11y ≥ 95 ve SEO ≥ 95");
process.exit(bad.length ? 1 : 0);
