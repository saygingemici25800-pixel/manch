// Faz 8 görsel kontrol: 375 / 768 / 1440 / 1920 — yatay taşma denetimi + tam sayfa ekran.
import { chromium } from "playwright-core";
import { hazir } from "./_bekle.mjs";
const BASE = process.env.BASE ?? "http://localhost:3113";
const WIDTHS = [375, 768, 1440, 1920];
const PAGES = [["", ""], ["/menu", "-menu"]];
const b = await chromium.launch({ executablePath: process.env.CHROME });
let bad = 0;
for (const w of WIDTHS) {
  for (const [path, suffix] of PAGES) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/tr${path}?nopreload=1`, { waitUntil: "domcontentloaded" });
    await p.waitForSelector("footer");
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await hazir(p); // Kural 75: sabit 1500 ms yerine koşul
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 0) bad++;
    await p.screenshot({ path: `docs/screens/faz-8-${w}${suffix}.png`, fullPage: true });
    console.log(`${String(w).padStart(4)}px /tr${path.padEnd(6)} taşma: ${over > 0 ? "✗ " + over + "px" : "✓ yok"}`);
    await ctx.close();
  }
}
await b.close();
console.log(bad ? `\n✗ ${bad} kırılımda yatay taşma` : "\n✓ hiçbir kırılımda yatay taşma yok");
process.exit(bad ? 1 : 0);
