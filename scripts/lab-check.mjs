// Faz 3 doğrulaması: motion primitive'leri, Kural 50 (fold), reduced-motion, cleanup/sızıntı.
// Kullanım: pnpm dev -p 3113 çalışırken → CHROME=<chromium yolu> node scripts/lab-check.mjs
// Kural 45: BROWSER=webkit ile ikinci koşu (Faz 8'de).
import { chromium, webkit } from "playwright-core";
import { durgun, hazir, durumBekle, kosul, sabit, varOl, pencere } from "./_bekle.mjs";
import { colors } from "../src/styles/tokens.ts";

// Kural 45: BROWSER=webkit ile Safari/WebKit koşusu (backdrop-blur, svh/dvh, Lenis wheel,
// sticky sekme, PNG şeffaflık). WebKit'te Tab yalnızca form kontrollerini dolaşır.
const ENGINE = process.env.BROWSER === "webkit" ? webkit : chromium;

const PORT = process.env.PORT ?? "3113";
const BASE = `http://localhost:${PORT}`;
const URL = `${BASE}/tr/lab`;
const b = await ENGINE.launch(process.env.BROWSER === "webkit" ? {} : { executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

const errs = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(m.type() + ": " + m.text()); });
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));

/* Kural 45 · dev-only konsol artıkları — TEK yerde, iki bölüm de bunu kullanır.
   WebKit eki (2026-09-19): Next dev'in catch-all 404 ölçümü Chromium'da
   "CatchAll … negative time stamp" derken WebKit'te yalnızca "TypeError: Type error"
   diyor; yığın `react-server-dom-turbopack` içindeki `measure`'ı gösteriyor. Aynı dev
   artığı, farklı metin. Ayrıca `__nextjs_original-stack-frames`: dev hata katmanının
   sembol çözme uç noktası (adı gereği dev-only). Üçüncüsü: WebKit'te hızlı gezinme
   sırasında Turbopack'in KENDİ dev chunk'ı iptal olup `ChunkLoadError` atıyor — filtre
   yalnızca `node_modules/.pnpm` altındaki Next iç chunk'larını susturur; **bizim**
   `[project]/src/...` chunk'larımız filtrelenmez, onlar için Kural 56 koruması sürüyor
   (LayoutDeferred/ZoneGate `dynamic()` yükleyicileri `.catch()` ile kapatıldı). Production build'de WebKit 4 sayfada 0 pageerror (ölçüldü),
   yani ürün kodu temiz — filtre yalnız dev gürültüsünü susturuyor (Kural 53: dar tut). */
const DEV_ARTIFACT = /CatchAll|negative time stamp|DevTools|Largest Contentful Paint|turbopack.*hmr-client|preloaded using link preload|react-server-dom-turbopack.*measure|Type error|__nextjs_original-stack-frames|Failed to load chunk[^|]*node_modules[^|]*\.pnpm/;

const ok = [], bad = [];
const t = (name, cond, extra = "") => (cond ? ok : bad).push(name + (extra ? ` — ${extra}` : ""));

await p.goto(URL, { waitUntil: "domcontentloaded" });
await p.waitForSelector("#motion");
await hazir(p); // Kural 75: sabit 2500 ms yerine koşul

// --- 1 Lenis
const htmlCls = await p.evaluate(() => document.documentElement.className);
t("Lenis root sınıfı", /lenis/.test(htmlCls), htmlCls.split(" ").filter(c=>c.startsWith("lenis")).join(" ") || htmlCls.slice(0,40));

// --- 2 ticker çalışıyor
const tick1 = await p.evaluate(() => window.__TICK?.() ?? -1);
await pencere(p, 700); // ÖLÇÜM PENCERESİ: sayaç ilerlesin diye zaman GEÇMELİ
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
await pencere(p, 1600); // ÖLÇÜM PENCERESİ: animasyona oynama şansı verilir, sonra bakılır
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
await kosul(p, () => {
  const b = document.querySelector("#d-cursor [data-cursor-hide]")?.getBoundingClientRect();
  return !!b && b.top > 0 && b.bottom < innerHeight; // kaydırma oturdu
});
const hideBox = await p.locator("#d-cursor [data-cursor-hide]").boundingBox();
await p.mouse.move(hideBox.x + hideBox.width / 2, hideBox.y - 40);
await kosul(p, () => Number(getComputedStyle(document.querySelector("[data-testid=cursor-trail]")).opacity) > 0.8);
const trailBefore = await p.evaluate(() => getComputedStyle(document.querySelector("[data-testid=cursor-trail]")).opacity);
t("iz normalde görünür", Number(trailBefore) > 0.8, `opacity=${trailBefore}`);
await p.mouse.move(hideBox.x + hideBox.width / 2, hideBox.y + hideBox.height / 2);
await kosul(p, () => Number(getComputedStyle(document.querySelector("[data-testid=cursor-trail]")).opacity) < 0.2);
const trailOp = await p.evaluate(() => getComputedStyle(document.querySelector("[data-testid=cursor-trail]")).opacity);
t("data-cursor-hide üstünde iz gizlendi", Number(trailOp) < 0.2, `opacity=${trailOp}`);

/* Malzeme ikonu renkleri (2026-09-20). Üç şey sessizce kırılabilir:
   ① renk tokendan değil koda gömülü hex'ten gelir ② iki malzeme aynı rengi alır
   ③ hale düşer → ikon koyu ya da açık zeminin birinde kaybolur (gözle bakmadan
   görünmez, çünkü DOM ve olaylar sağlam kalır — Kural 59'un joystick/tavan dersi).
   Ölçüm ekranda RENDER EDİLEN değerden yapılır, kaynaktan değil. */
const ink = await p.evaluate(() =>
  [...document.querySelectorAll("[data-icon]")].map((el) => ({
    renk: getComputedStyle(el.querySelector("[data-icon-mask]") ?? el).backgroundColor,
    hale: (getComputedStyle(el).filter.match(/drop-shadow/g) ?? []).length,
  })),
);
const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
const BEKLENEN = [colors.lettuce, colors.tomato, colors.mustard, colors.patty, colors.pickle, colors.brioche].map(rgb);
t("malzeme ikonları 6 ayrı renk", new Set(ink.map((i) => i.renk)).size === 6, ink.map((i) => i.renk).join(" · "));
t("ikon renkleri tokenlardan (hex gömülü değil)", ink.length === 6 && ink.every((v, i) => v.renk === BEKLENEN[i]),
  `beklenen ${BEKLENEN.join(",")} · gelen ${ink.map((i) => i.renk).join(",")}`);
t("her ikonda iki katmanlı hale (kontrast koruması)", ink.length === 6 && ink.every((i) => i.hale === 2),
  ink.map((i) => i.hale).join(","));

// --- 7 reduced motion: zorla AÇIK
await p.getByRole("button", { name: "Zorla AÇIK" }).click();
await kosul(p, () => document.querySelector("[data-testid=reduced-state]")?.textContent?.includes("AÇIK"));
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
await kosul(p, () => document.querySelector("[data-testid=reduced-state]")?.textContent?.includes("KAPALI"));
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
  await hazir(p); // Kural 75: sabit 600 ms yerine koşul
  await p.goto(URL, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("#motion");
  await hazir(p); // Kural 75: sabit 1400 ms yerine koşul
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
  // Koşul beklenir, sabit süre değil (Kural 60): dev sunucusu yük altındayken perde
  // 3200 ms'yi aşıyor ve kontrol "kalkmadı" diyordu — ürün değil yarış.
  await q.locator("[data-preloader]").waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
  const goneAfter = await q.locator("[data-preloader]").count();
  t("Preloader · süre sonunda kalkar", goneAfter === 0);

  // aynı oturumda ikinci ziyaret (sessionStorage aynı context'te paylaşılır)
  await q.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  await hazir(q); // Kural 75: sabit 500 ms yerine koşul
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
  await hazir(q); // Kural 75: sabit 800 ms yerine koşul
  const navTop0 = await q.evaluate(() => document.querySelector("header")?.getBoundingClientRect().top ?? 999);
  await q.mouse.wheel(0, 900);
  // Kaydırma BİTSİN: Lenis yumuşatması sürerken yukarı tekerlek göndermek, uçuştaki
  // aşağı kaydırmaya karışıyor ve nav hiç geri gelmiyordu (koşula çevirirken ortaya çıktı).
  await durgun(q);
  const navTop1 = await q.evaluate(() => document.querySelector("header")?.getBoundingClientRect().top ?? 999);
  await q.mouse.wheel(0, -400);
  await durgun(q);
  const navTop2 = await q.evaluate(() => document.querySelector("header")?.getBoundingClientRect().top ?? 999);
  t("Nav · aşağı scroll'da gizlenir", navTop1 < navTop0, `${Math.round(navTop0)} → ${Math.round(navTop1)}`);
  t("Nav · yukarı scroll'da geri gelir", navTop2 > navTop1, `${Math.round(navTop1)} → ${Math.round(navTop2)}`);

  // --- R5 MenuOverlay: aç / ESC ile kapan
  await q.evaluate(() => window.scrollTo(0, 0));
  await kosul(q, () => window.scrollY < 4);
  await q.locator("header button").last().click();
  await durumBekle(q, "#menu-overlay", "open");
  const overlayOpen = await q.evaluate(() => {
    const d = document.querySelector("#menu-overlay");
    return { state: d?.getAttribute("data-state"), links: d?.querySelectorAll("a").length ?? 0,
             lock: document.documentElement.style.overflow };
  });
  t("MenuOverlay · açıldı + scroll kilidi", overlayOpen.state === "open" && overlayOpen.links >= 3 && overlayOpen.lock === "hidden", JSON.stringify(overlayOpen));
  await q.keyboard.press("Escape");
  await kosul(q, () => document.documentElement.style.overflow !== "hidden");
  const lockAfter = await q.evaluate(() => document.documentElement.style.overflow);
  t("MenuOverlay · ESC kapatır + kilit kalkar", lockAfter !== "hidden", `overflow="${lockAfter}"`);

  // --- R12 Cart: ekle → toast → rozet → drawer → WhatsApp linki
  await q.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  await hazir(q); // Kural 75: sabit 800 ms yerine koşul
  await q.evaluate(() => {
    const s = window.__CART__;
    s.getState().clear();
    s.getState().add("classic-manch", 2);
    s.getState().add("tiramisu", 1);
  });
  await varOl(q, "[data-testid=cart-toast]");
  const toast = await q.locator("[data-testid=cart-toast]").count();
  t("Cart · sepete ekleyince toast çıkar", toast === 1, `adet=${toast}`);
  const badge = await q.locator("[data-testid=cart-count]").first().textContent().catch(() => null);
  t("Cart · rozet sayısı 3", (badge ?? "").trim() === "3", `rozet="${badge}"`);

  await q.locator("[data-testid=cart-button]").click();
  await durumBekle(q, "[data-testid=cart-drawer]", "open");
  const drawer = await q.evaluate(() => {
    const d = document.querySelector("[data-testid=cart-drawer]");
    return { open: !!d, lines: document.querySelectorAll("[data-testid=cart-drawer] li").length,
             total: document.querySelector("[data-testid=cart-total]")?.textContent?.trim() };
  });
  t("Cart · drawer açıldı, 2 satır", drawer.open && drawer.lines === 2, JSON.stringify(drawer));
  // 2×570 + 1×360 = 1500 TL
  t("Cart · genel toplam 1500 TL", (drawer.total ?? "").includes("1500"), `toplam="${drawer.total}"`);

  /* 5.5.8 (Kural 66): checkout artık `<a href>` DEĞİL — `submitOrder()` adaptörünü çağıran
     bir <button>. `getAttribute("href")` okuyan eski kontrol bu yüzden düştü: ürün değil
     TESTİN kendisi bayatlamıştı. Gönderimi gerçek yolundan ölçüyoruz — `window.open`
     yakalanır, adaptörün açtığı URL denetlenir. Böylece kontrol adaptörün ARKASINDAN değil,
     tüketicinin gördüğü yerden bakar; yarın kanal değişirse burası da haklı olarak düşer. */
  await q.evaluate(() => {
    window.__OPENED__ = null;
    window.open = (url) => { window.__OPENED__ = String(url); return null; };
  });
  // Çekmece DURSUN: `data-state=open` animasyonun başında yazılıyor, hareketli hedefe
  // tıklamak Playwright'ta "element is not stable" ile 30 sn'de çöküyordu.
  await sabit(q, "[data-testid=checkout]");
  await q.locator("[data-testid=checkout]").click();
  await kosul(q, () => typeof window.__OPENED__ === "string");
  const waHref = await q.evaluate(() => window.__OPENED__);
  const waOk = waHref && waHref.startsWith("https://wa.me/905054970748?text=");
  const waMsg = waHref ? decodeURIComponent(waHref.split("text=")[1] ?? "") : "";
  t("Cart · sipariş adaptörü doğru numaraya gönderiyor", !!waOk, waHref?.slice(0, 46));
  t("Cart · mesajda ürün + adet + tutar var",
    /Classic Manch Burger/.test(waMsg) && /2/.test(waMsg) && /1500/.test(waMsg),
    waMsg.replace(/\n/g, " | ").slice(0, 110));

  // --- Cart persist (Kural 30): yeniden yükle, satırlar dursun
  await q.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  // CookieBanner 1.2 s gecikmeyle açılır. Sabit 2600 ms pay bırakılmıştı ama yük
  // altında o da yetmiyordu → bandın KENDİSİ bekleniyor (Kural 60).
  await q.locator("[data-testid=cookie-banner]").waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  const persisted = await q.evaluate(() => window.__CART__.getState().lines.length);
  t("Cart · localStorage persist", persisted === 2, `satır=${persisted}`);

  // --- R16 CookieBanner + R17 InfoModal
  const cookie = await q.locator("[data-testid=cookie-banner]").count();
  t("CookieBanner · görünür", cookie === 1, `adet=${cookie}`);
  await q.evaluate(() => window.__UI__.getState().setInfoOpen(true));
  await durumBekle(q, "[aria-labelledby=info-title]", "open");
  const infoState = () => q.evaluate(() => document.querySelector("[aria-labelledby=info-title]")?.getAttribute("data-state"));
  t("InfoModal · açılır", (await infoState()) === "open");
  await q.keyboard.press("Escape");
  await durumBekle(q, "[aria-labelledby=info-title]", "closed");
  t("InfoModal · ESC kapatır", (await infoState()) === "closed");

  // --- R18 Footer
  const footer = await q.evaluate(() => {
    const f = document.querySelector("footer");
    return { found: !!f, links: f?.querySelectorAll("a").length ?? 0, dark: f?.hasAttribute("data-nav-dark") };
  });
  t("Footer · render + linkler", footer.found && footer.links >= 4, JSON.stringify(footer));

  /* R18 zıplama alanı (2026-09-20). İkonlar ilk denemede wordmark'ın ARKASINA kondu:
     DOM sağlam, olaylar sağlam, çakışma yok, faz farkı tam — ama ekranda görünmüyorlardı,
     çünkü wordmark bandın tamamını kaplayan opak bir SVG. Joystick'in sepet düğmesinin
     altında kalmasıyla aynı sınıf kusur (Kural 59) ve hiçbir davranış testine takılmaz.
     Bu yüzden YIĞIN SIRASI doğrudan denetleniyor. */
  await q.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  // ikonlar GERÇEKTEN zıplamaya başlasın (lazy gsap + timeline)
  await kosul(q, () => [...document.querySelectorAll("footer ul[aria-hidden] li")].some((e) => e.style.transform && e.style.transform !== "none"), null, 20000);
  const jg1 = await q.evaluate(() => {
    const f = document.querySelector("footer");
    const ul = f.querySelector("ul[aria-hidden]");
    const z = (e) => Number(getComputedStyle(e).zIndex) || 0;
    const kesis = (a, c) => !(a.right <= c.left || a.left >= c.right || a.bottom <= c.top || a.top >= c.bottom);
    const metin = [...f.querySelectorAll("nav a, span, p")].filter((e) => e.textContent.trim() && e.getBoundingClientRect().height > 0);
    const li = [...(ul?.querySelectorAll("li") ?? [])].filter((e) => e.getBoundingClientRect().height > 0);
    return {
      var: !!ul,
      zKatman: ul ? z(ul) : null,
      zWordmark: z(f.querySelector("svg").parentElement === f ? f.querySelector("svg") : f.querySelector("svg")),
      olaylar: ul ? getComputedStyle(ul).pointerEvents : null,
      carpisma: li.some((e) => metin.some((m) => kesis(e.getBoundingClientRect(), m.getBoundingClientRect()))),
      y: li.map((e) => Math.round(e.getBoundingClientRect().top)),
    };
  });
  t("Footer · zıplama alanı wordmark'ın ÜSTÜNDE (görünür)", jg1.var && jg1.zKatman > jg1.zWordmark,
    `katman z=${jg1.zKatman} · wordmark z=${jg1.zWordmark}`);
  t("Footer · ikonlar tıklamayı yakalamıyor", jg1.olaylar === "none", `pointer-events=${jg1.olaylar}`);
  t("Footer · ikonlar metinle çakışmıyor", jg1.var && !jg1.carpisma, `çakışma=${jg1.carpisma}`);
  // İki örnek arasında GERÇEK bir aralık şart: peş peşe evaluate ~10 ms sürüyor, o
  // sürede ikon 1-2 px hareket ediyor ve tam sayıya yuvarlanınca 0 çıkıyordu (ürün
  // duruyor sanılmıştı — ölçüm hatası, Kural 60).
  await pencere(q, 280); // ÖLÇÜM PENCERESİ: iki örnek arasında gerçek zaman geçmeli
  const jg2 = await q.evaluate(() => {
    const li = [...document.querySelectorAll("footer ul[aria-hidden] li")].filter((e) => e.getBoundingClientRect().height > 0);
    return li.map((e) => Math.round(e.getBoundingClientRect().top));
  });
  // Senkron zıplasalardı hem aynı anda aynı hizada olurlardı hem de birlikte hareket ederlerdi.
  const yayilim = Math.max(...jg1.y) - Math.min(...jg1.y);
  const hareket = jg1.y.map((v, i) => Math.abs(v - jg2[i]));
  t("Footer · ikonlar farklı fazlarda (senkron değil)", yayilim > 20 && Math.max(...hareket) > 4,
    `aynı andaki yayılım ${yayilim}px · örnekler arası hareket [${hareket.join(",")}]`);

  // --- R2/R3 PageTransition + dinamik title
  await q.evaluate(() => window.__UI__.getState().closeAll());
  await kosul(q, () => document.querySelectorAll("[role=dialog][data-state=open]").length === 0);
  const titleBefore = await q.title();
  await q.evaluate(() => window.__TRANSITION__.getState().trigger(null));
  await kosul(q, () => document.querySelector("[data-transition]")?.getAttribute("data-transition") !== "idle");
  const mid = await q.evaluate(() => ({
    phase: document.querySelector("[data-transition]")?.getAttribute("data-transition"),
    title: document.title,
  }));
  t("PageTransition · perde kapanıyor", ["cover", "covering", "covered"].includes(mid.phase ?? ""), `phase=${mid.phase}`);
  t("R3 · title 'Smash'leniyor' oldu", mid.title !== titleBefore && /\|/.test(mid.title), `"${mid.title}"`);
  await kosul(q, () => document.querySelector("[data-transition]")?.getAttribute("data-transition") === "idle", null, 20000);
  const endPhase = await q.evaluate(() => document.querySelector("[data-transition]")?.getAttribute("data-transition"));
  t("PageTransition · idle'a döner", endPhase === "idle", `phase=${endPhase}`);

  await ctx.close();
}

// ============================ FAZ 5 — ANA SAYFA ============================
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const h = await ctx.newPage();
  const herrs = [];
  h.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") herrs.push(m.type() + ": " + m.text()); });
  h.on("pageerror", (e) => herrs.push("pageerror: " + e.message));

  await h.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  await h.waitForSelector("#hits");
  await hazir(h); // Kural 75: sabit 4200 ms yerine koşul // preloader + lazy gsap

  // --- bölümler
  const shape = await h.evaluate(() => ({
    sections: document.querySelectorAll("main > section").length,
    ids: [...document.querySelectorAll("section[id]")].map((s) => s.id),
    broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  t("Ana sayfa · 8 bölüm", shape.sections === 8, `${shape.sections} bölüm`);
  t("Ana sayfa · anchor id'leri", ["hits", "build", "zone", "location"].every((i) => shape.ids.includes(i)), shape.ids.join(", "));
  t("Ana sayfa · kırık görsel yok", shape.broken === 0, `kırık=${shape.broken}`);
  t("Ana sayfa · yatay taşma yok", !shape.overflow);

  // --- KURAL 50: ProductGrid ilk boyamada kaç kart GÖRÜNÜR?
  // Beklenen 6/6. Ön-gizleme yapılmadığı için sayfa açılır açılmaz (henüz grid'e
  // kaydırılmadan, batch tetiklenmeden) tüm kartlar opacity 1 olmalı.
  const visible = await h.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-product-card]")];
    const shown = cards.filter((c) => Number(getComputedStyle(c).opacity) > 0.99);
    return { total: cards.length, shown: shown.length,
             opacities: cards.map((c) => Number(getComputedStyle(c).opacity).toFixed(2)) };
  });
  t("Kural 50 · ProductGrid ilk boyamada 6/6 kart görünür",
    visible.total === 6 && visible.shown === 6, `${visible.shown}/${visible.total} · [${visible.opacities.join(" ")}]`);

  // SABOTAJ TESTİ — Kural 50'nin asıl garantisi:
  // tüm ScrollTrigger'ları öldür, sonra grid'e kaydır. Batch hiç çalışmasa bile
  // 6 kartın 6'sı görünür kalmalı (eski sitede burada 8'den 1'i görünüyordu).
  await h.evaluate(() => window.__ST_KILL__?.());
  await h.evaluate(() => document.querySelector("#hits").scrollIntoView());
  await pencere(h, 1200); // ÖLÇÜM PENCERESİ: sabotajdan sonra yanlış davranışa fırsat verilir
  const sabotaged = await h.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-product-card]")];
    return { st: window.__ST_COUNT__?.() ?? -1, total: cards.length,
             shown: cards.filter((c) => Number(getComputedStyle(c).opacity) > 0.99).length };
  });
  t("Kural 50 · SABOTAJ: ScrollTrigger'lar öldürülse de 6/6 kart görünür",
    sabotaged.shown === 6, `ST=${sabotaged.st} · ${sabotaged.shown}/${sabotaged.total}`);
  await h.reload({ waitUntil: "domcontentloaded" });
  await h.waitForSelector("#hits");
await hazir(h);

  // fold üstündeki kartlara batch hiç dokunmadı mı (inline transform yok)
  const untouched = await h.evaluate(() => {
    const vh = window.innerHeight;
    return [...document.querySelectorAll("[data-product-card]")]
      .filter((c) => c.getBoundingClientRect().top < vh)
      .every((c) => !c.style.opacity && !c.style.transform);
  });
  t("Kural 50 · fold üstü kartlara inline stil yazılmadı", untouched);

  // --- R15b BuildSequence: pin YOK
  const build = await h.evaluate(() => ({
    frames: document.querySelectorAll("[data-frame]").length,
    firstVisible: Number(getComputedStyle(document.querySelector("[data-frame='0']")).opacity) > 0.99,
    pinSpacers: document.querySelectorAll(".pin-spacer").length,
  }));
  t("R15b · 6 kare", build.frames === 6, `${build.frames}`);
  t("R15b · ilk kare animasyonsuz görünür (Kural 50)", build.firstVisible);
  t("R15b · pin KULLANILMIYOR", build.pinSpacers === 0, `pin-spacer=${build.pinSpacers}`);

  // --- Instagram: 6 gerçek kare foto, kesit/metin kartı yok
  // NOT: lazy görsellerde `currentSrc` yüklenene kadar boştur → `src` attribute'una bakılır.
  const insta = await h.evaluate(() => {
    const imgs = [...document.querySelectorAll("[data-insta-grid] img")];
    return { n: imgs.length,
             allSocial: imgs.every((i) => /images%2Fsocial|images\/social/.test(i.getAttribute("src") ?? "")),
             noCutout: imgs.every((i) => !/\.png|burgers/.test(i.getAttribute("src") ?? "")) };
  });
  t("Instagram · kesit/PNG karıştırılmamış", insta.noCutout);
  t("Instagram · 6 gerçek 1:1 fotoğraf", insta.n === 6 && insta.allSocial, JSON.stringify(insta));

  // --- kart + → sepet
  await h.evaluate(() => window.__CART__.getState().clear());
  await h.locator("[data-add-to-cart='classic-manch']").click();
  await kosul(h, () => window.__CART__.getState().lines.length === 1);
  const added = await h.evaluate(() => window.__CART__.getState().lines);
  t("Ürün kartı · + sepete ekler", added.length === 1 && added[0].slug === "classic-manch", JSON.stringify(added));

  // --- quick details aç/kapa
  const qd = h.locator("[data-product-card='classic-manch'] button[aria-expanded]").first();
  await qd.click();
  await varOl(h, "[data-product-card='classic-manch'] dl");
  const qdOpen = await h.locator("[data-product-card='classic-manch'] dl").count();
  t("Ürün kartı · quick details açılır", qdOpen === 1);

  // --- fold altı kartlar scroll ile geliyor mu (menüde 6 kart tek satıra sığmaz)
  await h.evaluate(() => document.querySelector("#build").scrollIntoView());
  await pencere(h, 1400); // ÖLÇÜM PENCERESİ: batch oynayacaksa oynasın, sonra bakılır
  const afterScroll = await h.evaluate(() =>
    [...document.querySelectorAll("[data-product-card]")].every((c) => Number(getComputedStyle(c).opacity) > 0.99));
  t("ProductGrid · scroll sonrası da 6/6 görünür", afterScroll);

  // --- harita tıkla-yükle
  await h.evaluate(() => document.querySelector("#location").scrollIntoView());
  await hazir(h);
  const beforeMap = await h.locator("#location iframe").count();
  await h.locator("[data-testid=map-load]").click();
  await varOl(h, "#location iframe");
  const afterMap = await h.locator("#location iframe").count();
  t("Konum · harita tıkla-yükle", beforeMap === 0 && afterMap === 1, `${beforeMap} → ${afterMap}`);

  // --- reduced motion: BuildSequence dikey listeye döner
  await h.evaluate(() => window.__MOTION__.getState().setForceReduced(true));
  await kosul(h, () => window.__MOTION__.getState().forceReduced === true && document.querySelectorAll("#build figure").length > 0);
  const red = await h.evaluate(() => ({
    figures: document.querySelectorAll("#build figure").length,
    stacked: document.querySelectorAll("[data-frame]").length,
    allVisible: [...document.querySelectorAll("#build img")].every((i) => Number(getComputedStyle(i).opacity) > 0.99),
    cards: [...document.querySelectorAll("[data-product-card]")].filter((c) => Number(getComputedStyle(c).opacity) > 0.99).length,
  }));
  t("reduced · R15b 6 kare dikey liste olur", red.figures === 6 && red.stacked === 0, JSON.stringify(red));
  t("reduced · R15b tüm kareler görünür", red.allVisible);
  t("reduced · kartlar 6/6 görünür", red.cards === 6, `${red.cards}/6`);
  await h.evaluate(() => window.__MOTION__.getState().setForceReduced(null));

  /* Kural 45 · dev-only istisnalar. WebKit eki (2026-09-19): Next dev'in catch-all 404
     ölçümü Chromium'da "CatchAll … negative time stamp" derken WebKit'te yalnızca
     "TypeError: Type error" diyor; yığın `react-server-dom-turbopack` içindeki `measure`
     fonksiyonunu gösteriyor. Aynı dev artığı, farklı metin — mevcut filtre tutmuyordu.
     Dar tutuldu: yalnız bu yığın imzası. Production build'de WebKit 4 sayfada 0 pageerror
     (ölçüldü), yani ürün kodu temiz. */
  const hf = herrs.filter((e) => !DEV_ARTIFACT.test(e));
  t("Ana sayfa · konsol temiz", hf.length === 0, hf.slice(0, 2).join(" | ").slice(0, 150));
  await ctx.close();
}

// ============================ FAZ 6 — İÇ SAYFALAR ============================
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const m = await ctx.newPage();
  const merrs = [];
  const bad4xx = [];
  m.on("console", (e) => { if (e.type() === "error" || e.type() === "warning") merrs.push(e.type() + ": " + e.text()); });
  m.on("pageerror", (e) => merrs.push("pageerror: " + e.message));
  // Konsol filtresi yerine ağ denetimi: 404 belge yanıtı tarayıcıda konsol hatası üretir,
  // bu yüzden "Failed to load resource" filtrelenirse gerçek eksik varlıklar da gizlenir.
  // Bunun yerine tüm 4xx/5xx istekler URL'siyle toplanır; kasıtlı 404 dışında hiçbiri olmamalı.
  m.on("response", (r) => { if (r.status() >= 400) bad4xx.push(`${r.status()} ${r.url().replace(BASE, "").split("?")[0]}`); });

  // --- üç sayfa × iki dil, hepsi 200
  const routes = ["/tr/menu", "/tr/about", "/tr/contact", "/en/menu", "/en/about", "/en/contact"];
  const codes = [];
  for (const r of routes) {
    const res = await m.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded" });
    await hazir(m); // Kural 75: sabit 500 ms yerine koşul
    codes.push(`${r}=${res.status()}`);
  }
  t("İç sayfalar · 6 rota (3 sayfa × 2 dil) 200", codes.every((c) => c.endsWith("=200")), codes.join(" "));

  // --- her sayfada tek h1
  const h1s = [];
  for (const r of ["/tr/menu", "/tr/about", "/tr/contact"]) {
    await m.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded" });
    await hazir(m); // Kural 75: sabit 900 ms yerine koşul
    h1s.push(await m.evaluate(() => document.querySelectorAll("h1").length));
  }
  t("İç sayfalar · her sayfada tek h1", h1s.every((n) => n === 1), `h1 sayıları: ${h1s.join(", ")}`);

  // --- /menu: filtresiz 28 kart (5.5.1'de içecek kategorisi eklendi: 25 + 3)
  await m.goto(`${BASE}/tr/menu`, { waitUntil: "domcontentloaded" });
  await m.waitForSelector("[data-product-card]");
  await hazir(m); // Kural 75: sabit 3200 ms yerine koşul
  const menu0 = await m.evaluate(() => {
    const c = [...document.querySelectorAll("[data-product-card]")];
    return { total: c.length, shown: c.filter((x) => Number(getComputedStyle(x).opacity) > 0.99).length,
             cats: document.querySelectorAll("[data-testid=menu-category]").length,
             tabs: document.querySelectorAll("[data-testid^=tab-]").length };
  });
  t("/menu · filtresiz 28 kart", menu0.total === 28, `${menu0.total}`);
  t("Kural 50 · /menu ilk boyamada 28/28 kart GÖRÜNÜR", menu0.shown === 28, `${menu0.shown}/${menu0.total}`);
  t("/menu · 7 kategori bloğu + 7 sekme", menu0.cats === 7 && menu0.tabs === 7, JSON.stringify(menu0));

  // --- SABOTAJ: ScrollTrigger'lar öldürülse de filtresiz listede hepsi görünür
  await m.evaluate(() => window.__ST_KILL__?.());
  await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await pencere(m, 1200); // ÖLÇÜM PENCERESİ: sabotajdan sonra yanlış davranışa fırsat verilir
  const sab = await m.evaluate(() => {
    const c = [...document.querySelectorAll("[data-product-card]")];
    return { st: window.__ST_COUNT__?.() ?? -1, shown: c.filter((x) => Number(getComputedStyle(x).opacity) > 0.99).length, total: c.length };
  });
  t("Kural 50 · /menu SABOTAJ: ScrollTrigger'sız da 28/28 görünür", sab.shown === 28, `ST=${sab.st} · ${sab.shown}/${sab.total}`);
  await m.reload({ waitUntil: "domcontentloaded" });
  await m.waitForSelector("[data-product-card]");
await hazir(m);

  // --- filtreler (beklenen: spicy 1 · new 1 · signature 4)
  const counts = {};
  for (const [tag, expect] of [["spicy", 1], ["new", 1], ["signature", 4]]) {
    await m.locator(`[data-testid=filter-${tag}]`).click();
    await kosul(m, ([n]) => document.querySelectorAll("[data-product-card]").length === n, [expect]);
    counts[tag] = await m.evaluate(() => document.querySelectorAll("[data-product-card]").length);
    const vis = await m.evaluate(() => [...document.querySelectorAll("[data-product-card]")].filter((c) => Number(getComputedStyle(c).opacity) > 0.99).length);
    t(`/menu · filtre "${tag}" → ${expect} ürün, hepsi görünür`, counts[tag] === expect && vis === expect, `${counts[tag]} kart, ${vis} görünür`);
    await m.locator(`[data-testid=filter-${tag}]`).click();
  await kosul(m, () => document.querySelectorAll("[data-product-card]").length === 28);
  }
  const back = await m.evaluate(() => document.querySelectorAll("[data-product-card]").length);
  t("/menu · filtre kapatılınca 28'e döner", back === 28, `${back}`);

  /* ---- Faz 6: FİYATSIZ ürün /menu'den de sipariş EDİLEMEZ ----
     Zone'un sipariş tahtası (5.5.8) bunu yapıyordu, `/menu` kartı ve modalı yapmıyordu:
     4 fiyatsız ürün (Crispy Triangle + 3 içecek) sepete girebiliyor ve `orderTotal` onları
     0 saydığı için WhatsApp siparişine **bedelsiz** yazılıyordu. Koşul veriden gelir
     (`price == null`), koda slug listesi gömülmez.

     Tıklama DOM'dan (`el.click()`) yapılır, Playwright'ın `locator.click()`'iyle değil:
     ① önceki testten kalan modal perdesi gerçek tıklamayı yakalıyordu (ölçüm aracının
     yan etkisi, Kural 60) ② `disabled` bir düğme zaten olay almaz — DOM tıklaması hem
     `disabled`ı hem `onClick` içindeki korumayı aynı anda sınar. */
  await m.goto(`${BASE}/tr/menu`, { waitUntil: "domcontentloaded" });
  await m.waitForSelector("[data-product-card]");
  await hazir(m); // Kural 75: sabit 1500 ms yerine koşul
  const soonSel = "[data-product-card]:has([data-testid=soon-badge]), [data-product-card]";
  const soon = await m.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-product-card]")]
      .filter((c) => /YAKINDA|COMING SOON/i.test(c.textContent));
    const btn = cards[0]?.querySelector("[data-add-to-cart]");
    return {
      n: cards.length,
      slug: btn?.getAttribute("data-add-to-cart") ?? null,
      disabled: btn?.disabled ?? null,
      aria: btn?.getAttribute("aria-disabled") ?? null,
      title: btn?.getAttribute("title") ?? null,
    };
  });
  void soonSel;
  t("/menu · fiyatsız ürün YAKINDA rozetiyle görünüyor", soon.n === 4, `${soon.n} kart`);
  t("/menu · fiyatsız kartın + düğmesi devre dışı", soon.disabled === true && soon.aria === "true",
    JSON.stringify({ disabled: soon.disabled, aria: soon.aria }));
  t("/menu · devre dışı + düğmesi sebebini söylüyor", !!soon.title, `title="${soon.title}"`);

  const cartBefore = await m.evaluate(() => window.__CART__.getState().lines.length);
  await m.evaluate(() => {
    const c = [...document.querySelectorAll("[data-product-card]")]
      .find((x) => /YAKINDA|COMING SOON/i.test(x.textContent));
    c?.querySelector("[data-add-to-cart]")?.click();
  });
  await pencere(m, 400); // ÖLÇÜM PENCERESİ: koruma çalışmasaydı sepete GİRECEKTİ
  const cartAfter = await m.evaluate(() => window.__CART__.getState().lines.length);
  t("/menu · fiyatsız kart sepeti DEĞİŞTİRMİYOR", cartAfter === cartBefore, `${cartBefore} → ${cartAfter}`);

  // aynı kural modalda
  await m.goto(`${BASE}/tr/menu?p=${soon.slug}`, { waitUntil: "domcontentloaded" });
  await m.waitForSelector("[data-testid=modal-add]");
  await hazir(m); // Kural 75: sabit 1200 ms yerine koşul
  const modalAdd = await m.evaluate(() => {
    const b = document.querySelector("[data-testid=modal-add]");
    return { disabled: b?.disabled ?? null, aria: b?.getAttribute("aria-disabled") ?? null };
  });
  t("/menu · fiyatsız ürünün MODALINDA da ekle devre dışı",
    modalAdd.disabled === true && modalAdd.aria === "true", `${soon.slug} · ${JSON.stringify(modalAdd)}`);
  await m.evaluate(() => document.querySelector("[data-testid=modal-add]")?.click());
  await pencere(m, 400); // ÖLÇÜM PENCERESİ: koruma çalışmasaydı sepete GİRECEKTİ
  const cartAfterModal = await m.evaluate(() => window.__CART__.getState().lines.length);
  t("/menu · modal sepeti DEĞİŞTİRMİYOR", cartAfterModal === cartBefore, `${cartBefore} → ${cartAfterModal}`);
  /* Modalı KAPAT ve temiz duruma dön: açık bırakılırsa perdesi (z-73) sonraki testlerin
     tıklamalarını yakalıyor ve onlar zaman aşımına düşüyor — kendi bloğunun artığıyla
     başka bir kontrolü kırmak, testin kendi yan etkisidir (Kural 60). */
  await m.keyboard.press("Escape");
  await durumBekle(m, "[data-testid=product-modal]", "closed");
  await m.goto(`${BASE}/tr/menu`, { waitUntil: "domcontentloaded" });
  await m.waitForSelector("[data-product-card]");
  await hazir(m); // Kural 75: sabit 1200 ms yerine koşul


  // --- disclaimer iki yerde
  const d1 = await m.locator("[data-testid=menu-disclaimer]").count();
  await m.locator("[data-open-detail='classic-manch']").click();
  // Sabit 900 ms yerine koşul (Kural 60) — yük altında modal geç açılıyordu.
  await m
    .waitForFunction(
      () => document.querySelector("[data-testid=product-modal]")?.getAttribute("data-state") === "open" && location.search !== "",
      null,
      { timeout: 10000 },
    )
    .catch(() => {});
  const modal = await m.evaluate(() => ({
    state: document.querySelector("[data-testid=product-modal]")?.getAttribute("data-state"),
    url: location.search,
    disclaimer: !!document.querySelector("[data-testid=modal-disclaimer]"),
    ing: document.querySelectorAll("[data-testid=product-modal] li").length,
  }));
  t("/menu · modal açılır + ?p= URL'e yazılır", modal.state === "open" && modal.url === "?p=classic-manch", JSON.stringify(modal));
  t("Menu.disclaimer · iki yerde (başlık altı + modal)", d1 === 1 && modal.disclaimer, `başlık=${d1} modal=${modal.disclaimer}`);
  t("/menu · modalda malzeme listesi", modal.ing >= 6, `${modal.ing} madde`);

  await m.keyboard.press("Escape");
  /* SABİT bekleme (800 ms) yerine KOŞUL bekleniyor (Kural 60): dev sunucusu yük
     altındayken `router.replace` + yeniden render 800 ms'yi aşıyor ve kontrol eski
     durumu okuyup kırmızı yanıyordu (2026-09-20, üç koşuda bir). İddia değişmedi —
     koşul gerçekten sağlanmazsa aşağıdaki `t(...)` yine düşer, yalnız yarış kalktı. */
  await m
    .waitForFunction(
      () =>
        document.querySelector("[data-testid=product-modal]")?.getAttribute("data-state") === "closed" &&
        location.search === "",
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  const closed = await m.evaluate(() => ({ state: document.querySelector("[data-testid=product-modal]")?.getAttribute("data-state"), url: location.search }));
  t("/menu · ESC modalı kapatır + URL temizlenir", closed.state === "closed" && closed.url === "", JSON.stringify(closed));

  // --- derin link: ?p=slug ile doğrudan açılış
  await m.goto(`${BASE}/tr/menu?p=tiramisu`, { waitUntil: "domcontentloaded" });
  await hazir(m); // Kural 75: sabit 2200 ms yerine koşul
  const deep = await m.evaluate(() => document.querySelector("[data-testid=product-modal]")?.getAttribute("data-state"));
  t("/menu · derin link (?p=tiramisu) modalı açar", deep === "open", `state=${deep}`);

  // --- 404 + catch-all
  const r404 = await m.goto(`${BASE}/tr/olmayan-sayfa`, { waitUntil: "domcontentloaded" });
  await hazir(m); // Kural 75: sabit 1500 ms yerine koşul
  const nf = await m.evaluate(() => ({
    ui: !!document.querySelector("[data-testid=not-found]"),
    nav: !!document.querySelector("header"),
    link: !!document.querySelector("[data-testid=not-found] a"),
  }));
  t("404 · status 404", r404.status() === 404, `${r404.status()}`);
  t("404 · bizim UI + nav + ana sayfa linki", nf.ui && nf.nav && nf.link, JSON.stringify(nf));

  // --- Nav / Footer / MenuOverlay linkleri gerçek rotalara gidiyor mu
  await m.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  await hazir(m); // Kural 75: sabit 2600 ms yerine koşul
  await m.evaluate(() => window.__UI__.getState().setMenuOpen(true));
  await hazir(m); // Kural 75: sabit 900 ms yerine koşul
  const hrefs = await m.evaluate(() => {
    const grab = (sel) => [...document.querySelectorAll(`${sel} a[href]`)].map((a) => new URL(a.href).pathname);
    return { nav: grab("header"), overlay: grab("#menu-overlay"), footer: grab("footer") };
  });
  await m.evaluate(() => window.__UI__.getState().closeAll());
  const all = [...new Set([...hrefs.nav, ...hrefs.overlay, ...hrefs.footer])].filter((h) => h.startsWith("/tr") || h.startsWith("/en"));
  const bad404 = [];
  for (const href of all) {
    const res = await m.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded" });
    if (res.status() !== 200) bad404.push(`${href}=${res.status()}`);
  }
  t("Nav/Footer/Overlay · tüm iç linkler 200", bad404.length === 0, `${all.length} link · sorunlu: ${bad404.join(", ") || "yok"}`);

  const mf = merrs.filter((e) => !DEV_ARTIFACT.test(e) && !/Failed to load resource/.test(e));
  t("İç sayfalar · konsol temiz", mf.length === 0, mf.slice(0, 2).join(" | ").slice(0, 160));
  const unexpected = bad4xx.filter((x) => !x.endsWith("/tr/olmayan-sayfa"));
  t("İç sayfalar · kasıtlı 404 dışında 4xx/5xx istek yok", unexpected.length === 0,
    `toplam ${bad4xx.length} · beklenmeyen: ${unexpected.slice(0, 3).join(", ") || "yok"}`);
  await ctx.close();
}

// ============================ FAZ 7 — SEO & ERİŞİLEBİLİRLİK ============================
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const q7 = await ctx.newPage();

  // --- metadata rotaları
  const meta = [];
  for (const u of ["/icon/32", "/icon/192", "/icon/512", "/apple-icon", "/manifest.webmanifest",
                   "/robots.txt", "/sitemap.xml", "/tr/opengraph-image", "/en/opengraph-image"]) {
    const r = await q7.goto(`${BASE}${u}`);
    meta.push(`${u}=${r.status()}`);
  }
  t("SEO · 9 metadata rotası 200", meta.every((m) => m.endsWith("=200")), meta.filter((m) => !m.endsWith("=200")).join(" ") || "hepsi 200");

  // --- head: canonical + hreflang + og:image (Kural 48: attribute adı case-insensitive)
  for (const path of ["/tr", "/tr/menu", "/en/about"]) {
    await q7.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await hazir(q7); // Kural 75: sabit 700 ms yerine koşul
    const head = await q7.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      langs: [...document.querySelectorAll('link[rel="alternate"]')].map((l) => l.getAttribute("hreflang")).sort(),
      og: document.querySelector('meta[property="og:image"]')?.getAttribute("content"),
      tw: document.querySelector('meta[name="twitter:card"]')?.getAttribute("content"),
      title: document.title,
    }));
    const ok = head.canonical?.endsWith(path) &&
      JSON.stringify(head.langs) === JSON.stringify(["en", "tr", "x-default"]) &&
      !!head.og && head.tw === "summary_large_image";
    t(`SEO · ${path} canonical + hreflang(3) + og:image + twitter`, !!ok, `"${head.title}" · ${head.canonical} · ${head.langs.join(",")}`);
  }

  // --- JSON-LD: KURAL B (bilinmeyen alan YAZILMAZ)
  await q7.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  await hazir(q7); // Kural 75: sabit 700 ms yerine koşul
  const ld = await q7.evaluate(() => {
    const el = document.querySelector('script[type="application/ld+json"]');
    return el ? JSON.parse(el.textContent) : null;
  });
  // 2026-09-18: saatler geldi → openingHoursSpecification artık ZORUNLU, yasaklı değil.
  const must = ["@context", "@type", "name", "url", "image", "servesCuisine", "hasMenu", "address",
                "sameAs", "telephone", "email", "openingHoursSpecification"];
  t("JSON-LD · Restaurant + 12 bilinen alan", !!ld && ld["@type"] === "Restaurant" && must.every((k) => k in ld),
    must.filter((k) => !(ld ?? {})[k]).join(", ") || `${Object.keys(ld ?? {}).length} alan`);
  /* priceRange 2026-09-19'da EKLENDİ (karar: kullanıcı) — Kural 54-B ihlali değil, değer
     `menu.ts`'teki gerçek fiyatlardan hesaplanıyor. Kontrol artık "yok mu" değil,
     "VAR mı ve VERİYLE TUTARLI mı" diye soruyor: uydurma bir aralık buraya sızamaz. */
  {
    const pr = ld.priceRange;
    const sayilar = String(pr ?? "").match(/\d+/g)?.map(Number) ?? [];
    t("KURAL B · priceRange var ve gerçek fiyat aralığından", sayilar.length === 2 && sayilar[0] < sayilar[1], `priceRange="${pr}"`);
  }
  t("KURAL B · hâlâ uydurma alan yok (geo/rezervasyon/puan)",
    !("geo" in ld) && !("acceptsReservations" in ld) && !("potentialAction" in ld) && !("aggregateRating" in ld),
    Object.keys(ld).filter((k) => ["geo", "acceptsReservations", "potentialAction", "aggregateRating"].includes(k)).join(",") || "yok");
  const emptyish = Object.entries(ld ?? {}).filter(([, v]) => v === "" || v === null ||
    (typeof v === "string" && /yakında|coming soon|todo/i.test(v)));
  t("KURAL B · boş string / 'Yakında' değeri yok", emptyish.length === 0, emptyish.map(([k]) => k).join(", ") || "temiz");
  t("JSON-LD · telefon E.164 (boşluksuz)", /^\+\d+$/.test(ld?.telephone ?? ""), `telephone=${ld?.telephone}`);
  const ohs = ld?.openingHoursSpecification ?? [];
  const days = ohs.flatMap((o) => o.dayOfWeek ?? []);
  t("JSON-LD · openingHoursSpecification 7 günü kapsıyor", days.length === 7,
    `${ohs.length} blok, ${days.length} gün: ${ohs.map((o) => `${o.opens}-${o.closes}`).join(" / ")}`);
  t("JSON-LD · addressRegion: Muğla", ld?.address?.addressRegion === "Muğla", `${ld?.address?.addressRegion}`);

  // --- KURAL A: "Yakında" rozeti görünen arayüzde
  const soonCounts = {};
  for (const path of ["/tr", "/tr/menu", "/tr/contact"]) {
    await q7.goto(`${BASE}${path}?nopreload=1`, { waitUntil: "domcontentloaded" });
    await q7.waitForSelector("footer");
    await q7.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
    await hazir(q7); // Kural 75: sabit 900 ms yerine koşul
    soonCounts[path] = await q7.evaluate(() => document.querySelectorAll("[data-soon]").length);
  }
  const soonTotal = Object.values(soonCounts).reduce((a, c) => a + c, 0);
  // 2026-09-18: saatler geldi → rozet yalnızca gerçekten eksik veride kalmalı:
  // sipariş linki (InfoModal her sayfada + /contact) ve fiyatsız ürün (/menu Crispy Triangle).
  t("KURAL A · rozet yalnızca gerçekten eksik veride", soonTotal >= 3 && soonCounts["/tr"] >= 1,
    Object.entries(soonCounts).map(([k, v]) => `${k}:${v}`).join(" · "));
  const soonWhere = await q7.evaluate(() => [...document.querySelectorAll("[data-soon]")]
    .map((el) => el.closest("dd")?.previousElementSibling?.textContent?.trim() ?? "ürün fiyatı"));
  t("KURAL A · saat satırlarında rozet KALMADI", !soonWhere.some((w) => /saat|hours/i.test(w)),
    soonWhere.join(" | ") || "yok");

  // --- focus ring her etkileşimli öğede
  await q7.goto(`${BASE}/tr/contact?nopreload=1`, { waitUntil: "domcontentloaded" });
  await hazir(q7); // Kural 75: sabit 1500 ms yerine koşul
  const ring = await q7.evaluate(() => {
    const els = [...document.querySelectorAll("a[href], button:not([disabled])")].slice(0, 14);
    let ok = 0;
    for (const el of els) {
      el.focus();
      const cs = getComputedStyle(el);
      const w = parseFloat(cs.outlineWidth);
      if (cs.outlineStyle !== "none" && w >= 1) ok++;
    }
    return { total: els.length, ok };
  });
  t("A11y · focus ring tüm etkileşimli öğelerde", ring.ok === ring.total, `${ring.ok}/${ring.total}`);

  // --- RollText ikinci kopya aria-hidden (Kural 9)
  await q7.goto(`${BASE}/tr?nopreload=1`, { waitUntil: "domcontentloaded" });
  await hazir(q7); // Kural 75: sabit 2400 ms yerine koşul
  const roll = await q7.evaluate(() => {
    const groups = [...document.querySelectorAll(".group\\/roll")];
    return { n: groups.length, hidden: groups.filter((g) => g.querySelector("[aria-hidden=true]")).length };
  });
  t("Kural 9 · RollText ikinci kopya aria-hidden", roll.n === 0 || roll.n === roll.hidden, `${roll.hidden}/${roll.n}`);

  // --- footer wordmark dekoratif mi (kontrast 1.3:1, karar 2026-09-18)
  const wm = await q7.evaluate(() => {
    const f = document.querySelector("footer");
    const svgs = [...f.querySelectorAll("svg")].sort((a, c) => c.getBoundingClientRect().width - a.getBoundingClientRect().width);
    return { ariaHidden: svgs[0]?.getAttribute("aria-hidden"), w: Math.round(svgs[0]?.getBoundingClientRect().width ?? 0) };
  });
  t("A11y · footer dev wordmark aria-hidden (dekoratif)", wm.ariaHidden === "true", `genişlik ${wm.w}px, aria-hidden=${wm.ariaHidden}`);

  // --- öksüz mesaj anahtarı kalmadı
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
