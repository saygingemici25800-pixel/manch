// Lab kabul testi (Faz 3 + Faz 4). Dev server gerektirir:  PORT=3200 pnpm dev
// Kullanım: node scripts/lab-check.mjs <çıktı-klasörü>   → png/webm + konsol raporu
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3200";
const OUT = process.argv[2] ?? "docs/screens";
fs.mkdirSync(OUT, { recursive: true });
const issues = [];
const fails = [];
const check = (name, ok, info = "") => { console.log(`${ok ? "✓" : "✗"} ${name}${info ? " — " + info : ""}`); if (!ok) fails.push(name); };
const attach = (page, tag) => {
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) issues.push(`[${tag}] console.${m.type()}: ${m.text().slice(0, 300)}`); });
  page.on("pageerror", (e) => issues.push(`[${tag}] pageerror: ${e.message.slice(0, 300)}`));
};
const stCount = async (page) => { await page.waitForSelector('[data-testid="st-count"]'); await page.waitForTimeout(600); return Number((await page.textContent('[data-testid="st-count"]')).match(/\d+/)[0]); };
const waitPreloader = async (page) => { await page.waitForSelector("[data-preloader]", { state: "detached", timeout: 15000 }).catch(() => {}); };

const browser = await chromium.launch();

// ===================== Faz 3: motion =====================
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); attach(page, "faz3");
  await page.goto(`${BASE}/tr/lab`, { waitUntil: "networkidle", timeout: 120000 });
  await waitPreloader(page);
  const n0 = await stCount(page);
  check("html.lenis", await page.evaluate(() => document.documentElement.classList.contains("lenis")));
  await page.click('[data-testid="rm-toggle"]'); await page.waitForTimeout(500);
  check("reduced: marquee statik", (await page.$eval(".track", (el) => el.style.transform)) === "");
  check("reduced: ScrollTrigger 0", (await stCount(page)) === 0);
  await page.click('[data-testid="rm-toggle"]'); await page.waitForTimeout(800);
  check("restored: ScrollTrigger geri", (await stCount(page)) === n0, `n0=${n0}`);
  const a = [];
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="nav-other-locale"]'); await page.waitForURL(/\/en\/lab/); await waitPreloader(page); a.push(await stCount(page));
    await page.click('[data-testid="nav-other-locale"]'); await page.waitForURL(/\/tr\/lab/); await waitPreloader(page); a.push(await stCount(page));
  }
  check("10× locale round-trip: ST sabit", a.every((x) => x === n0), a.join(" "));
  const b = [];
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="nav-home"]'); await page.waitForURL(/\/tr$/); await page.waitForTimeout(300);
    await page.click('[data-testid="nav-lab"]'); await page.waitForURL(/\/tr\/lab/); b.push(await stCount(page));
  }
  check("10× home round-trip: ST sabit", b.every((x) => x === n0), b.join(" "));
  await ctx.close();
}

// ===================== Faz 4: layout (desktop) =====================
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); attach(page, "faz4");
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle", timeout: 120000 });
  // Preloader: ilk render'da var, sonra kalkar, sessionStorage yazılır
  check("preloader ilk yüklemede görünür", (await page.$("[data-preloader]")) !== null);
  await waitPreloader(page);
  check("preloader kalktı + sessionStorage", await page.evaluate(() => !document.querySelector("[data-preloader]") && sessionStorage.getItem("manch-preloaded") === "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  check("preloader 2. yüklemede yok", (await page.$("[data-preloader]")) === null);
  // Cookie banner
  await page.waitForSelector('[data-testid="cookie-banner"]', { timeout: 5000 });
  await page.click('[data-testid="cookie-banner"] button:last-child'); await page.waitForTimeout(300);
  check("cookie OKAY → localStorage", await page.evaluate(() => localStorage.getItem("manch-cookie") === "ok" && !document.querySelector('[data-testid="cookie-banner"]')));
  // Desktop screenshot (nav + placeholder + footer)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "faz-4-desktop.png"), fullPage: true });
  // Nav: scroll down → gizlen, up → göster (uzun sayfa: lab)
  await page.goto(`${BASE}/tr/lab`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  await page.mouse.move(700, 450);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(80); }
  await page.waitForTimeout(700);
  check("nav scroll-down'da gizli", (await page.getAttribute("[data-nav]", "data-nav-state")) === "hidden");
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -300); await page.waitForTimeout(80); }
  await page.waitForTimeout(700);
  check("nav scroll-up'ta görünür", (await page.getAttribute("[data-nav]", "data-nav-state")) === "visible");
  // data-nav-dark blok nav'ın altına gelince invert (lab'daki berry blok; footer viewport'tan kısa olduğu için nav'a ulaşmaz)
  // Lenis smooth scroll bitmeden native scrollIntoView ezilir → önce dursun
  await page.waitForFunction(() => !document.documentElement.classList.contains("lenis-scrolling"), null, { timeout: 5000 });
  await page.evaluate(() => document.querySelector('[data-testid="dark-block"]').scrollIntoView({ behavior: "instant", block: "start" }));
  await page.waitForTimeout(900);
  check("data-nav-dark altında nav invert (text-cream)", await page.$eval("[data-nav]", (el) => el.className.includes("text-cream")));
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(900);
  check("açık zeminde nav normal (text-berry)", await page.$eval("[data-nav]", (el) => el.className.includes("text-berry")));

  // PageTransition + title: /tr/lab → (perde) → /tr
  await page.goto(`${BASE}/tr/lab`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const titleBefore = await page.title();
  await page.click('[data-testid="lab-tl-home"]');
  await page.waitForFunction(() => ["covering", "covered"].includes(document.querySelector("[data-transition]")?.getAttribute("data-transition") ?? ""), null, { timeout: 3000 });
  await page.waitForTimeout(400);
  const midTitle = await page.title();
  const visibleMid = await page.$eval("[data-transition] .stage", (el) => getComputedStyle(el).visibility === "visible" && Number(getComputedStyle(el).opacity) > 0);
  check("perde görünür (cover)", visibleMid);
  check("title: Smash'leniyor", midTitle.includes("Smash'leniyor"), midTitle);
  await page.waitForURL(/\/tr$/, { timeout: 8000 });
  await page.waitForFunction(() => document.querySelector("[data-transition]")?.getAttribute("data-transition") === "idle", null, { timeout: 8000 });
  const afterTitle = await page.title();
  check("navigasyon tamam + perde idle", page.url().endsWith("/tr"));
  check("title: Servis → sonra sayfa başlığı", afterTitle.includes("Servis") || afterTitle === titleBefore.split(" | ")[0], afterTitle);
  await page.waitForTimeout(1200);
  check("title geri geldi", !(await page.title()).includes("|"), await page.title());

  // Cart: lab'dan ekle, drawer aç, checkout disabled (WhatsApp TODO)
  await page.goto(`${BASE}/tr/lab`, { waitUntil: "networkidle" });
  await page.click('[data-testid="lab-add-cart"]'); await page.waitForTimeout(300);
  check("cart badge = 1", (await page.textContent('[data-testid="cart-count"]')).trim() === "1");
  await page.click('[data-testid="lab-add-cart"]'); await page.waitForTimeout(300);
  check("cart badge = 2 (qty birleşti)", (await page.textContent('[data-testid="cart-count"]')).trim() === "2");
  await page.click('[data-testid="lab-open-cart"]'); await page.waitForTimeout(700);
  check("drawer açık", (await page.getAttribute('[role="dialog"][aria-label]', "data-state")) !== null && await page.$eval('[data-testid="checkout"]', (el) => el.matches(":disabled, [aria-disabled='true']")), "checkout disabled (whatsapp TODO)");
  await page.keyboard.press("Escape"); await page.waitForTimeout(600);
  check("ESC drawer kapatır", await page.$$eval('[role="dialog"][data-state="open"]', (els) => els.length === 0));
  await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(500);
  check("cart localStorage persist", (await page.textContent('[data-testid="cart-count"]')).trim() === "2");
  // InfoModal
  await page.click('[data-testid="lab-open-info"]'); await page.waitForTimeout(500);
  check("InfoModal açık + focus içeride", await page.evaluate(() => { const d = document.querySelector('[aria-labelledby="info-title"]'); return d?.getAttribute("data-state") === "open" && d.contains(document.activeElement); }));
  await page.click('[data-testid="info-close"]'); await page.waitForTimeout(400);
  check("InfoModal kapandı", (await page.getAttribute('[aria-labelledby="info-title"]', "data-state")) === "closed");
  await ctx.close();
}

// ===================== Faz 4: mobil 375 =====================
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); attach(page, "mobile");
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle", timeout: 120000 });
  await waitPreloader(page);
  await page.evaluate(() => { localStorage.setItem("manch-cookie", "ok"); });
  await page.click('[data-testid="menu-toggle"]'); await page.waitForTimeout(900);
  check("mobil: overlay açık", (await page.getAttribute("#menu-overlay", "data-state")) === "open");
  check("mobil: body scroll kilitli", await page.evaluate(() => document.documentElement.style.overflow === "hidden"));
  check("mobil: focus overlay içinde", await page.evaluate(() => document.querySelector("#menu-overlay").contains(document.activeElement)));
  await page.screenshot({ path: path.join(OUT, "faz-4-mobile.png") });
  await page.keyboard.press("Escape"); await page.waitForTimeout(600);
  check("mobil: ESC overlay kapatır", (await page.getAttribute("#menu-overlay", "data-state")) === "closed");
  await page.click('[data-testid="cart-button"]'); await page.waitForTimeout(700);
  check("mobil: cart drawer açık", await page.$$eval('[role="dialog"][data-state="open"]', (els) => els.length === 1));
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  await ctx.close();
}

// ===================== Video: transition =====================
{
  const vdir = path.join(OUT, "_video");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: vdir, size: { width: 1280, height: 800 } } });
  const page = await ctx.newPage(); attach(page, "video");
  await page.goto(`${BASE}/tr/lab`, { waitUntil: "networkidle", timeout: 120000 });
  await waitPreloader(page);
  await page.evaluate(() => document.querySelector("#layout").scrollIntoView({ behavior: "instant" }));
  await page.waitForTimeout(600);
  await page.click('[data-testid="lab-tl-home"]');
  await page.waitForURL(/\/tr$/, { timeout: 8000 });
  await page.waitForTimeout(2200);
  const video = page.video();
  await ctx.close();
  const vpath = await video.path();
  fs.renameSync(vpath, path.join(OUT, "faz-4-transition.raw.webm"));
  fs.rmSync(vdir, { recursive: true, force: true });
}

await browser.close();
console.log("\nISSUES:", issues.length); for (const i of issues) console.log("  " + i);
console.log("FAILS:", fails.length); for (const f of fails) console.log("  ✗ " + f);
process.exit(fails.length || issues.length ? 1 : 0);
