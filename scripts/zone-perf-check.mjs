// Faz 5.5.11 kabul kriteri: kare hızı + "POV'da hareket durur" (spec bölüm 9).
//
// İKİ AYRI ÖZNE, İKİ AYRI SUNUCU — bilerek:
//
//   · DONMA (`ONLY=pov`)  → **dev** sunucusu, `/lab/zone`, `__ZONE_STATS__`.
//     Ölçülen şey MANTIK (karakter/ayak izi/nabız duruyor mu), hız değil; dev ile prod
//     arasında mantık farkı yok, debug kancaları ise yalnızca dev'de var.
//
//   · KARE HIZI (`ONLY=fps`) → **production** build, gerçek kullanıcı yolundan
//     (ana sayfa → kapı → seçim → yükleyici → sahne). Dev sunucusunda ölçmek yasak:
//     minify'sız bundle kare hızını düşürür ve rakam hiçbir şey anlatmaz (Kural 43'ün
//     Lighthouse için söylediğinin aynısı).
//
// KURAL 60 — ölçtüğün şey ürün mü, ölçüm aracı mı?
//   ① Kare hızı **duvar saatiyle** ölçülür, `debug.simTime` ile DEĞİL: `dt` 50 ms'te
//      kırpıldığı için düşük kare hızında simülasyon saati gerçek zamandan yavaş akar ve
//      fps'i olduğundan iyi gösterir. Kırpmanın devreye girip girmediği ayrıca raporlanır:
//      en uzun kare < 50 ms ise kırpma hiç çalışmamıştır, yani ölçümü bozması imkânsızdır.
//   ② Kareler **sayfanın içinde** biriktirilir, `page.evaluate` ile örneklenmez: her
//      gidiş-dönüş 70–90 ms, yani ölçmek istediğimiz şeyin kendisi kadar.
//   ③ Donma kontrolü tek yönlü değildir: POV'da değerlerin DEĞİŞMEDİĞİ ile birlikte,
//      POV DIŞINDA aynı değerlerin DEĞİŞTİĞİ de aynı koşuda kanıtlanır. Yoksa hep 0
//      dönen bozuk bir ölçüm de "donmuş" der.
//
// Kullanım:
//   POV : BASE=http://localhost:3000 CHROME=<yol> ONLY=pov  node scripts/zone-perf-check.mjs
//   FPS : PROD=http://localhost:3101 CHROME=<yol> ONLY=fps  node scripts/zone-perf-check.mjs
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3000";
const PROD = process.env.PROD ?? "http://localhost:3101";
const ONLY = process.env.ONLY ?? "";
const runs = (s) => !ONLY || ONLY === s;

let pass = 0, fail = 0;
const ok = (cond, label, extra = "") => {
  if (cond) { pass++; console.log(`  ✓ ${label}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`  ✗ ${label}${extra ? "  — " + extra : ""}`); }
};

const browser = await chromium.launch({ executablePath: process.env.CHROME });

/* ===================== 1 · POV'DA HAREKET DURUYOR MU (spec 9) ===================== */
if (runs("pov")) {
  console.log("\n— POV donması (dev · /lab/zone)");
  await fetch(`${BASE}/tr/lab/zone`).catch(() => {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(90000);
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(`${BASE}/tr/lab/zone`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__ZONE_STATS__?.().canvases === 1);
  await page.waitForTimeout(1200);

  const stats = () => page.evaluate(() => window.__ZONE_STATS__());
  /** Karakterin önündeki halkaya ışınlan: ölçülen şey donma, yürüyüş değil. */
  await page.evaluate(() => window.__ZONE_TELEPORT__(-5.6, -4));
  await page.waitForTimeout(700);

  /* --- (a) ÖNCE: POV DIŞINDA bu değerler gerçekten DEĞİŞİYOR mu?
         Bu adım olmadan "POV'da donuyor" bir şey kanıtlamaz — hiç güncellenmeyen
         bozuk bir alan da donmuş görünür. */
  const zoneA = await stats();
  await page.waitForTimeout(700);
  const zoneB = await stats();
  const mA = zoneA.markers.menu, mB = zoneB.markers.menu;
  ok(mA && mB, "halka ölçülebiliyor (markers alanı dolu)");
  ok(mA.ringRot !== mB.ringRot, "POV DIŞINDA halka dönüyor (ölçüm canlı)",
    `ringRot ${mA.ringRot} → ${mB.ringRot}`);
  ok(mA.pulseScale !== mB.pulseScale, "POV DIŞINDA nabız atıyor (ölçüm canlı)",
    `pulseScale ${mA.pulseScale} → ${mB.pulseScale}`);

  // Yürüyünce ayak izi basılıyor mu (ölçüm canlı)
  await page.keyboard.down("w");
  await page.waitForTimeout(700);
  await page.keyboard.up("w");
  const walked = await stats();
  ok(walked.footprints.visible > 0, "POV DIŞINDA ayak izi basılıyor (ölçüm canlı)",
    `görünür ${walked.footprints.visible} · en koyu ${walked.footprints.max}`);

  // Halkanın üstüne geri dön
  await page.evaluate(() => window.__ZONE_TELEPORT__(-5.6, -4));
  await page.waitForTimeout(500);
  ok((await stats()).nearFrame === "menu", "halkanın üstünde (prompt açık)");

  /* --- (b) POV'a gir. Tuş BASILI girilir: çıkışta karakterin kendiliğinden yürümemesi
         de aynı anda sınanır (`releaseAllInput` store aboneliği). */
  await page.keyboard.down("w");
  await page.keyboard.press("e");
  await page.waitForTimeout(1400);       // POV lerp'inin oturması
  ok((await stats()).zoneState === "pov", "POV açıldı");

  const povA = await stats();
  await page.waitForTimeout(900);        // POV'DA: tuş hâlâ basılı
  const povB = await stats();
  await page.keyboard.up("w");

  ok(povA.char.x === povB.char.x && povA.char.z === povB.char.z,
    "POV'da karakter YÜRÜMÜYOR (tuş basılıyken bile)",
    `x ${povA.char.x}→${povB.char.x} · z ${povA.char.z}→${povB.char.z}`);
  ok(povA.char.ang === povB.char.ang, "POV'da karakter DÖNMÜYOR",
    `ang ${povA.char.ang.toFixed(4)} → ${povB.char.ang.toFixed(4)}`);
  ok(povA.lastStepRot === povB.lastStepRot, "POV'da YENİ ayak izi basılmıyor",
    `lastStepRot ${povA.lastStepRot} → ${povB.lastStepRot}`);
  /* Gözlem (puanlanmıyor): spec "ayak izi durur" diyor. YENİ iz basılmıyor — ölçüldü.
     Ama havuzdaki izlerin SÖNMESİ devam ediyor mu? `Footprints` sönme döngüsünü POV'da
     da sürdürüyor. Karar planlayıcıda: donmuş bir iz izi mi, yoksa sönmeye devam mı? */
  console.log(`    · gözlem — POV'da mevcut izlerin sönmesi: en koyu ${povA.footprints.max} → ${povB.footprints.max}` +
    ` (görünür ${povA.footprints.visible} → ${povB.footprints.visible})`);

  const pA = povA.markers.menu, pB = povB.markers.menu;
  ok(pA.ringRot === pB.ringRot, "POV'da halka DÖNMÜYOR (spec 9)", `ringRot ${pA.ringRot} sabit`);
  ok(pA.pulseScale === pB.pulseScale, "POV'da nabız DURDU (ölçek)", `pulseScale ${pA.pulseScale} sabit`);
  ok(pA.pulseOpacity === pB.pulseOpacity, "POV'da nabız DURDU (opaklık)", `pulseOpacity ${pA.pulseOpacity} sabit`);
  ok(pA.ringOpacity === pB.ringOpacity, "POV'da halka parlaklığı sabit", `ringOpacity ${pA.ringOpacity} sabit`);

  // Dört halkanın DÖRDÜ de donmalı — yalnız POV'daki değil.
  const frozenAll = ["menu", "crew", "mascot", "visit"].every(
    (id) => povA.markers[id].ringRot === povB.markers[id].ringRot,
  );
  ok(frozenAll, "POV'da DÖRT halkanın dördü de donuyor");

  // Sahne render'ı DURMUYOR (spec 9: kenarlarda görünmeye devam eder).
  const rendering = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n++; if (performance.now() - t0 < 600) requestAnimationFrame(tick); else res(n); };
    requestAnimationFrame(tick);
  }));
  ok(rendering > 20, "POV'da sahne render'ı DURMUYOR (spec 9)", `${rendering} kare / 0.6 sn`);

  /* --- (c) Çıkışta her şey geri geliyor mu? */
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);
  const outA = await stats();
  await page.waitForTimeout(700);
  const outB = await stats();
  ok(outA.zoneState === "zone", "Esc ile Zone'a dönüldü");
  ok(outA.markers.menu.ringRot !== outB.markers.menu.ringRot, "çıkışta halka yeniden dönüyor");
  ok(outA.char.x === outB.char.x && outA.char.z === outB.char.z,
    "çıkışta karakter KENDİLİĞİNDEN yürümüyor (basılı tuş bırakılmış)",
    `x ${outA.char.x} · z ${outA.char.z}`);

  ok(errs.length === 0, "konsol temiz", errs.slice(0, 2).join(" | "));
  await page.close();
}

/* ============================ 2 · KARE HIZI (spec 9) ============================ */
if (runs("fps")) {
  console.log("\n— kare hızı (production build · gerçek kullanıcı yolu)");

  /** Sayfanın İÇİNDE kare biriktirir; tek okumada döner (Kural 60 ②). */
  const START = () => {
    window.__FR__ = [];
    window.__FR_ON__ = true;
    let last = performance.now();
    const tick = (t) => {
      window.__FR__.push(t - last);
      last = t;
      if (window.__FR_ON__) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const STOP = () => {
    window.__FR_ON__ = false;
    const d = window.__FR__.slice(1);       // ilk delta kurulum gürültüsü
    if (!d.length) return null;
    const sorted = [...d].sort((a, b) => a - b);
    const sum = d.reduce((a, b) => a + b, 0);
    return {
      frames: d.length,
      seconds: +(sum / 1000).toFixed(2),
      fps: +(1000 / (sum / d.length)).toFixed(1),
      /** En yavaş %5'in fps'i — takılma buradan görünür, ortalamadan değil. */
      p95fps: +(1000 / sorted[Math.floor(sorted.length * 0.95)]).toFixed(1),
      longestMs: +sorted[sorted.length - 1].toFixed(1),
      /** `dt` kırpması ancak 50 ms'i AŞAN karelerde devreye girer. */
      clampedFrames: d.filter((x) => x > 50).length,
    };
  };

  const scenarios = [
    { name: "masaüstü 1440×810 dpr2", width: 1440, height: 810, dsf: 2, cpu: 1 },
    { name: "mobil 390×844 dpr3", width: 390, height: 844, dsf: 3, cpu: 1 },
    { name: "mobil 390×844 dpr3 · CPU 4×", width: 390, height: 844, dsf: 3, cpu: 4 },
    /* 4× hiçbir şeyi değiştirmedi. Bu tek başına "throttle çalışmıyor" da demek olabilirdi
       (Kural 60) — ayrı bir sonda ile throttle'ın GERÇEKTEN uygulandığı doğrulandı
       (saf JS döngüsü 80 → 326 → 827 ms). Öyleyse sahne CPU'ya bağlı değil; 20× ile
       payın nerede bittiği ölçülür. */
    { name: "mobil 390×844 dpr3 · CPU 20×", width: 390, height: 844, dsf: 3, cpu: 20, probe: true },
    /* Spec 9: "düşerse önce `setPixelRatio` 1.5". Bu kolun GERÇEKTEN işe yarayıp yaramadığı
       hiç ölçülmemişti. `dpr` = min(devicePixelRatio, 2) olduğu için tarayıcıya 1.5
       vermek doğrudan o kolu çeker. 20×'te CPU darboğazı varken kazanç yoksa, kol
       yalnızca DOLGU (fill-rate) darboğazında işe yarıyor demektir — bunu bilmek,
       gerçek bir telefonda takılma olursa hangi koldan çekileceğini belirler. */
    { name: "mobil 390×844 dpr1.5 · CPU 20×", width: 390, height: 844, dsf: 1.5, cpu: 20, probe: true },
  ];

  for (const sc of scenarios) {
    const page = await browser.newPage({
      viewport: { width: sc.width, height: sc.height },
      deviceScaleFactor: sc.dsf,
      isMobile: sc.width < 768,
      hasTouch: sc.width < 768,
    });
    page.setDefaultTimeout(90000);
    const errs = [];
    const bad = [];
    /* Belgeli TEK istisna (Kural 53: metin birebir eşleşir, geniş filtre YOK).
       `@react-three/fiber@9.7.0` kendi store'unda `new THREE.Clock()` kuruyor; three r183
       `Clock`'u deprecate etti ve kurulumda uyarı basıyor. Kaynak kütüphanede, bizim kodda
       değil — ve 9.7.0 son KARARLI sürüm (sonrası 10.x canary). Zone her açılışta bir kez
       görünür, işlevsel etkisi yok. Karar planlayıcıda; filtre dar tutuldu ki BAŞKA hiçbir
       uyarı gizlenmesin. */
    const KNOWN_WARN = "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";
    let knownWarns = 0;
    page.on("console", (m) => {
      if (m.type() !== "error" && m.type() !== "warning") return;
      if (m.text().trim() === KNOWN_WARN) { knownWarns++; return; }
      errs.push(m.text());
    });
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("response", (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });

    const cdp = await page.context().newCDPSession(page);
    if (sc.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: sc.cpu });

    await page.goto(`${PROD}/tr?nopreload=1`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-testid=zone-gate]");
    await page.locator("[data-testid=zone-gate]").click();
    await page.waitForSelector("[data-testid=zone-pick-misu]");
    const tGate = Date.now();
    await page.locator("[data-testid=zone-pick-misu]").click();
    await page.waitForSelector("[data-testid=zone-curtain][data-state=zone]", { timeout: 60000 });
    const loadMs = Date.now() - tGate;

    const gpu = await page.evaluate(() => {
      const gl = document.querySelector("canvas")?.getContext("webgl2");
      const d = gl?.getExtension("WEBGL_debug_renderer_info");
      return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : "?";
    });
    await page.waitForTimeout(900);          // sahne otursun

    // --- (1) boşta
    await page.evaluate(START);
    await page.waitForTimeout(2500);
    const idle = await page.evaluate(STOP);

    // --- (2) yürürken (kamera dönüyor, ayak izi basılıyor, sprite değişiyor)
    await page.keyboard.down("w");
    await page.keyboard.down("a");
    await page.evaluate(START);
    await page.waitForTimeout(2500);
    const walk = await page.evaluate(STOP);
    await page.keyboard.up("w");
    await page.keyboard.up("a");

    // --- (3) POV + sipariş tahtası (15 satır DOM sahnenin üstünde)
    await page.waitForTimeout(400);
    // menü halkasına git: x −5.6, z −4
    for (let i = 0; i < 60; i++) {
      const near = await page.locator("[data-testid=frame-prompt]").count();
      if (near) break;
      await page.keyboard.down("a"); await page.waitForTimeout(120); await page.keyboard.up("a");
      await page.keyboard.down("w"); await page.waitForTimeout(220); await page.keyboard.up("w");
    }
    let pov = null;
    if (await page.locator("[data-testid=frame-prompt]").count()) {
      await page.keyboard.press("e");
      await page.waitForSelector("[data-testid=order-board]", { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.evaluate(START);
      await page.waitForTimeout(2500);
      pov = await page.evaluate(STOP);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    const line = (l, m) => m
      ? `      ${l.padEnd(22)} ${String(m.fps).padStart(5)} fps · p95 ${String(m.p95fps).padStart(5)} · en uzun kare ${String(m.longestMs).padStart(6)} ms · 50 ms'i aşan ${m.clampedFrames}`
      : `      ${l.padEnd(22)} ölçülemedi`;
    console.log(`\n  ${sc.name}  (GPU: ${gpu})`);
    console.log(`      ${"sahne kurulumu".padEnd(22)} ${loadMs} ms (seçimden sahneye)`);
    console.log(line("boşta", idle));
    console.log(line("yürürken", walk));
    console.log(line("POV + sipariş tahtası", pov));

    const TARGET = 55;   // 60 fps hedefi; rAF tavanı ~60, ölçüm payı 5
    const clamped = idle.clampedFrames + walk.clampedFrames + (pov?.clampedFrames ?? 0);
    /* SONDA senaryoları puanlanmaz. 20× yavaşlatma gerçek bir cihaz değil, PAYIN nerede
       bittiğini gösteren bir sondadır; kabul kriteri yapmak "geçmesi gerekmeyen bir testi
       kırmızı yakmak" olurdu. Ölçüm yine de basılır — karar planlayıcıda. */
    if (sc.probe) {
      console.log(`      → SONDA (puanlanmıyor): boşta ${idle.fps} · yürürken ${walk.fps}` +
        `${pov ? ` · POV ${pov.fps}` : ""} fps · 50 ms'i aşan ${clamped} kare`);
    } else {
      ok(idle.fps >= TARGET, `${sc.name} · boşta ≥ ${TARGET} fps`, `${idle.fps}`);
      ok(walk.fps >= TARGET, `${sc.name} · yürürken ≥ ${TARGET} fps`, `${walk.fps}`);
      if (pov) ok(pov.fps >= TARGET, `${sc.name} · POV'da ≥ ${TARGET} fps`, `${pov.fps}`);
      // `dt` kırpması hiç devreye girmediyse simülasyon saati = duvar saati, ölçüm bozulmamış.
      ok(clamped === 0, `${sc.name} · 50 ms'i aşan kare yok (dt kırpması hiç çalışmadı)`, `${clamped} kare`);
    }
    ok(errs.length === 0, `${sc.name} · konsol temiz (bilinen fiber uyarısı hariç)`,
      errs.length ? errs.slice(0, 2).join(" | ") : `bilinen fiber uyarısı ×${knownWarns}`);
    ok(bad.length === 0, `${sc.name} · 4xx/5xx yok`, bad.slice(0, 2).join(" | "));
    await page.close();
  }
}

await browser.close();
console.log(`\n${pass}/${pass + fail} ${fail ? "✗" : "✓"}`);
process.exit(fail ? 1 : 0);
