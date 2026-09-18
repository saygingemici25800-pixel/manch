// Faz 5.5.3 kabul kriteri: yön takipli kamera + 4 açılık sprite (spec 3.1 ve 8).
//
// Spec'in adıyla andığı ÜÇ TUZAĞI doğrudan sınar:
//   (a) düz lerp ±π'de kamerayı ters yöne fırlatır
//   (b) tam 180°'de iki dönüş yönü eşit uzaklıkta — taraf seçilemezse titrer ya da hiç dönmez
//   (c) sabit yumuşatma katsayısı kare hızına bağımlı
// (a) ve (c) saf matematikle, (b) hem matematikle hem gerçek 180° dönüşle ölçülür.
//
// Kullanım: pnpm dev -p 3113 çalışırken → CHROME=<yol> node scripts/zone-camera-check.mjs
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3113";
const URL_ZONE = `${BASE}/tr/lab/zone`;

const PI = Math.PI;
const norm = (a) => (((a + PI) % (PI * 2)) + PI * 2) % (PI * 2) - PI;
const deg = (r) => (r * 180) / PI;
/** İki açı arasındaki en kısa fark, derece. */
const dd = (a, b) => Math.abs(deg(norm(a - b)));

let pass = 0;
let fail = 0;
const ok = (cond, label, extra = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}${extra ? "  — " + extra : ""}`);
  }
};

/** Sabotaj doğrulaması için bölüm filtresi: ONLY=math sadece saf matematiği koşar. */
const ONLY = process.env.ONLY ?? "";
const runs = (section) => !ONLY || ONLY === section;

const browser = await chromium.launch({ executablePath: process.env.CHROME });

// Dev sunucusu rotayı ilk istekte derliyor; ısıtmadan her bölüm 30 sn'lik varsayılana takılır.
await fetch(URL_ZONE).catch(() => {});

/* ============================ 1 · saf açı matematiği ============================ */
if (runs("math")) {
console.log("\n— açı matematiği (tuzak a, b, c)");
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(90000);
  await page.goto(URL_ZONE, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__ZONE_ANG__ != null);

  const m = await page.evaluate(() => {
    const { angLerp, normalizeAngle, smoothing, viewFor, mirrorFor } = window.__ZONE_ANG__;
    const P = Math.PI;

    // (a) ±π sınırını KISA yoldan geç: 3.0 → −3.0 gerçekte 0.283 rad'lık bir adım.
    const wrap = angLerp(3.0, -3.0, 0.5);

    // (b) tam 180°: taraf seçilemezse 0 (hiç dönmez) ya da işaret değiştirir (titrer).
    const halfTurn = angLerp(0, P, 0.5);
    // 40 adımda tekdüze ilerlemeli — hiçbir adım geri gitmemeli
    let a = 0;
    let monotone = true;
    let prev = 0;
    for (let i = 0; i < 40; i++) {
      a = angLerp(a, P, 0.25);
      if (a < prev - 1e-12) monotone = false;
      prev = a;
    }

    // (c) kare hızından bağımsızlık: 120 Hz'de iki adım === 60 Hz'de bir adım
    const s120 = smoothing(0.15, 1 / 120);
    const s60 = smoothing(0.15, 1 / 60);
    const composed = 1 - (1 - s120) ** 2;

    return {
      wrapStep: Math.abs(normalizeAngle(wrap - 3.0)),
      wrapOutside: Math.abs(wrap) > 3.0,
      halfTurn,
      monotone,
      after40: a,
      rateErr: Math.abs(composed - s60),
      normRange: [normalizeAngle(7), normalizeAngle(-7), normalizeAngle(P * 3)],
      // açı → görünüm kovaları (spec 8.1): |rel| 0 = sırt … π = yüz
      buckets: [0, P / 4, P / 2, (P * 3) / 4, P].map((r) => viewFor(r)),
      // aynalama yalnızca asimetrik görünümlerde ve yalnızca negatif tarafta
      mirrors: {
        sideNeg: mirrorFor(-P / 2, "side"),
        sidePos: mirrorFor(P / 2, "side"),
        backNeg: mirrorFor(-0.1, "back"),
        frontNeg: mirrorFor(-P, "front"),
      },
    };
  });

  ok(Math.abs(m.wrapStep - 0.1416) < 1e-3 && m.wrapOutside,
    "(a) ±π sınırında kısa yol — 3.0 → −3.0 adımı 0.14 rad",
    `adım ${m.wrapStep.toFixed(4)}, sonuç sarmalandı: ${m.wrapOutside}`);
  ok(Math.abs(m.halfTurn) > 1.5,
    "(b) tam 180°'de beraberlik bozuluyor — angLerp(0, π, .5) sıfır DEĞİL",
    `sonuç ${m.halfTurn.toFixed(4)}`);
  ok(m.monotone && Math.abs(m.after40 - PI) < 0.01,
    "(b) 40 adımda tekdüze dönüş, titremiyor",
    `40 adım sonra ${m.after40.toFixed(4)} (π bekleniyor), tekdüze: ${m.monotone}`);
  ok(m.rateErr < 1e-12,
    "(c) yumuşatma kare hızından bağımsız — 2×(1/120) === 1×(1/60)",
    `fark ${m.rateErr}`);
  ok(m.normRange.every((v) => v >= -PI && v <= PI),
    "normalizeAngle çıktısı −π..π");
  ok(JSON.stringify(m.buckets) === JSON.stringify(["back", "back34", "side", "front", "front"]),
    "açı → görünüm eşlemesi: 4 çizim, 5 kova (spec 8.1)",
    m.buckets.join(", "));
  ok(m.mirrors.sideNeg && !m.mirrors.sidePos && !m.mirrors.backNeg && !m.mirrors.frontNeg,
    "aynalama kuralı: yalnız negatif taraf, yalnız asimetrik görünüm",
    JSON.stringify(m.mirrors));
  await page.close();
}

/* ============================== 2 · sahnede dönüş ============================== */
async function openZone(opts = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, ...opts });
  // Dev sunucusu ilk derlemede yavaş; varsayılan 30 sn yetmiyor.
  page.setDefaultTimeout(90000);
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  const bad = [];
  page.on("response", (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().replace(BASE, "")}`); });
  await page.goto(URL_ZONE, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__ZONE_STATS__ != null);
  await page.waitForTimeout(1500);
  return { page, errs, bad };
}

const read = (page) => page.evaluate(() => window.__ZONE_STATS__());

/** Tuş(lar)ı basılı tutarken periyodik örnek alır. */
async function hold(page, keys, ms, step = 90) {
  const list = Array.isArray(keys) ? keys : [keys];
  const samples = [];
  for (const k of list) await page.keyboard.down(k);
  for (let t = 0; t < ms; t += step) {
    await page.waitForTimeout(step);
    samples.push(await read(page));
  }
  for (const k of list) await page.keyboard.up(k);
  await page.waitForTimeout(250);
  samples.push(await read(page));
  return samples;
}

/** Belirli bir açıya yerleşene kadar yürü (testler arası temiz başlangıç). */
async function settle(page, keys, ms = 3000) {
  await hold(page, keys, ms);
  await page.waitForTimeout(300);
}

if (runs("scene")) {
  console.log("\n— sahnede yön takibi");
  const { page, errs, bad } = await openZone();

  const start = await read(page);
  ok(dd(start.cam.ang, PI) < 1 && dd(start.char.ang, PI) < 1,
    "başlangıç: kamera ve karakter 180° (künyeye bakar)",
    `kamera ${deg(start.cam.ang).toFixed(0)}° karakter ${deg(start.char.ang).toFixed(0)}°`);
  ok(start.view === "back" && start.mirrored === false,
    "başlangıç sprite'ı 'back', aynalanmamış", `görünen: ${start.view}`);

  /* --- aşağı: tam 180° dönüş. Spec'in "aşağı çekince arkaya dönmüyor" vakası. --- */
  const down = await hold(page, "ArrowDown", 3600);
  const end = down.at(-1);
  ok(dd(end.cam.ang, 0) < 12,
    "AŞAĞI: kamera 180° dönüyor (180° → 0°)",
    `kamera ${deg(norm(end.cam.ang)).toFixed(0)}°`);

  // Fırlama yok. İki ayrı ölçüt:
  //  · konum sıçraması — düz lerp ±π'de kamerayı karakterin ÖBÜR yanına atardı,
  //    bu 2·CAM_DIST ≈ 10.8 birimlik bir sıçrama demek. Eşik 4: meşru orbit hızının
  //    (~1.7 birim/örnek, yavaş örneklerde 2.7) üstünde, fırlamanın çok altında.
  //  · açı işareti — dönüş boyunca yön DEĞİŞTİRMEMELİ. Tam 180°'de beraberlik
  //    bozulmasaydı işaret her karede değişirdi (titreme). Bu, tuzak (b)'nin
  //    sahnedeki doğrudan ölçüsü.
  const jumps = [];
  const outside = [];
  const deltas = [];
  for (let i = 1; i < down.length; i++) {
    const a = down[i - 1];
    const b = down[i];
    jumps.push(Math.hypot(b.cam.x - a.cam.x, b.cam.z - a.cam.z));
    if (Math.abs(b.cam.x) > 6.51 || Math.abs(b.cam.z) > 19.21) outside.push(`x${b.cam.x} z${b.cam.z}`);
    const d = deg(norm(b.cam.ang - a.cam.ang));
    if (Math.abs(d) > 0.5) deltas.push(Math.sign(d));
  }
  const flips = deltas.filter((v, i) => i > 0 && v !== deltas[i - 1]).length;
  ok(Math.max(...jumps) < 4.0,
    "dönüş boyunca kamera ışınlanmıyor (sıçrama < 4 birim; ters yöne atlasa 10.8 olurdu)",
    `en büyük sıçrama ${Math.max(...jumps).toFixed(2)}`);
  ok(flips === 0,
    "(b) dönüş tek yönde ilerliyor — kamera 180°'de titremiyor",
    `${flips} yön değişimi`);
  ok(outside.length === 0,
    "dönüş boyunca kamera duvarın içine girmiyor",
    outside.slice(0, 3).join(" · "));

  // Karakter kameradan hızlı döner; aradaki fark sprite'ı 'back'ten çıkarır.
  // İki tabanın (0.02 / 0.15) ürettiği en büyük ayrışma ~47° — yani 'back34'.
  // Sabit katsayıya kaçılırsa ya da iki taban eşitlenirse bu ayrışma kaybolur.
  const seen = new Set(down.map((s) => s.view));
  const spread = Math.max(...down.map((s) => dd(s.char.ang, s.cam.ang)));
  ok(seen.size > 1 && seen.has("back34"),
    "dönüş sırasında sprite açıya göre değişiyor (back → back34)",
    `görülen: ${[...seen].join(", ")}`);
  ok(spread > 25 && spread < 70,
    "karakter kameradan hızlı dönüyor — ayrışma 25–70° bandında",
    `en büyük ayrışma ${spread.toFixed(0)}°`);
  ok(down.at(-1).view === "back",
    "dönüş bitince sprite yine 'back' (ikisi aynı yöne yerleşti)",
    `görünen: ${down.at(-1).view}`);

  // Dönüş süresi: TURN_BASE 0.15 → 180° ≈ 1.2 sn. Sabit katsayıya kaçılırsa bu bozulur.
  const firstDone = down.findIndex((s) => dd(s.cam.ang, 0) < 12);
  const turnMs = firstDone < 0 ? null : (firstDone + 1) * 90;
  ok(turnMs !== null && turnMs > 600 && turnMs < 2600,
    "180° dönüş ~1.2 sn (600–2600 ms arası)",
    `ölçülen ${turnMs} ms`);

  /* --- billboard: sprite her karede kameraya dönmeli (spec 8.3) ---
     Prototipte bu adım yazılmamıştı (`rotation.y` hep 0): kamera karakterin öbür yanına
     geçtiği anda düzlemin arka yüzü görünür ve `FrontSide` onu kırpar — karakter kaybolur.
     Yön takipli kamerada bu her 180° dönüşte oluyor, yani bu test o kaybolmayı yakalar. */
  const rotYs = down.map((s) => s.heroRotY).filter((v) => v != null);
  const aimErr = down
    .filter((s) => s.heroRotY != null)
    .map((s) => dd(s.heroRotY, Math.atan2(s.cam.x - s.char.x, s.cam.z - s.char.z)));
  // Eşik 8°: sprite kameradan bir kare geride yönlenir (Character simülasyon adımı,
  // FollowCamera ondan sonra kamerayı taşır) — dönüşün en hızlı anında ~3° sapma normal
  // ve gözle görülmez. Billboard hiç yapılmasaydı sapma 180°'e kadar çıkardı.
  ok(rotYs.length > 0 && Math.max(...aimErr) < 8,
    "billboard: sprite her karede kameraya dönüyor",
    `en büyük sapma ${Math.max(...aimErr).toFixed(1)}°`);
  ok(rotYs.length > 0 && Math.max(...rotYs.map((v) => dd(v, rotYs[0]))) > 60,
    "billboard açısı dönüş boyunca gerçekten değişiyor (0'da takılı değil)",
    `değişim ${rotYs.length ? Math.max(...rotYs.map((v) => dd(v, rotYs[0]))).toFixed(0) : "-"}°`);

  /* --- girdi bitince kamera yerinde kalır (spec 3.1) --- */
  const held = (await read(page)).cam.ang;
  await page.waitForTimeout(1200);
  const later = (await read(page)).cam.ang;
  ok(dd(held, later) < 0.5,
    "girdi bitince kamera yerinde kalır, eski yönüne dönmez",
    `${deg(held).toFixed(1)}° → ${deg(later).toFixed(1)}°`);

  /* --- dört yön --- */
  const dirs = [
    ["ArrowRight", 90, "SAĞ"],
    ["ArrowUp", 180, "YUKARI"],
    ["ArrowLeft", -90, "SOL"],
    ["ArrowDown", 0, "AŞAĞI"],
  ];
  for (const [key, want, label] of dirs) {
    const s = await hold(page, key, 3600);
    const got = deg(norm(s.at(-1).cam.ang));
    ok(dd(s.at(-1).cam.ang, (want * PI) / 180) < 12,
      `${label}: kamera ${want}° yönüne dönüyor`,
      `ölçülen ${got.toFixed(0)}°`);
  }

  /* --- aynalama: dönüş yönüne göre (spec 8.1) ---
     180°'den ÇAPRAZ girdiyle 135°'lik dönüş: ayrışma ~35°, yani 'back34' kovası.
     (90°'lik dönüş yalnızca ~23° ayrışma üretiyor — kova sınırının dibinde, ölçüm oynak.)
     Aşağı+sağ → hedef 45°, negatif yönde dönüş → rel < 0 → AYNALI.
     Aşağı+sol  → hedef 315°, pozitif yönde dönüş → rel > 0 → aynalanmaz. */
  await settle(page, "ArrowUp");
  const negTurn = await hold(page, ["ArrowDown", "ArrowRight"], 1200, 60);
  const mirroredNeg = negTurn.some((s) => s.mirrored);

  await settle(page, "ArrowUp");
  const posTurn = await hold(page, ["ArrowDown", "ArrowLeft"], 1200, 60);
  const mirroredPos = posTurn.some((s) => s.mirrored);

  ok(mirroredNeg && !mirroredPos,
    "aynalama dönüş yönüne göre — tek çizim seti iki yönü veriyor",
    `negatif yön: ${mirroredNeg} · pozitif yön: ${mirroredPos}`);

  /* --- karakter salonun dışına çıkmıyor --- */
  const far = await hold(page, "ArrowLeft", 3600);
  ok(Math.abs(far.at(-1).char.x) <= 6.21,
    "karakter yan duvarı geçmiyor (|x| ≤ 6.2)",
    `x ${far.at(-1).char.x}`);

  /* --- sprite kaynağı raporlanıyor (çizimler gelince 'png' olacak) --- */
  const src = (await read(page)).spriteSource;
  ok(src === "drawn" || src === "png", `sprite kaynağı raporlanıyor: ${src}`);

  const cleanErrs = errs.filter((e) => !/Download the React DevTools/.test(e));
  ok(cleanErrs.length === 0, "konsol temiz", cleanErrs.slice(0, 2).join(" | "));
  ok(bad.length === 0, "4xx/5xx istek yok (Kural 53)", bad.slice(0, 3).join(" · "));
  await page.close();
}

/* =========================== 3 · prefers-reduced-motion =========================== */
if (runs("reduced")) {
  console.log("\n— reduced motion");
  const { page } = await openZone({ reducedMotion: "reduce" });
  const before = await read(page);
  const s = await hold(page, "ArrowDown", 2400);
  const after = s.at(-1);

  ok(dd(before.cam.ang, after.cam.ang) < 0.5,
    "reduced-motion: kamera HİÇ dönmüyor (spec 3.1)",
    `${deg(before.cam.ang).toFixed(1)}° → ${deg(after.cam.ang).toFixed(1)}°`);
  ok(dd(before.char.ang, after.char.ang) > 30,
    "reduced-motion: karakter yine de dönüyor — sprite açısı güncellenmeli",
    `${deg(before.char.ang).toFixed(1)}° → ${deg(after.char.ang).toFixed(1)}°`);
  ok(after.char.z > before.char.z + 1,
    "reduced-motion: yürüme çalışıyor",
    `z ${before.char.z} → ${after.char.z}`);
  await page.close();
}

await browser.close();
console.log(`\n${pass}/${pass + fail} ✓${fail ? `  — ${fail} BAŞARISIZ` : ""}`);
process.exit(fail ? 1 : 0);
