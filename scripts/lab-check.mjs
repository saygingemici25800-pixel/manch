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

console.log("\n=== GEÇTİ ===");
ok.forEach((x) => console.log("  ✓ " + x));
if (bad.length) { console.log("\n=== KALDI ==="); bad.forEach((x) => console.log("  ✗ " + x)); }
const filtered = errs.filter((e) => !/CatchAll|negative time stamp|Download the React DevTools/.test(e));
console.log(`\nkonsol: ${filtered.length} hata/uyarı`);
filtered.slice(0, 8).forEach((e) => console.log("  ! " + e.slice(0, 160)));
console.log(`\nSONUÇ: ${ok.length}/${ok.length + bad.length}`);
await b.close();
process.exit(bad.length ? 1 : 0);
