// Görsel kontrol: 375 / 768 / 1440 / 1920 tam sayfa ekran görüntüsü (tr ana sayfa + menü) + yatay taşma raporu.
// Kullanım: BASE=http://localhost:3200 node scripts/screens.mjs [docs/screens]   (dev sunucu; preloader sessionStorage ile atlanır)
import path from "node:path";
import { chromium } from "playwright-core";
const BASE = process.env.BASE ?? "http://localhost:3200";
const OUT = process.argv[2] ?? "docs/screens";
const WIDTHS = [375, 768, 1440, 1920];
const PAGES = [["/tr", "home"], ["/tr/menu", "menu"]];
const browser = await chromium.launch();
let bad = 0;
for (const w of WIDTHS) {
  const mobile = w < 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? 812 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  await ctx.addInitScript(() => { sessionStorage.setItem("manch-preloaded", "1"); localStorage.setItem("manch-cookie", "ok"); });
  for (const [p, name] of PAGES) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}${p}`, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => {
      const sw = document.documentElement.scrollWidth, iw = window.innerWidth;
      const wide = [...document.querySelectorAll("body *")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > iw + 1 || r.left < -1) && getComputedStyle(el).position !== "fixed"; })
        .filter((el) => !el.closest("[data-transition], .track, [aria-hidden='true']")).slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")}`);
      return { sw, iw, wide };
    });
    const ok = overflow.sw <= overflow.iw + 1;
    if (!ok) bad++;
    console.log(`${ok ? "✓" : "✗"} ${String(w).padStart(4)}px ${name.padEnd(5)} scrollWidth ${overflow.sw}/${overflow.iw}${overflow.wide.length ? "  taşan: " + overflow.wide.join(" | ") : ""}`);
    await page.screenshot({ path: path.join(OUT, `faz-8-${w}${name === "menu" ? "-menu" : ""}.png`), fullPage: true });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
