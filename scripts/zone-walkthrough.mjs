// Faz 5.5.11 · Kural 59: GÖZLE BAKMA turu. Otomatik kontroller yapıyı doğrular, GÖRÜNTÜYÜ değil.
//
// Bu script karar vermez — **bakılacak kareleri üretir.** Zincir baştan sona, kesintisiz:
//   ana sayfa → kapı → seçim → yükleyici → sahne → yürüme → halka/prompt → POV →
//   OrderBoard → StoryBoard → tam sayfa linki → geri dönüş
//
// Production build üzerinden koşar (gerçek kullanıcı ne görüyorsa o). `/lab/zone` prod'da
// 404'tür ve zaten lab kromu gerçek görüntüyü kirletir (5.5.8'de yaşandı).
//
// Kural 60 — 5.5.10'da "bozuk görsel" sanılan şey ölçüm zamanlamasıydı: ekran görüntüsü
// görsel ÇÖZÜLMEDEN alınmıştı. Bu yüzden her kareden önce `img.decode()` beklenir.
//
// Kullanım: PROD=http://localhost:3101 CHROME=<yol> node scripts/zone-walkthrough.mjs
//           REDUCED=1 ile aynı zincir reduced-motion'da koşar.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const PROD = process.env.PROD ?? "http://localhost:3101";
const REDUCED = process.env.REDUCED === "1";
/**
 * Çıktı VARSAYILAN olarak yok sayılan `docs/screens/_tur/` altına düşer (Kural 69, 70):
 * bir tur 48 kare / ~56 MB üretiyor ve bunların repoya girmesi `docs/screens/`i 159 MB'a
 * çıkardı. Kabul edilmiş bir kararı belgeleyen kare ELLE `docs/screens/`e kopyalanır.
 * Repo dışına almak için: `ZONE_SHOTS=~/manch-olcum node scripts/...`
 */
const OUT = process.env.ZONE_SHOTS ?? "docs/screens/_tur";
const TAG = REDUCED ? "faz-5.5.11-reduced" : "faz-5.5.11";
mkdirSync(OUT, { recursive: true });

const BREAKPOINTS = [
  { name: "390", width: 390, height: 844, dsf: 3 },
  { name: "768", width: 768, height: 1024, dsf: 2 },
  { name: "1440", width: 1440, height: 810, dsf: 2 },
  { name: "1920", width: 1920, height: 1080, dsf: 1 },
];

const browser = await chromium.launch({ executablePath: process.env.CHROME });
const problems = [];

/**
 * Kadrajdaki görseller çözülene kadar bekle — "yüklendi" ≠ "boyandı" (Kural 60).
 *
 * İki tuzak var, ikisi de bu turda yaşandı:
 *   ① `decode()` **tembel** (lazy) bir görselde ASLA çözülmeyebilir: görsel henüz yüklenmeye
 *      başlamamıştır ve söz sonsuza kadar bekler. İlk yazımda script tam burada asıldı.
 *   ② Bu yüzden yalnızca **kadrajdaki** görseller beklenir ve her biri zaman aşımına bağlanır:
 *      bekleme ürünü değil, ölçümü düzeltmek içindir; asla testi kilitlememelidir.
 */
const settle = (page) =>
  page.evaluate(() => {
    const inView = (i) => {
      const r = i.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
    };
    const cap = (pr, ms) => Promise.race([pr, new Promise((r) => setTimeout(r, ms))]);
    return Promise.all(
      [...document.images]
        .filter((i) => i.src && inView(i))
        .map((i) => cap(i.decode().catch(() => {}), 3000)),
    ).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  });

for (const bp of BREAKPOINTS) {
  const page = await browser.newPage({
    viewport: { width: bp.width, height: bp.height },
    deviceScaleFactor: bp.dsf,
    isMobile: bp.width < 768,
    hasTouch: bp.width < 768,
    reducedMotion: REDUCED ? "reduce" : "no-preference",
  });
  page.setDefaultTimeout(60000);
  const errs = [];
  const bad = [];
  const KNOWN_WARN = "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";
  page.on("console", (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    if (m.text().trim() === KNOWN_WARN) return;
    errs.push(`[${bp.name}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errs.push(`[${bp.name}] pageerror: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) bad.push(`[${bp.name}] ${r.status()} ${r.url()}`); });

  const shot = async (n, label) => {
    await settle(page);
    await page.screenshot({ path: `${OUT}/${TAG}-${bp.name}-${n}-${label}.png` });
  };

  /* --- 1 · ana sayfa, Zone bölümü --- */
  await page.goto(`${PROD}/tr?nopreload=1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-testid=zone-gate]");
  await page.locator("#zone").scrollIntoViewIfNeeded();
  await page.waitForTimeout(REDUCED ? 600 : 1400);
  await shot("01", "anasayfa-zone");

  /* --- 2 · karakter seçimi --- */
  await page.locator("[data-testid=zone-gate]").click();
  await page.waitForSelector("[data-testid=zone-select]");
  await page.waitForTimeout(500);
  await shot("02", "secim");

  /* --- 3 · yükleyici (geçici: seçimden hemen sonra yakalanır) --- */
  await page.locator("[data-testid=zone-pick-misu]").click();
  const sawLoader = await page.waitForSelector("[data-testid=zone-loader]", { timeout: 4000 })
    .then(() => true).catch(() => false);
  if (sawLoader) await shot("03", "yukleyici");
  else problems.push(`[${bp.name}] yükleyici yakalanamadı (sahne çok hızlı kuruldu olabilir)`);

  /* --- 4 · sahne --- */
  await page.waitForSelector("[data-testid=zone-curtain][data-state=zone]", { timeout: 60000 });
  await page.waitForTimeout(1200);
  await shot("04", "sahne");

  /* --- 5 · yürüyüş (ayak izi + kamera dönüşü) --- */
  /* Tuşlar ekran görüntüsünden ÖNCE bırakılır. İlk yazımda basılı tutuluyordu ve karakter
     PNG kodlama süresi boyunca yürümeye devam ediyordu — yani konumu ÖLÇÜM ARACININ hızına
     bağlıydı (1920 dsf1 hızlı, 390 dsf3 yavaş). Kırılımlar farklı halkalara varıyor,
     zincir her koşuda başka yerden devam ediyordu. Kural 60: sürücünün yan etkisi ürünün
     davranışı sanılmamalı. Ayak izleri ~3 sn yaşadığı için kare yine "yürürken" görünür. */
  await page.keyboard.down("w");
  await page.keyboard.down("a");
  await page.waitForTimeout(1100);
  await page.keyboard.up("w");
  await page.keyboard.up("a");
  await shot("05", "yuruyus");

  /* --- 6..10 · halkalar, POV, iki pano türü, tam sayfa linki ---
     Rota TAHMİNE DEĞİL, salonun bilinen geometrisine dayanır (lib/zone/frames.ts):
       sol duvar  x −5.6 : z 6 `mascot` (hikâye) · z −4 `menu` (sipariş)
       sağ duvar  x +5.6 : z 6 `visit`  (hikâye) · z −4 `crew` (hikâye)
     Başlangıç (0, 12). Sıra: sola yanaş → mascot → menu → karşıya geç → crew → TAM SAYFA.

     İki kez ölçüm hatası yaşandı, ikisi de burada kapatıldı (Kural 60):
       ① "sola yürü = sipariş tahtası" varsayımı — gerçekte önce hikâye panosu geliyordu;
          artık açılan pano OKUNUYOR ve beklenenle karşılaştırılıyor.
       ② "halkadan çık" döngüsü 25 adım yürüyordu; karakter salonun dibine dayanıp
          hiçbir halkaya dönemiyordu (1440'ta tam bu oldu). Çıkış 4 adımla sınırlı. */
  const tap = async (key, ms) => {
    await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key);
  };
  const promptOn = async () => (await page.locator("[data-testid=frame-prompt]").count()) > 0;

  /** Verilen yönde halka bulunana kadar küçük adımlar. */
  const stepUntilRing = async (key, max) => {
    for (let i = 0; i < max; i++) {
      if (await promptOn()) return true;
      await tap(key, 180);
    }
    return promptOn();
  };
  /**
   * Önce MENZİLDEN ÇIK, sonra sıradakini ara.
   *
   * Çıkış sabit adım sayısıyla yapılamaz: karakter halkaya ne kadar yakın durduğu
   * koşudan koşuya değişiyor. Sabit 4 adım kimi koşuda yetmiyordu (aynı halka yeniden
   * açılıyordu, "TAM SAYFAYA GİT" hiç çalışmadı), 25 adım ise salonun dibine dayandırıp
   * bütün halkaları geçiriyordu (1440'ta bu oldu). Doğrusu: **koşula bağlı ama sınırlı** —
   * prompt sönene kadar, en çok 8 adım (≈6.6 birim, sonraki halkayı geçmeye yetmez).
   */
  const leaveRing = async (key) => {
    for (let i = 0; i < 8 && (await promptOn()); i++) await tap(key, 180);
  };
  const nextRingForward = async () => {
    await leaveRing("w");
    return stepUntilRing("w", 22);
  };

  /** Panoyu aç, hangisinin açıldığını OKU (varsayma). */
  const openBoard = async () => {
    await page.keyboard.press("e");
    const which = await Promise.race([
      page.waitForSelector("[data-testid=order-board]", { timeout: 15000 }).then(() => "order"),
      page.waitForSelector("[data-testid=story-board]", { timeout: 15000 }).then(() => "story"),
    ]).catch(() => null);
    if (which) await page.waitForTimeout(1600);
    return which;
  };

  let gotOrder = false, gotStory = false, gotFullpage = false;

  // ① sol duvara yanaş, ilk halkaya yürü (mascot — hikâye)
  await stepUntilRing("a", 16);
  if (!(await promptOn())) await nextRingForward();
  if (await promptOn()) {
    await shot("06", "halka-prompt");
    const w1 = await openBoard();
    if (w1 === "story") { gotStory = true; await shot("09", "storyboard"); }
    else if (w1 === "order") { gotOrder = true; await shot("07", "orderboard"); }
    else problems.push(`[${bp.name}] 1. halkada pano açılmadı`);
    if (w1) { await page.keyboard.press("Escape"); await page.waitForTimeout(900); }
  } else problems.push(`[${bp.name}] 1. halkaya ulaşılamadı`);

  // ② aynı duvarda ileri: menu (sipariş tahtası)
  if (!gotOrder && (await nextRingForward())) {
    const w2 = await openBoard();
    if (w2 === "order") {
      gotOrder = true;
      await shot("07", "orderboard");
      const plus = page.locator("[data-testid=qty-plus]:not([aria-disabled=true])").first();
      if (await plus.count()) { await plus.click(); await page.waitForTimeout(600); await shot("08", "orderboard-adet"); }
    } else if (w2 === "story" && !gotStory) { gotStory = true; await shot("09", "storyboard"); }
    if (w2) { await page.keyboard.press("Escape"); await page.waitForTimeout(900); }
  }

  // ③ karşı duvara geç: crew (hikâye) → TAM SAYFAYA GİT
  await leaveRing("d");
  if (await stepUntilRing("d", 22)) {
    const w3 = await openBoard();
    if (w3 === "story") {
      if (!gotStory) { gotStory = true; await shot("09", "storyboard"); }
      await page.locator("[data-testid=story-fullpage]").click();
      await page.waitForURL(/\/(about|menu|contact)/, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(REDUCED ? 900 : 2200);
      await shot("10", "tam-sayfa");
      gotFullpage = true;
    } else if (w3 === "order" && !gotOrder) {
      gotOrder = true; await shot("07", "orderboard");
      await page.keyboard.press("Escape"); await page.waitForTimeout(900);
    }
  }
  if (!gotOrder) problems.push(`[${bp.name}] sipariş tahtası yakalanamadı`);
  if (!gotStory) problems.push(`[${bp.name}] hikâye panosu yakalanamadı`);
  if (!gotFullpage) problems.push(`[${bp.name}] TAM SAYFAYA GİT adımı yapılamadı`);

  /* --- 11 · geri dönüş: Zone'a yeniden gir (karakter hatırlanmalı) --- */
  await page.goto(`${PROD}/tr?nopreload=1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-testid=zone-gate]");
  await page.locator("[data-testid=zone-gate]").click();
  const reSelect = await page.locator("[data-testid=zone-select]").count();
  await page.waitForSelector("[data-testid=zone-curtain][data-state=zone]", { timeout: 60000 });
  await page.waitForTimeout(1200);
  await shot("11", "geri-donus");
  if (reSelect > 0) problems.push(`[${bp.name}] geri dönüşte karakter seçimi YİNE soruldu`);

  /* --- 12 · çıkış: sayfa kaydırılabilir kalmalı (Kural 67) --- */
  await page.locator("[data-testid=zone-exit]").click();
  await page.waitForTimeout(900);
  const locked = await page.evaluate(() => {
    const d = window.__SCROLL_LOCK__ ? window.__SCROLL_LOCK__() : null;
    return { depth: d, overflow: getComputedStyle(document.documentElement).overflow };
  });
  if (locked.overflow === "hidden") problems.push(`[${bp.name}] çıkıştan sonra kaydırma KİLİTLİ (${JSON.stringify(locked)})`);
  await shot("12", "cikis");

  if (errs.length) problems.push(...errs.slice(0, 3));
  if (bad.length) problems.push(...bad.slice(0, 3));
  console.log(`  ${bp.name.padEnd(5)} ✓ kareler alındı · konsol ${errs.length} · 4xx/5xx ${bad.length}`);
  await page.close();
}

await browser.close();
console.log(`\nekranlar: ${OUT}/${TAG}-*`);
if (problems.length) {
  console.log("\nSORUNLAR:");
  for (const p of problems) console.log("  ✗ " + p);
  process.exit(1);
}
console.log("\n✓ zincir kesintisiz tamamlandı · konsol ve ağ temiz");
