// Faz 7 · erişilebilirlik: GERÇEK klavye turu, focus ring, tab sırası, tuzak, kontrast.
//
// KURAL 60 — ilk yazımda 13 kontrol kırmızı yandı, **hepsi ölçüm hatasıydı**:
//   ① `el.focus()` programatiktir, `:focus-visible`i TETİKLEMEZ → halka "yok" görünüyordu.
//      Halka yalnız klavyeyle gelir; test de klavyeyle gezmeli (zaten istenen de bu).
//   ② Kontrast DOM'da ata zinciri gezilerek ölçülüyordu; "Sipariş Ver" BlobButton'ın **SVG
//      dolgusu** üstünde, nav pill'i de öyle — ata zinciri şeffaf görünüyor, ölçüm beyaz
//      zemin varsayıp 1.66:1 diyordu (gerçek: berry/cream 9.73:1). axe/Lighthouse bu yüzden
//      böyle öğeleri atlar. Buradaki kontrast kontrolü **token çiftleri** üzerinden analitik
//      yapılır (kesin); sayfa geneli axe'a (Lighthouse A11y) bırakılır — onu yeniden yazmak
//      daha kötü bir axe üretmekten başka bir şey olmaz.
//   ③ `[data-testid=menu-overlay]` diye bir şey yok; overlay `role=dialog aria-modal`.
//   ④ POV panosunda focus trap ARANIYORDU; spec (bölüm 10) trapı **perde** için istiyor,
//      pano için "odak içine taşınır, kapanınca GİR'e döner" diyor. Test spec'ten fazlasını
//      istiyordu.
//
// Kural 45: WebKit'te Tab yalnız form kontrollerini dolaşır → klavye turu chromium'da.
// Kullanım: BASE=http://localhost:3101 CHROME=<yol> node scripts/a11y-check.mjs
import { chromium } from "playwright-core";
import { hazir, durumBekle, kosul, varOl, yokOl, pencere } from "./_bekle.mjs";
import { colors } from "../src/styles/tokens.ts";

const BASE = process.env.BASE ?? "http://localhost:3101";
let pass = 0, fail = 0;
const ok = (c, l, e = "") => { if (c) { pass++; console.log(`  ✓ ${l}${e ? " — " + e : ""}`); } else { fail++; console.log(`  ✗ ${l}${e ? " — " + e : ""}`); } };

/* ---------------- 1 · kontrast: token çiftleri (analitik, kesin) ---------------- */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (rgb) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = rgb.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const [x, y] = [lum(hex(a)), lum(hex(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

console.log("— kontrast (token çiftleri, WCAG AA 4.5:1)");
/* MARKA KİTİ (2026-09-28): üç renk. `berry-dk` · `paper` · `pink` · `mustard` silindi.
   `tile` ile `sky` aynı maviye indi. */
const PAIRS = [
  ["metin berry / cream", colors.berry, colors.cream, 4.5],
  ["metin cream / berry (bordo üstü)", colors.cream, colors.berry, 4.5],
  ["metin berry / sky (mavi üstü)", colors.berry, colors.sky, 4.5],
  ["metin berry / tile (karo üstü)", colors.berry, colors.tile, 4.5],
  ["metin ink / cream", colors.ink, colors.cream, 4.5],
  ["metin ink / sky", colors.ink, colors.sky, 4.5],
  ["YAKINDA rozeti: ink / cream", colors.ink, colors.cream, 4.5],
  ["focus halkası krem / berry", colors.cream, colors.berry, 3],
  ["focus halkası bordo / sky", colors.berry, colors.sky, 3],
];
/* YASAK ÇİFTLER — bunların DÜŞMESİ gerekir. Olmasaydı "her şeye true dönen" bozuk bir
   kontrast fonksiyonu da yeşil verirdi (Kural 60 · 77-b: iddia düşebiliyor mu?). */
const YASAK = [
  ["mavi üstüne krem metin", colors.cream, colors.sky],
  ["bordo üstüne ink metin", colors.ink, colors.berry],
];
for (const [ad, fg, bg, esik] of PAIRS) {
  const r = cr(fg, bg);
  ok(r >= esik, `${ad}`, `${r.toFixed(2)}:1 (eşik ${esik})`);
}
for (const [ad, fg, bg] of YASAK) {
  const r = cr(fg, bg);
  ok(r < 4.5, `YASAK ÇİFT gerçekten düşüyor: ${ad}`, `${r.toFixed(2)}:1 (< 4.5 olmalı)`);
}

const br = await chromium.launch({ executablePath: process.env.CHROME });

/* ---------------- 2 · GERÇEK klavye turu: halka + sıra + tuzak yok ---------------- */
for (const path of ["/tr", "/tr/menu", "/tr/contact", "/en"]) {
  const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
  p.setDefaultTimeout(45000);
  await p.goto(`${BASE}${path}?nopreload=1`, { waitUntil: "domcontentloaded" });
  await hazir(p); // Kural 75: sabit 2400 ms yerine koşul

  const durak = [];
  for (let i = 0; i < 30; i++) {
    await p.keyboard.press("Tab");
    const s = await p.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const cs = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      return {
        ad: (a.getAttribute("aria-label") || a.textContent || a.tagName).trim().slice(0, 24),
        halka: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0,
        renk: cs.outlineColor,
        /* Halkanın ARKASINDAKİ gerçek zemin. Kit'te üç rengin hiçbiri her zeminde
           çalışmıyor, halka zemine göre seçiliyor (globals.css) — kontrast bu yüzden
           ZEMİN BAŞINA ölçülür. Eski kontrol yalnız "halka var mı" diyordu.

           ATA ZİNCİRİ YETMEZ: nav `fixed`, hero'nun üstünde durur ama ÇOCUĞU değildir;
           ata zinciri `body`'ye (krem) çıkar ve ölçüm "krem üstünde krem halka" der —
           oysa öğe koyu fotoğrafın üstünde. İlk yazımda tam bu oldu (Kural 60: ölçtüğün
           şey ürün mü, ölçüm aracı mı?). Doğrusu HIT-TEST: öğenin merkezinden aşağı
           bakıp YIĞINDA ondan sonra gelen ilk opak arka planı almak. */
        /* Halka NEREYE çiziliyor? `outline-offset` negatifse halka ÖĞENİN ÜSTÜNDE
           durur → kontrast öğenin KENDİ zeminiyle ölçülür. Pozitifse dışarıda
           durur → ARKADAKİ zeminle. İkisini ayırmadan ölçmek, doğru kurulmuş bir
           halkayı yanlış yerde arar (Kural 60). */
        iceride: parseFloat(cs.outlineOffset) < 0,
        kendiZemin: (() => {
          let e = a;
          while (e) {
            const bg = getComputedStyle(e).backgroundColor;
            const m = bg.match(/\d+(\.\d+)?/g);
            if (m && (m.length < 4 || Number(m[3]) > 0.5)) return bg;
            e = e.parentElement;
          }
          return "rgb(255, 255, 255)";
        })(),
        zemin: (() => {
          const r0 = a.getBoundingClientRect();
          const cx = Math.round(r0.left + r0.width / 2);
          const cy = Math.round(r0.top + r0.height / 2);
          const yigin = document.elementsFromPoint(cx, cy);
          const bastan = yigin.indexOf(a);
          for (const e of yigin.slice(bastan + 1)) {
            const bg = getComputedStyle(e).backgroundColor;
            const m = bg.match(/\d+(\.\d+)?/g);
            if (m && (m.length < 4 || Number(m[3]) > 0.5)) return bg;
          }
          // yığın bir şey vermezse ata zincirine düş
          let e = a.parentElement;
          while (e) {
            const bg = getComputedStyle(e).backgroundColor;
            const m = bg.match(/\d+(\.\d+)?/g);
            if (m && (m.length < 4 || Number(m[3]) > 0.5)) return bg;
            e = e.parentElement;
          }
          return "rgb(255, 255, 255)";
        })(),
        gorunur: r.width > 0 && r.height > 0,
        yol: a.tagName + (a.getAttribute("data-testid") ? `[${a.getAttribute("data-testid")}]` : ""),
      };
    });
    if (s) durak.push(s);
  }
  const halkasiz = durak.filter((d) => !d.halka && d.gorunur);
  ok(durak.length >= 10, `${path} klavye turu ${durak.length} durak`);
  ok(halkasiz.length === 0, `${path} her durakta focus ring GÖRÜNÜR`, halkasiz.slice(0, 3).map((d) => d.ad).join(" | "));
  /* YENİ (2026-09-28): halka VAR yetmez, zemininde OKUNUYOR mu? */
  const rgbCr = (a1, b1) => {
    const n = (v) => v.match(/\d+/g).slice(0, 3).map(Number);
    const L = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
      const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const [x, y] = [L(n(a1)), L(n(b1))].sort((m, n2) => n2 - m);
    return (x + 0.05) / (y + 0.05);
  };
  const hedef = (d) => (d.iceride ? d.kendiZemin : d.zemin);
  const soluk = durak.filter((d) => d.gorunur && d.halka && rgbCr(d.renk, hedef(d)) < 3);
  ok(soluk.length === 0, `${path} focus ring ZEMİNİNDE okunuyor (≥ 3:1)`,
    soluk.slice(0, 3).map((d) => `${d.ad}: halka ${d.renk} / ${d.iceride ? "kendi zemini" : "arka zemin"} ${hedef(d)} = ${rgbCr(d.renk, hedef(d)).toFixed(2)}`).join(" | ") || `${durak.filter((d) => d.halka).length} durak ölçüldü`);
  const ilkUc = durak.slice(0, 3).map((d) => d.ad).join(" → ");
  ok(/atla|skip/i.test(durak[0]?.ad ?? ""), `${path} ilk durak skip link`, ilkUc);
  await p.close();
}

/* ---------------- 3 · diyaloglar: aç → Esc → kapandı mı ---------------- */
{
  const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
  p.setDefaultTimeout(45000);
  const DIALOG_OPEN = "[role=dialog][data-state=open]";
  await p.goto(`${BASE}/tr?nopreload=1`, { waitUntil: "domcontentloaded" });
  await hazir(p); // Kural 75: sabit 2500 ms yerine koşul

  /* Diyaloglar kapalıyken de DOM'da durur (geçiş animasyonu) — "kapandı mı" sorusu
     ELEMAN SAYISIYLA sorulamaz, `data-state` ile sorulur. İlk yazımda sayıya bakıyordum
     ve hep 3 buluyordum; "Esc kapatmıyor" sanılan şey buydu (Kural 60). */
  const durum = (sel) => p.getAttribute(sel, "data-state");

  // menü overlay
  await p.locator("[data-testid=menu-toggle]").click();
  await kosul(p, () => document.querySelectorAll("[role=dialog][data-state=open]").length >= 1);
  ok((await p.locator(`${DIALOG_OPEN}`).count()) >= 1, "menü overlay açıldı (role=dialog aria-modal)");
  /* Tab turundan önce ODAK'ın içeri taşınmasını bekle: `data-state=open` açılışın
     BAŞINDA yazılıyor, odak tuzağı ise kurulum bitince devreye giriyor. Erken başlayan
     Tab'lar perdenin dışına kaçıyordu (ilk çevrimde bu yüzden kırmızı yandı). */
  await kosul(p, () => !!document.querySelector("[role=dialog][data-state=open]")?.contains(document.activeElement));
  for (let i = 0; i < 14; i++) await p.keyboard.press("Tab");
  ok(await p.evaluate((d) => !!document.querySelector(d)?.contains(document.activeElement), DIALOG_OPEN),
    "menü overlay focus trap (14 Tab sonrası içeride)");
  await p.keyboard.press("Escape");
  await kosul(p, () => document.querySelectorAll("[role=dialog][data-state=open]").length === 0);
  ok((await p.locator(DIALOG_OPEN).count()) === 0, "menü overlay Esc ile kapandı");

  // sepet drawer
  await p.locator("[data-testid=cart-button]").click();
  await durumBekle(p, "[data-testid=cart-drawer]", "open");
  ok((await durum("[data-testid=cart-drawer]")) === "open", "sepet drawer açıldı");
  await p.keyboard.press("Escape");
  await durumBekle(p, "[data-testid=cart-drawer]", "closed");
  ok((await durum("[data-testid=cart-drawer]")) === "closed", "sepet drawer Esc ile kapandı");

  /* KAPALI diyalogların klavyeye kapalı olması — Faz 7'de bulunan gerçek kusur:
     kapalı sepet çekmecesine ve InfoModal'a Tab ile giriliyordu, odak ekran dışına
     düşüyordu. `inert` ile kapatıldı; bekçi burada. */
  await p.goto(`${BASE}/tr?nopreload=1`, { waitUntil: "domcontentloaded" });
  await hazir(p); // Kural 75: sabit 2200 ms yerine koşul
  const kacak = [];
  for (let i = 0; i < 60; i++) {
    await p.keyboard.press("Tab");
    const r = await p.evaluate(() => {
      const a = document.activeElement;
      const d = a?.closest?.("[role=dialog]");
      return d && d.getAttribute("data-state") !== "open"
        ? `${d.getAttribute("data-testid") || d.getAttribute("aria-label")}:${(a.textContent || "").trim().slice(0, 18)}`
        : null;
    });
    if (r) kacak.push(r);
  }
  ok(kacak.length === 0, "KAPALI diyaloglara Tab ile girilmiyor (inert)", [...new Set(kacak)].slice(0, 3).join(" | "));
  const inertDurum = await p.evaluate(() => [...document.querySelectorAll("[role=dialog]")]
    .filter((d) => d.getAttribute("data-state") !== "open")
    .every((d) => d.hasAttribute("inert") && !d.hasAttribute("aria-modal")));
  ok(inertDurum, "kapalı diyaloglar inert + aria-modal taşımıyor");
  await p.close();
}

/* ---------------- 4 · Zone: sr-only hedefler, perde trapı, POV odağı ---------------- */
{
  const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
  p.setDefaultTimeout(60000);
  await p.goto(`${BASE}/tr?nopreload=1`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("[data-testid=zone-gate]");
  await hazir(p); // Kural 75: sabit 1500 ms yerine koşul

  const sr = await p.evaluate(() => {
    const nav = [...document.querySelectorAll("nav")].find((n) => n.className.includes("sr-only"));
    if (!nav) return null;
    const r = nav.getBoundingClientRect();
    return { n: nav.querySelectorAll("a").length, hrefs: [...nav.querySelectorAll("a")].map((a) => a.getAttribute("href")), w: Math.round(r.width) };
  });
  ok(sr?.n === 4, "Zone sr-only: 4 hedef link (spec 10)", sr?.hrefs?.join(" "));
  ok((sr?.w ?? 99) <= 1, "Zone sr-only görsel olarak gizli", `${sr?.w}px`);

  await p.locator("[data-testid=zone-gate]").click();
  await p.waitForSelector("[data-testid=zone-pick-misu]");
  await kosul(p, () => document.activeElement !== document.body);
  // perde trapı (spec 10: perde role=dialog + aria-modal + focus trap)
  for (let i = 0; i < 12; i++) await p.keyboard.press("Tab");
  ok(await p.evaluate(() => !!document.querySelector("[data-testid=zone-curtain]")?.contains(document.activeElement)),
    "Zone perdesi focus trap (12 Tab sonrası içeride)");
  // seçim düğmesinde halka — klavyeyle gelindiği için :focus-visible aktif
  const secim = await p.evaluate(() => {
    const b = document.querySelector("[data-testid=zone-pick-misu]"); b.focus();
    const cs = getComputedStyle(b);
    return { ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0, kural: getComputedStyle(b, ":focus-visible").outlineWidth };
  });
  ok(secim.ring || parseFloat(secim.kural) > 0, "karakter seçiminde focus ring kuralı var", JSON.stringify(secim));

  await p.locator("[data-testid=zone-pick-misu]").click();
  await p.waitForSelector("[data-testid=zone-curtain][data-state=zone]", { timeout: 60000 });
  await kosul(p, () => window.__ZONE_STATS__?.().canvases === 1, null, 30000);
  // ÖLÇÜM PENCERESİ: tuşu ms kadar basılı tutmak "koşul bekleme" değil, girdi süresidir.
  const tap = async (k, ms) => { await p.keyboard.down(k); await pencere(p, ms); await p.keyboard.up(k); };
  for (let i = 0; i < 16 && !(await p.locator("[data-testid=frame-enter]").count()); i++) await tap("a", 180);
  for (let i = 0; i < 22 && !(await p.locator("[data-testid=frame-enter]").count()); i++) await tap("w", 180);
  ok((await p.locator("[data-testid=frame-enter]").count()) > 0, "halkada GİR düğmesi göründü");

  /* `getComputedStyle(el, ":focus-visible")` ÇALIŞMAZ — o bir pseudo-SINIF, ikinci argüman
     yalnız pseudo-ELEMENT alır (::before gibi). Halka yalnız klavyeyle gelir: Tab ile
     düğmeye gidip ölçüyoruz — ürünün gerçek yolu zaten bu. */
  const gir = await p.evaluate(async () => {
    const b = document.querySelector("[data-testid=frame-enter]");
    b.focus();
    return null;
  });
  void gir;
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Tab");
  const girHalka = await p.evaluate(() => {
    const a = document.activeElement;
    const cs = getComputedStyle(a);
    return { odak: a?.getAttribute("data-testid"), ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0, renk: cs.outlineColor };
  });
  ok(girHalka.ring, "Zone GİR düğmesinde focus ring GÖRÜNÜR (spec 10)", JSON.stringify(girHalka));

  await p.keyboard.press("e");
  await p.waitForSelector("[data-testid=frame-board]", { timeout: 20000 }).catch(() => {});
  await varOl(p, "[data-testid=frame-board]");
  // odak panoya TAŞINANA kadar bekle (asıl iddia bir alttaki ok(...))
  await kosul(p, () => !!document.querySelector("[data-testid=frame-board]")?.contains(document.activeElement));
  ok((await p.locator("[data-testid=frame-board]").count()) === 1, "POV panosu açıldı");
  ok(await p.evaluate(() => !!document.querySelector("[data-testid=frame-board]")?.contains(document.activeElement)),
    "POV panosu açılınca odak İÇİNE taşındı (spec 10)");
  await p.keyboard.press("Escape");
  await yokOl(p, "[data-testid=frame-board]");
  ok((await p.locator("[data-testid=frame-board]").count()) === 0, "POV panosu Esc ile kapandı");
  /* Odak, pano DOM'dan çıktığı KARE'de dönmüyor: `drei/<Html>` portalı yüzünden buton
     birkaç kare sonra doğuyor ve odak `requestAnimationFrame` döngüsüyle veriliyor
     (5.5.6 hata günlüğü). Panoyu beklemek yetmez — ODAĞIN KENDİSİ beklenir. Tavanlı,
     yani odak hiç dönmezse bekleme biter ve aşağıdaki iddia yine düşer. */
  await kosul(p, () => document.activeElement?.getAttribute("data-testid") === "frame-enter");
  const geri = await p.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  ok(geri === "frame-enter", "kapanınca odak GİR butonuna döndü (spec 10)", `odak=${geri}`);
  await p.close();
}

await br.close();
console.log(`\n${pass}/${pass + fail} ${fail ? "✗" : "✓"}`);
process.exit(fail ? 1 : 0);
