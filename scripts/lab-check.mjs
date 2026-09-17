// Lab kabul testi (Faz 3 + Faz 4). Dev server gerektirir:  PORT=3200 pnpm dev
// Kullanım: node scripts/lab-check.mjs <çıktı-klasörü>   → png/webm + konsol raporu
import { chromium, webkit } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3200";
const OUT = process.argv[2] ?? "docs/screens";
fs.mkdirSync(OUT, { recursive: true });
const issues = [];
const fails = [];
const check = (name, ok, info = "") => { console.log(`${ok ? "✓" : "✗"} ${name}${info ? " — " + info : ""}`); if (!ok) fails.push(name); };
let expect404 = false; // bilinçli 404 navigasyonunda tarayıcının "Failed to load resource: 404" hatası beklenir
const attach = (page, tag) => {
  page.on("console", (m) => {
    if (!["error", "warning"].includes(m.type())) return;
    if (expect404 && /status of 404/.test(m.text())) return;
    // Next dev heuristiği: test akışı sayfayı anında sona kaydırdığı için herhangi bir görsel "LCP" sayılıyor;
    // gerçek fold-üstü görseller priority taşıyor (hero, ilk 3 kart, modal, kapaklar). Prod'da bu uyarı yok.
    if (m.type() === "warning" && /Largest Contentful Paint/.test(m.text())) return;
    issues.push(`[${tag}] console.${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => {
    // Next DEV araçlarının kendi ölçümü: catch-all 404 navigasyonunda performance.measure('CatchAll') negatif zaman damgası
    // (uygulama kodu değil; prod'da dev araçları yok). Kural 45 notu.
    if (/cannot have a negative time stamp/.test(e.message)) return;
    issues.push(`[${tag}] pageerror: ${e.message.slice(0, 300)}`);
  });
};
const stCount = async (page) => { await page.waitForSelector('[data-testid="st-count"]'); await page.waitForTimeout(600); return Number((await page.textContent('[data-testid="st-count"]')).match(/\d+/)[0]); };
const waitPreloader = async (page) => { await page.waitForSelector("[data-preloader]", { state: "detached", timeout: 15000 }).catch(() => {}); };

// BROWSER=webkit → Safari motoru (Faz 8 Kural 45); varsayılan chromium
const ENGINE = process.env.BROWSER === "webkit" ? webkit : chromium;
const IS_WEBKIT = process.env.BROWSER === "webkit";
const browser = await ENGINE.launch();
console.log(`engine: ${IS_WEBKIT ? "webkit" : "chromium"}`);

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
  // once:true trigger'lar tetiklenince kendini öldürür → sayı scroll'a bağlı düşebilir; leak = n0'ı AŞMASI
  check("10× locale round-trip: ST leak yok (≤ n0)", a.every((x) => x <= n0), a.join(" "));
  const b = [];
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="nav-home"]'); await page.waitForURL(/\/tr$/); await page.waitForTimeout(300);
    // ana sayfadaki lab linki sr-only → klavye ile
    await page.focus('[data-testid="nav-lab"]'); await page.keyboard.press("Enter"); await page.waitForURL(/\/tr\/lab/); b.push(await stCount(page));
  }
  check("10× home round-trip: ST leak yok (≤ n0)", b.every((x) => x <= n0), b.join(" "));
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
  // CookieBanner layout'ta mount edilmiyor (karar 2026-09-17) — component duruyor
  check("cookie banner mount edilmemiş", (await page.$('[data-testid="cookie-banner"]')) === null);
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
  // "Servis" 900 ms sonra geri alınır; kontrol o pencereyi kaçırabilir → geri alınmış hali de kabul
  check("title: Servis → sonra sayfa başlığı", afterTitle.includes("Servis") || !afterTitle.includes("Smash'leniyor"), `${titleBefore} → ${afterTitle}`);
  await page.waitForTimeout(1200);
  check("title geri geldi", !(await page.title()).includes("|"), await page.title());

  // Cart: lab'dan ekle, drawer aç, checkout disabled (WhatsApp TODO)
  await page.goto(`${BASE}/tr/lab`, { waitUntil: "networkidle" });
  await page.click('[data-testid="lab-add-cart"]'); await page.waitForTimeout(300);
  check("cart badge = 1", (await page.textContent('[data-testid="cart-count"]')).trim() === "1");
  await page.click('[data-testid="lab-add-cart"]'); await page.waitForTimeout(300);
  check("cart badge = 2 (qty birleşti)", (await page.textContent('[data-testid="cart-count"]')).trim() === "2");
  await page.click('[data-testid="lab-open-cart"]'); await page.waitForTimeout(700);
  const wa = await page.getAttribute('[data-testid="checkout"]', "href");
  check("drawer açık + WhatsApp checkout linki (wa.me/905054970748 + toplam)", !!wa && wa.includes("wa.me/905054970748") && decodeURIComponent(wa).includes("Toplam: 1140 TL"), wa ?? "yok");
  check("drawer: toplam 1140 TL (2× Classic 570)", (await page.textContent('[data-testid="cart-total"]')).includes("1140"));
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

// ===================== Faz 5: ana sayfa =====================
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { sessionStorage.setItem("manch-preloaded", "1"); localStorage.setItem("manch-cookie", "ok"); });
  const page = await ctx.newPage(); attach(page, "faz5");
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(600);
  for (const id of ["hits", "zone", "location"]) check(`#${id} var`, (await page.$(`#${id}`)) !== null);
  check("6 ürün kartı", (await page.$$('[data-testid="product-card"]')).length === 6);
  // Anchor: overlay → Zone (aynı sayfa hash → native)
  await page.click('[data-testid="menu-toggle"]'); await page.waitForTimeout(700);
  await page.click('#menu-overlay a[href$="#zone"]'); await page.waitForTimeout(1500);
  const zoneTop = await page.$eval("#zone", (el) => Math.round(el.getBoundingClientRect().top));
  check("overlay → #zone anchor", Math.abs(zoneTop) < 120, `top=${zoneTop}`);
  check("overlay kapandı", (await page.getAttribute("#menu-overlay", "data-state")) === "closed");
  // Anchor: lab'dan overlay → Konum (perde + hash)
  await page.goto(`${BASE}/tr/lab`, { waitUntil: "networkidle" }); await page.waitForTimeout(400);
  await page.click('[data-testid="menu-toggle"]'); await page.waitForTimeout(700);
  await page.click('#menu-overlay a[href$="#location"]');
  await page.waitForURL(/\/tr(#location)?$/, { timeout: 8000 });
  await page.waitForFunction(() => document.querySelector("[data-transition]")?.getAttribute("data-transition") === "idle", null, { timeout: 8000 });
  await page.waitForTimeout(1200);
  const locTop = await page.$eval("#location", (el) => Math.round(el.getBoundingClientRect().top));
  check("lab → perde → #location anchor", Math.abs(locTop) < 160, `top=${locTop}`);
  // Pinned anatomy — Kural 32: pin'li elemana değil section'a scrollIntoView (ST elemanı spacer sonuna taşımış olabilir)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => Math.round(scrollY) === 0 && !document.documentElement.classList.contains("lenis-scrolling"), null, { timeout: 8000 });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('[data-testid="anatomy"]').scrollIntoView({ behavior: "instant", block: "start" }));
  await page.waitForTimeout(500);
  const tops = [];
  await page.mouse.move(700, 450);
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 200); await page.waitForTimeout(250); tops.push(await page.$eval('[data-testid="anatomy"] .pin', (el) => Math.round(el.getBoundingClientRect().top))); }
  const f0 = await page.evaluate(() => window.__TICK?.()); await page.waitForTimeout(300); const f1 = await page.evaluate(() => window.__TICK?.());
  const pinDump = JSON.stringify(await page.evaluate(() => (window.__ST_DUMP?.() ?? []).filter((x) => x.pin))) + ` ticker:${f1 - f0}f/300ms scrollY:${await page.evaluate(() => Math.round(scrollY))}`;
  const pinned = tops.every((t) => Math.abs(t - tops[0]) <= 2);
  if (!pinned) {
    await page.evaluate(() => window.__ST_REFRESH?.()); await page.waitForTimeout(400);
    const afterRefresh = JSON.stringify(await page.evaluate(() => (window.__ST_DUMP?.() ?? []).filter((x) => x.pin)));
    const topAfter = await page.$eval('[data-testid="anatomy"] .pin', (el) => Math.round(el.getBoundingClientRect().top));
    console.log("  [diag] after refresh:", afterRefresh, "pinTop:", topAfter);
  }
  check("anatomy pinned (top sabit)", pinned, `${tops.join(" ")} pins=${pinDump}`);
  // Kart etkileşimleri
  await page.evaluate(() => document.querySelector("#hits").scrollIntoView({ behavior: "instant" })); await page.waitForTimeout(1200);
  check("kartlar görünür (batch giriş)", await page.$$eval('[data-testid="product-card"]', (els) => els.every((el) => Number(getComputedStyle(el).opacity) > 0.9)));
  await page.click('[data-testid="quick-toggle"] >> nth=0'); await page.waitForTimeout(300);
  check("quick details açılır", (await page.getAttribute('[data-testid="quick-toggle"] >> nth=0', "aria-expanded")) === "true");
  await page.evaluate(() => localStorage.removeItem("manch-cart")); await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector("#hits").scrollIntoView({ behavior: "instant" })); await page.waitForTimeout(800);
  await page.click('[data-testid="add-to-cart"] >> nth=1'); await page.waitForTimeout(400);
  check("kart + → sepet 1", (await page.textContent('[data-testid="cart-count"]')).trim() === "1");
  // Harita tıkla-yükle
  await page.evaluate(() => document.querySelector("#location").scrollIntoView({ behavior: "instant" })); await page.waitForTimeout(500);
  check("harita iframe yüklenmemiş", (await page.$('[data-testid="map-iframe"]')) === null);
  await page.click('[data-testid="map-load"]'); await page.waitForTimeout(500);
  check("harita tıklayınca iframe", (await page.$('[data-testid="map-iframe"]')) !== null);
  // ST sayısı: üst sınır + 3 reload'da sabit
  const home = [];
  for (let i = 0; i < 3; i++) { await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" }); await page.waitForTimeout(700); home.push(await page.evaluate(() => window.__ST_COUNT?.() ?? -1)); }
  check("ana sayfa ST sayısı sabit ve makul (<40)", home.every((x) => x === home[0] && x > 0 && x < 40), home.join(" "));
  // Tam sayfa screenshot (önce sona kadar kaydır → once trigger'lar)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "faz-5-desktop-full.png"), fullPage: true });
  await ctx.close();

  // mobil 375: section'lar + pin
  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await mctx.addInitScript(() => { sessionStorage.setItem("manch-preloaded", "1"); localStorage.setItem("manch-cookie", "ok"); });
  const mp = await mctx.newPage(); attach(mp, "faz5-mobile");
  await mp.goto(`${BASE}/tr`, { waitUntil: "networkidle", timeout: 120000 }); await mp.waitForTimeout(600);
  check("mobil: 6 kart", (await mp.$$('[data-testid="product-card"]')).length === 6);
  check("mobil: yatay taşma yok", await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await mp.evaluate(() => `${document.documentElement.scrollWidth}/${window.innerWidth}`));
  await mp.evaluate(() => document.querySelector('[data-testid="anatomy"]').scrollIntoView({ behavior: "instant", block: "start" })); await mp.waitForTimeout(500);
  const mtops = [];
  for (let i = 0; i < 5; i++) { await mp.evaluate(() => window.scrollBy(0, 160)); await mp.waitForTimeout(250); mtops.push(await mp.$eval('[data-testid="anatomy"] .pin', (el) => Math.round(el.getBoundingClientRect().top))); }
  check("mobil: anatomy pinned", mtops.every((t) => Math.abs(t - mtops[0]) <= 2), mtops.join(" "));
  await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await mp.waitForTimeout(1500);
  await mp.evaluate(() => window.scrollTo(0, 0)); await mp.waitForTimeout(800);
  await mp.screenshot({ path: path.join(OUT, "faz-5-mobile-full.png"), fullPage: true });
  await mctx.close();

  // video: hero'dan footer'a 6 s
  const vdir = path.join(OUT, "_video5");
  const vctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: vdir, size: { width: 1280, height: 800 } } });
  await vctx.addInitScript(() => { sessionStorage.setItem("manch-preloaded", "1"); localStorage.setItem("manch-cookie", "ok"); });
  const vp = await vctx.newPage();
  await vp.goto(`${BASE}/tr`, { waitUntil: "networkidle", timeout: 120000 }); await vp.waitForTimeout(800);
  await vp.mouse.move(640, 400);
  const total = await vp.evaluate(() => document.body.scrollHeight - innerHeight);
  const steps = 24;
  for (let i = 0; i < steps; i++) { await vp.mouse.wheel(0, total / steps); await vp.waitForTimeout(6000 / steps); }
  await vp.waitForTimeout(600);
  const video = vp.video(); await vctx.close();
  fs.renameSync(await video.path(), path.join(OUT, "faz-5-scroll.raw.webm")); fs.rmSync(vdir, { recursive: true, force: true });
}

// ===================== Faz 6: iç sayfalar =====================
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { sessionStorage.setItem("manch-preloaded", "1"); localStorage.setItem("manch-cookie", "ok"); });
  const page = await ctx.newPage(); attach(page, "faz6");
  // tüm iç linkler 200
  for (const path of ["/tr", "/tr/menu", "/tr/about", "/tr/contact", "/en", "/en/menu", "/en/about", "/en/contact"]) {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 120000 });
    check(`GET ${path} → 200`, res.status() === 200, String(res.status()));
  }
  expect404 = true;
  const nf = await page.goto(`${BASE}/tr/olmayan-sayfa`, { waitUntil: "networkidle" });
  expect404 = false;
  check("404 sayfası status 404", nf.status() === 404, String(nf.status()));
  check("404: Misu&Miyu + başlık", (await page.$('[data-testid="not-found"]')) !== null && (await page.textContent("h1")).includes("smash"));
  await page.screenshot({ path: path.join(OUT, "faz-6-404.png") });
  await page.click('[data-testid="nf-home"]'); await page.waitForURL(/\/tr$/, { timeout: 8000 });
  check("404 → ana sayfa (perde ile)", page.url().endsWith("/tr"));
  // /menu
  await page.goto(`${BASE}/tr/menu`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  check("menu: 25 ürün", (await page.$$('[data-testid="product-card"]')).length === 25);
  check("menu: 6 kategori bloğu", (await page.$$('[data-testid="menu-category"]')).length === 6);
  await page.click('[data-testid="filter-spicy"]'); await page.waitForTimeout(500);
  check("filtre spicy → 1 ürün", (await page.$$('[data-testid="product-card"]')).length === 1);
  await page.click('[data-testid="filter-spicy"]'); await page.waitForTimeout(500);
  check("filtre kapat → 25 ürün", (await page.$$('[data-testid="product-card"]')).length === 25);
  // sticky sekme bandı: scroll-down'da nav gizlenince top 0
  await page.mouse.move(700, 450); for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(80); } await page.waitForTimeout(700);
  check("sekme bandı sticky + nav gizli → top 0", await page.$eval('[data-testid="menu-tabs"]', (el) => { const r = el.getBoundingClientRect(); return el.dataset.navHidden === "true" && Math.abs(r.top) < 2; }));
  // modal + ?p=
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForFunction(() => !document.documentElement.classList.contains("lenis-scrolling"));
  await page.click('[data-testid="open-product"] >> nth=1'); await page.waitForTimeout(500);
  check("modal açık + ?p= URL", (await page.getAttribute('[data-testid="product-modal"]', "data-state")) === "open" && page.url().includes("?p=truffle-manch"), page.url());
  await page.click('[data-testid="modal-add"]'); await page.waitForTimeout(400);
  check("modal → sepete ekle", (await page.textContent('[data-testid="cart-count"]')) !== null);
  await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  check("ESC → modal kapalı + ?p yok", (await page.getAttribute('[data-testid="product-modal"]', "data-state")) === "closed" && !page.url().includes("?p="));
  await page.goto(`${BASE}/tr/menu?p=fig-jam`, { waitUntil: "networkidle" }); await page.waitForTimeout(700);
  check("derin link ?p=fig-jam → modal açık", (await page.getAttribute('[data-testid="product-modal"]', "data-state")) === "open" && (await page.textContent("#product-title")).includes("Fig Jam"));
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  // once batch girişleri tetiklensin: sona kadar kaydır, sonra başa
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
  check("menu: tüm kartlar görünür (batch giriş)", await page.$$eval('[data-testid="product-card"]', (els) => els.every((el) => Number(getComputedStyle(el).opacity) > 0.9)));
  await page.screenshot({ path: path.join(OUT, "faz-6-menu.png"), fullPage: true });
  // /about, /contact
  await page.goto(`${BASE}/tr/about`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  check("about: galeri 4 + timeline", (await page.$$('[data-testid="zone-gallery"] li')).length === 4 && (await page.$$('[data-testid="timeline"] li')).length === 4);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1200); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "faz-6-about.png"), fullPage: true });
  await page.goto(`${BASE}/tr/contact`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  check("contact: WhatsApp linki aktif", (await page.getAttribute('[data-testid="wa-button"]', "href") ?? "").includes("wa.me/905054970748"));
  await page.click('[data-testid="contact-info"]'); await page.waitForTimeout(500);
  check("contact: InfoModal açılır", (await page.getAttribute('[aria-labelledby="info-title"]', "data-state")) === "open");
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  // screenshot harita yüklenmeden (Google iframe headless'ta boş render eder)
  await page.screenshot({ path: path.join(OUT, "faz-6-contact.png"), fullPage: true });
  await page.click('[data-testid="map-load"]'); await page.waitForTimeout(500);
  check("contact: harita tıkla-yükle", (await page.$('[data-testid="map-iframe"]')) !== null);
  // nav BURGERS → /menu (perde)
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" }); await page.waitForTimeout(400);
  await page.click('[data-nav] a[href$="/menu"]'); await page.waitForURL(/\/tr\/menu$/, { timeout: 8000 });
  check("nav BURGERS → /menu", page.url().endsWith("/tr/menu"));
  await ctx.close();

  // mobil: sekme bandı + modal
  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await mctx.addInitScript(() => { sessionStorage.setItem("manch-preloaded", "1"); localStorage.setItem("manch-cookie", "ok"); });
  const mp = await mctx.newPage(); attach(mp, "faz6-mobile");
  await mp.goto(`${BASE}/tr/menu?p=fig-jam`, { waitUntil: "networkidle", timeout: 120000 }); await mp.waitForTimeout(700);
  check("mobil: derin link modal açık", (await mp.getAttribute('[data-testid="product-modal"]', "data-state")) === "open");
  check("mobil: modal viewport içinde", await mp.$eval('[data-testid="product-modal"]', (el) => { const r = el.getBoundingClientRect(); return r.width <= innerWidth && r.height <= innerHeight + 1; }));
  await mp.screenshot({ path: path.join(OUT, "faz-6-menu-modal-mobile.png") });
  await mp.keyboard.press("Escape"); await mp.waitForTimeout(400);
  check("mobil: sekme bandı sticky görünür", await mp.$eval('[data-testid="menu-tabs"]', (el) => getComputedStyle(el).position === "sticky"));
  await mctx.close();
}

// ===================== Faz 7: SEO + a11y =====================
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { sessionStorage.setItem("manch-preloaded", "1"); });
  const page = await ctx.newPage(); attach(page, "faz7");
  for (const [p, type] of [["/sitemap.xml", "xml"], ["/robots.txt", "text"], ["/manifest.webmanifest", "json"], ["/icon/32", "image/png"], ["/icon/512", "image/png"], ["/apple-icon", "image/png"], ["/tr/opengraph-image", "image/png"]]) {
    const res = await page.request.get(`${BASE}${p}`);
    check(`GET ${p} → 200 (${type})`, res.status() === 200 && (res.headers()["content-type"] ?? "").includes(type.includes("/") ? type : ""), `${res.status()} ${res.headers()["content-type"]}`);
  }
  const sm = await (await page.request.get(`${BASE}/sitemap.xml`)).text();
  check("sitemap: 8 url + hreflang", (sm.match(/<loc>/g) ?? []).length === 8 && sm.includes('hreflang="en"'));
  const rb = await (await page.request.get(`${BASE}/robots.txt`)).text();
  check("robots: lab disallow + sitemap", rb.includes("Disallow: /tr/lab") && rb.includes("sitemap.xml"));
  const og = await page.request.get(`${BASE}/tr/opengraph-image`);
  fs.writeFileSync(path.join(OUT, "faz-7-og.png"), await og.body());
  for (const p of ["/tr", "/en", "/tr/menu"]) {
    await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
    const head = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute("hreflang")).sort().join(","),
      og: document.querySelector('meta[property="og:image"]')?.getAttribute("content"),
      title: document.title,
      jsonld: !!document.querySelector('script[type="application/ld+json"]')?.textContent?.includes('"Restaurant"'),
      lang: document.documentElement.lang,
    }));
    check(`${p}: canonical + hreflang tr/en/x-default + og:image + JSON-LD`, !!head.canonical && head.hreflang === "en,tr,x-default" && !!head.og?.includes("opengraph-image") && head.jsonld, JSON.stringify(head));
  }
  check("title şablonu (/tr/menu → 'Menü | MANCH')", (await page.title()) === "Menü | MANCH", await page.title());
  // skip link + focus ring
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" });
  // Safari/WebKit: Tab yalnızca form kontrollerini dolaşır, linkler Option+Tab ile (Kural 45)
  await page.keyboard.press(IS_WEBKIT ? "Alt+Tab" : "Tab"); await page.waitForTimeout(200);
  check("skip link ilk Tab'da görünür", await page.evaluate(() => { const a = document.activeElement; return a?.getAttribute("href") === "#main" && a.getBoundingClientRect().width > 0; }));
  check("focus-visible mustard ring", await page.evaluate(() => getComputedStyle(document.activeElement).outlineColor.replace(/\s/g, "") === "rgb(246,195,67)"), await page.evaluate(() => getComputedStyle(document.activeElement).outlineColor));
  // [TODO] işaretleri görünüyor (placeholder içerik)
  await page.goto(`${BASE}/tr/contact`, { waitUntil: "networkidle" });
  check("[TODO] işareti yok (içerik commit'i)", !(await page.textContent("body")).includes("[TODO]"));
  // menü aktif sekme
  await page.goto(`${BASE}/tr/menu`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector("#cat-dessert").scrollIntoView({ behavior: "instant", block: "start" })); await page.waitForTimeout(800);
  check("menü aktif sekme = Tatlı", (await page.getAttribute('[data-testid="tab-dessert"]', "aria-current")) === "true");
  // ikon sayfası screenshot
  await page.setContent(`<html><body style="margin:0;display:flex;gap:32px;align-items:center;justify-content:center;background:#F4EEE6;height:200px;color:#7A1F4B">${["lettuce","tomato","cheddar","patty","pickle","brioche"].map((n) => `<img src="${BASE}/icons/${n}.svg" width="96" height="96" alt="${n}" style="filter: invert(17%) sepia(45%) saturate(2400%) hue-rotate(300deg)">`).join("")}</body></html>`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "faz-7-icons.png"), clip: { x: 0, y: 0, width: 1440, height: 200 } });
  await ctx.close();
}

// ===================== İçerik commit'i: screenshot =====================
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { sessionStorage.setItem("manch-preloaded", "1"); });
  const page = await ctx.newPage(); attach(page, "icerik");
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" }); await page.waitForTimeout(800);
  check("hero: gerçek fotoğraf + kesit burger", (await page.$$('img[src*="hero-cook"]')).length >= 1 && (await page.$$('img[src*="classic-manch"]')).length >= 1);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "icerik-home.png"), fullPage: true });
  await page.goto(`${BASE}/tr/menu`, { waitUntil: "networkidle" }); await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "icerik-menu.png"), fullPage: true });
  const og = await page.request.get(`${BASE}/tr/opengraph-image`);
  fs.writeFileSync(path.join(OUT, "icerik-og.png"), await og.body());
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
