// Faz 3 doğrulaması: motion primitive'leri, Kural 50 (fold), reduced-motion, cleanup/sızıntı.
// Kullanım: pnpm dev -p 3113 çalışırken → CHROME=<chromium yolu> node scripts/lab-check.mjs
// Kural 45: BROWSER=webkit ile ikinci koşu (Faz 8'de).
import { chromium } from "playwright-core";

const PORT = process.env.PORT ?? "3113";
const BASE = `http://localhost:${PORT}`;
const URL = `${BASE}/tr/lab`;
const b = await chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

const errs = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(m.type() + ": " + m.text()); });
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));

const ok = [], bad = [];
const t = (name, cond, extra = "") => (cond ? ok : bad).push(name + (extra ? ` — ${extra}` : ""));

await p.goto(URL, { waitUntil: "domcontentloaded" });
await p.waitForSelector("#motion");
await p.waitForTimeout(2500);

// --- 1 Lenis
const htmlCls = await p.evaluate(() => document.documentElement.className);
t("Lenis root sınıfı", /lenis/.test(htmlCls), htmlCls.split(" ").filter(c=>c.startsWith("lenis")).join(" ") || htmlCls.slice(0,40));

// --- 2 ticker çalışıyor
const tick1 = await p.evaluate(() => window.__TICK?.() ?? -1);
await p.waitForTimeout(700);
const tick2 = await p.evaluate(() => window.__TICK?.() ?? -1);
t("GSAP ticker ilerliyor", tick2 > tick1, `${tick1} → ${tick2}`);

// --- 3 KURAL 50: fold üstü SplitReveal görünür mü
const foldAbove = await p.evaluate(() => {
  const h = document.querySelector("#d-split-chars h3");
  const pEl = document.querySelector("#d-split-lines p");
  const vis = (el) => { const s = getComputedStyle(el); return { op: s.opacity, vis: s.visibility, h: el.getBoundingClientRect().height }; };
  return { chars: vis(h), lines: vis(pEl),
           charsSplit: !!h.querySelector("[class*=split]"), linesSplit: !!pEl.querySelector("[class*=split]") };
});
t("Kural 50 · fold üstü chars görünür", foldAbove.chars.op === "1" && foldAbove.chars.h > 0, JSON.stringify(foldAbove.chars));
t("Kural 50 · fold üstü lines görünür", foldAbove.lines.op === "1" && foldAbove.lines.h > 0, JSON.stringify(foldAbove.lines));
t("Kural 50 · fold üstünde split KURULMADI", !foldAbove.charsSplit && !foldAbove.linesSplit);

// --- 4 fold altı animasyonlu mu (scroll öncesi gizli olmalı)
await p.evaluate(() => {
  document.querySelector("#d-fold h3").scrollIntoView({ block: "center" });
});
await p.waitForTimeout(1600);
const belowAfter = await p.evaluate(() => {
  const el = document.querySelector("#d-fold h3");
  return { op: getComputedStyle(el).opacity, h: Math.round(el.getBoundingClientRect().height), split: !!el.querySelector("div") };
});
t("Kural 50 · fold altı split kuruldu ve göründü", belowAfter.op === "1" && belowAfter.h > 0, JSON.stringify(belowAfter));

// --- 5 ScrollTrigger sayısı
const st0 = await p.evaluate(() => window.__ST_COUNT?.() ?? -1);
t("ScrollTrigger kuruldu", st0 >= 1, `adet: ${st0}`);

// --- 6 CursorTrail
const cur = await p.evaluate(() => ({
  exists: !!document.querySelector("[data-testid=cursor-trail]"),
  fine: document.querySelector("[data-testid=fine-pointer]")?.textContent,
}));
t("CursorTrail masaüstünde render", cur.exists, `fine=${cur.fine}`);

// data-cursor-hide üstünde gizleniyor mu
// NOT: fold testi sayfayı kaydırdı → önce demoyu viewport'a getir, yoksa boundingBox
// viewport dışı koordinat döner ve mouse.move elemana isabet etmez (test hatası).
await p.locator("#d-cursor").scrollIntoViewIfNeeded();
await p.waitForTimeout(900);
const hideBox = await p.locator("#d-cursor [data-cursor-hide]").boundingBox();
await p.mouse.move(hideBox.x + hideBox.width / 2, hideBox.y - 40);
await p.waitForTimeout(400);
const trailBefore = await p.evaluate(() => getComputedStyle(document.querySelector("[data-testid=cursor-trail]")).opacity);
t("iz normalde görünür", Number(trailBefore) > 0.8, `opacity=${trailBefore}`);
await p.mouse.move(hideBox.x + hideBox.width / 2, hideBox.y + hideBox.height / 2);
await p.waitForTimeout(500);
const trailOp = await p.evaluate(() => getComputedStyle(document.querySelector("[data-testid=cursor-trail]")).opacity);
t("data-cursor-hide üstünde iz gizlendi", Number(trailOp) < 0.2, `opacity=${trailOp}`);

// --- 7 reduced motion: zorla AÇIK
await p.getByRole("button", { name: "Zorla AÇIK" }).click();
await p.waitForTimeout(1200);
const red = await p.evaluate(() => ({
  state: document.querySelector("[data-testid=reduced-state]")?.textContent,
  cursor: !!document.querySelector("[data-testid=cursor-trail]"),
  cursorActive: document.querySelector("[data-testid=cursor-active]")?.textContent,
  rollCopies: document.querySelectorAll("#d-rolltext span[aria-hidden=true]").length,
}));
t("reduced AÇIK", red.state === "AÇIK", red.state);
t("reduced · CursorTrail null render", !red.cursor, `cursorActive=${red.cursorActive}`);
t("reduced · RollText tek kopya", red.rollCopies === 0, `aria-hidden kopya: ${red.rollCopies}`);

// --- 8 geri al
await p.getByRole("button", { name: "Zorla KAPALI" }).click();
await p.waitForTimeout(1200);
const back = await p.evaluate(() => ({
  state: document.querySelector("[data-testid=reduced-state]")?.textContent,
  cursor: !!document.querySelector("[data-testid=cursor-trail]"),
  rollCopies: document.querySelectorAll("#d-rolltext span[aria-hidden=true]").length,
}));
t("reduced KAPALI · geri döndü", back.state === "KAPALI" && back.cursor && back.rollCopies === 1, JSON.stringify(back));

// --- 9 SIZINTI: lab ↔ ana sayfa ×6
const counts = [];
for (let i = 0; i < 6; i++) {
  await p.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(600);
  await p.goto(URL, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("#motion");
  await p.waitForTimeout(1400);
  counts.push(await p.evaluate(() => window.__ST_COUNT?.() ?? -1));
}
const stable = counts.every((c) => c === counts[0]);
t("cleanup · ST sayısı 6 gezinmede sabit", stable, `[${counts.join(", ")}]`);

// --- 10 demo blok sayısı
const demos = await p.evaluate(() => document.querySelectorAll("[data-demo]").length);
t("demo bloğu sayısı", demos === 11, `${demos} blok`);

// ============================ FAZ 4 — GLOBAL LAYOUT ============================
{
  // --- R1 Preloader: ilk ziyarette çıkar, ikincide çıkmaz (sessionStorage)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const q = await ctx.newPage();
  await q.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  const seenFirst = await q.locator("[data-preloader]").count();
  t("Preloader · ilk ziyarette görünür", seenFirst === 1, `adet=${seenFirst}`);
  await q.waitForTimeout(3200);
  const goneAfter = await q.locator("[data-preloader]").count();
  t("Preloader · süre sonunda kalkar", goneAfter === 0);

  // aynı oturumda ikinci ziyaret (sessionStorage aynı context'te paylaşılır)
  await q.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  await q.waitForTimeout(500);
  const second = await q.locator("[data-preloader]").count();
  t("Preloader · ikinci ziyarette ÇIKMAZ", second === 0, `adet=${second}`);
  const ss = await q.evaluate(() => sessionStorage.getItem("manch-preloaded"));
  t("Preloader · sessionStorage yazıldı", ss === "1", `manch-preloaded=${ss}`);

  // --- R4 Nav: scroll aşağı gizlenir, yukarı görünür
  // NOT: ana sayfa Faz 4'te henüz iskelet (yükseklik ≈ viewport) → scroll edilemiyor.
  // Nav testi uzun sayfada (/tr/lab) koşar. Faz 5'te ana sayfaya taşınabilir.
  await q.goto(URL, { waitUntil: "domcontentloaded" });
  await q.waitForSelector("#motion");
  await q.evaluate(() => window.scrollTo(0, 0));
  await q.waitForTimeout(800);
  const navTop0 = await q.evaluate(() => document.querySelector("header")?.getBoundingClientRect().top ?? 999);
  await q.mouse.wheel(0, 900);
  await q.waitForTimeout(1200);
  const navTop1 = await q.evaluate(() => document.querySelector("header")?.getBoundingClientRect().top ?? 999);
  await q.mouse.wheel(0, -400);
  await q.waitForTimeout(1200);
  const navTop2 = await q.evaluate(() => document.querySelector("header")?.getBoundingClientRect().top ?? 999);
  t("Nav · aşağı scroll'da gizlenir", navTop1 < navTop0, `${Math.round(navTop0)} → ${Math.round(navTop1)}`);
  t("Nav · yukarı scroll'da geri gelir", navTop2 > navTop1, `${Math.round(navTop1)} → ${Math.round(navTop2)}`);

  // --- R5 MenuOverlay: aç / ESC ile kapan
  await q.evaluate(() => window.scrollTo(0, 0));
  await q.waitForTimeout(600);
  await q.locator("header button").last().click();
  await q.waitForTimeout(900);
  const overlayOpen = await q.evaluate(() => {
    const d = document.querySelector("#menu-overlay");
    return { state: d?.getAttribute("data-state"), links: d?.querySelectorAll("a").length ?? 0,
             lock: document.documentElement.style.overflow };
  });
  t("MenuOverlay · açıldı + scroll kilidi", overlayOpen.state === "open" && overlayOpen.links >= 3 && overlayOpen.lock === "hidden", JSON.stringify(overlayOpen));
  await q.keyboard.press("Escape");
  await q.waitForTimeout(700);
  const lockAfter = await q.evaluate(() => document.documentElement.style.overflow);
  t("MenuOverlay · ESC kapatır + kilit kalkar", lockAfter !== "hidden", `overflow="${lockAfter}"`);

  // --- R12 Cart: ekle → toast → rozet → drawer → WhatsApp linki
  await q.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  await q.waitForTimeout(800);
  await q.evaluate(() => {
    const s = window.__CART__;
    s.getState().clear();
    s.getState().add("classic-manch", 2);
    s.getState().add("tiramisu", 1);
  });
  await q.waitForTimeout(900);
  const toast = await q.locator("[data-testid=cart-toast]").count();
  t("Cart · sepete ekleyince toast çıkar", toast === 1, `adet=${toast}`);
  const badge = await q.locator("[data-testid=cart-count]").first().textContent().catch(() => null);
  t("Cart · rozet sayısı 3", (badge ?? "").trim() === "3", `rozet="${badge}"`);

  await q.locator("[data-testid=cart-button]").click();
  await q.waitForTimeout(900);
  const drawer = await q.evaluate(() => {
    const d = document.querySelector("[data-testid=cart-drawer]");
    return { open: !!d, lines: document.querySelectorAll("[data-testid=cart-drawer] li").length,
             total: document.querySelector("[data-testid=cart-total]")?.textContent?.trim() };
  });
  t("Cart · drawer açıldı, 2 satır", drawer.open && drawer.lines === 2, JSON.stringify(drawer));
  // 2×570 + 1×360 = 1500 TL
  t("Cart · genel toplam 1500 TL", (drawer.total ?? "").includes("1500"), `toplam="${drawer.total}"`);

  const waHref = await q.locator("[data-testid=checkout]").getAttribute("href");
  const waOk = waHref && waHref.startsWith("https://wa.me/905054970748?text=");
  const waMsg = waHref ? decodeURIComponent(waHref.split("text=")[1] ?? "") : "";
  t("Cart · WhatsApp linki doğru numaraya", !!waOk, waHref?.slice(0, 46));
  t("Cart · mesajda ürün + adet + tutar var",
    /Classic Manch Burger/.test(waMsg) && /2/.test(waMsg) && /1500/.test(waMsg),
    waMsg.replace(/\n/g, " | ").slice(0, 110));

  // --- Cart persist (Kural 30): yeniden yükle, satırlar dursun
  await q.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  // CookieBanner 1.2 s gecikmeyle açılır → payla bekle (yoksa yarış)
  await q.waitForTimeout(2600);
  const persisted = await q.evaluate(() => window.__CART__.getState().lines.length);
  t("Cart · localStorage persist", persisted === 2, `satır=${persisted}`);

  // --- R16 CookieBanner + R17 InfoModal
  const cookie = await q.locator("[data-testid=cookie-banner]").count();
  t("CookieBanner · görünür", cookie === 1, `adet=${cookie}`);
  await q.evaluate(() => window.__UI__.getState().setInfoOpen(true));
  await q.waitForTimeout(700);
  const infoState = () => q.evaluate(() => document.querySelector("[aria-labelledby=info-title]")?.getAttribute("data-state"));
  t("InfoModal · açılır", (await infoState()) === "open");
  await q.keyboard.press("Escape");
  await q.waitForTimeout(600);
  t("InfoModal · ESC kapatır", (await infoState()) === "closed");

  // --- R18 Footer
  const footer = await q.evaluate(() => {
    const f = document.querySelector("footer");
    return { found: !!f, links: f?.querySelectorAll("a").length ?? 0, dark: f?.hasAttribute("data-nav-dark") };
  });
  t("Footer · render + linkler", footer.found && footer.links >= 4, JSON.stringify(footer));

  // --- R2/R3 PageTransition + dinamik title
  await q.evaluate(() => window.__UI__.getState().closeAll());
  await q.waitForTimeout(300);
  const titleBefore = await q.title();
  await q.evaluate(() => window.__TRANSITION__.getState().trigger(null));
  await q.waitForTimeout(500);
  const mid = await q.evaluate(() => ({
    phase: document.querySelector("[data-transition]")?.getAttribute("data-transition"),
    title: document.title,
  }));
  t("PageTransition · perde kapanıyor", ["cover", "covering", "covered"].includes(mid.phase ?? ""), `phase=${mid.phase}`);
  t("R3 · title 'Smash'leniyor' oldu", mid.title !== titleBefore && /\|/.test(mid.title), `"${mid.title}"`);
  await q.waitForTimeout(3000);
  const endPhase = await q.evaluate(() => document.querySelector("[data-transition]")?.getAttribute("data-transition"));
  t("PageTransition · idle'a döner", endPhase === "idle", `phase=${endPhase}`);

  await ctx.close();
}

console.log("\n=== GEÇTİ ===");
ok.forEach((x) => console.log("  ✓ " + x));
if (bad.length) { console.log("\n=== KALDI ==="); bad.forEach((x) => console.log("  ✗ " + x)); }
const filtered = errs.filter((e) => !/CatchAll|negative time stamp|Download the React DevTools/.test(e));
console.log(`\nkonsol: ${filtered.length} hata/uyarı`);
filtered.slice(0, 8).forEach((e) => console.log("  ! " + e.slice(0, 160)));
console.log(`\nSONUÇ: ${ok.length}/${ok.length + bad.length}`);
await b.close();
process.exit(bad.length ? 1 : 0);
