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
/** Ölçüm penceresi başlat: tepe ayrışma ve görülen kovalar sıfırlanır. */
const resetDebug = (page) => page.evaluate(() => window.__ZONE_DEBUG_RESET__?.());

/**
 * Tuş(lar)ı basılı tutarken periyodik örnek alır.
 *
 * Her örneğe **gerçek zaman damgası** konur: `page.evaluate` gidiş-dönüşü `step`in üstüne
 * 20–40 ms ekliyor, dolayısıyla "örnek no × step" gerçek süreyi olduğundan kısa gösteriyordu
 * (180° dönüş 1.4 sn sürerken 585 ms ölçülüyordu).
 */
async function hold(page, keys, ms, step = 90) {
  const list = Array.isArray(keys) ? keys : [keys];
  const samples = [];
  for (const k of list) await page.keyboard.down(k);
  const t0 = Date.now();
  for (let t = 0; t < ms; t += step) {
    await page.waitForTimeout(step);
    samples.push({ ...(await read(page)), t: Date.now() - t0 });
  }
  for (const k of list) await page.keyboard.up(k);
  await page.waitForTimeout(250);
  samples.push({ ...(await read(page)), t: Date.now() - t0 });
  return samples;
}

/** 8 yönden hedefe en yakın olanın tuşları (derece; 0 = +z, 90 = +x). */
function inputForTarget(targetDeg) {
  const dirs = [
    [0, ["ArrowDown"]], [45, ["ArrowDown", "ArrowRight"]], [90, ["ArrowRight"]],
    [135, ["ArrowUp", "ArrowRight"]], [180, ["ArrowUp"]], [225, ["ArrowUp", "ArrowLeft"]],
    [270, ["ArrowLeft"]], [315, ["ArrowDown", "ArrowLeft"]],
  ];
  const want = ((targetDeg % 360) + 360) % 360;
  let best = dirs[0];
  let bestD = 999;
  for (const d of dirs) {
    const diff = Math.abs(((d[0] - want + 180) % 360 + 360) % 360 - 180);
    if (diff < bestD) { bestD = diff; best = d; }
  }
  return best[1];
}

/**
 * Koşul sağlanana kadar tuşu basılı tut. Sabit süreli `hold` sahne ağırlaştıkça yetmiyordu:
 * `dt` 50 ms'te kırpıldığı için düşük kare hızında dünya gerçek zamandan yavaş ilerliyor,
 * 3.6 sn'lik tutuş 180°'yi tamamlamıyordu. Koşula bağlamak kare hızından bağımsızdır.
 */
async function holdUntil(page, keys, done, maxMs = 12000, step = 90) {
  const list = Array.isArray(keys) ? keys : [keys];
  const samples = [];
  for (const k of list) await page.keyboard.down(k);
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    await page.waitForTimeout(step);
    const s = { ...(await read(page)), t: Date.now() - t0 };
    samples.push(s);
    if (done(s)) break;
  }
  for (const k of list) await page.keyboard.up(k);
  await page.waitForTimeout(250);
  samples.push({ ...(await read(page)), t: Date.now() - t0 });
  return samples;
}

/** Belirli bir açıya yerleşene kadar yürü (testler arası temiz başlangıç). */
async function settle(page, keys, ms = 3000) {
  await hold(page, keys, ms);
  await page.waitForTimeout(300);
}

/** 180°'e (künyeye) yerleş — kare hızından bağımsız. */
async function settleBack(page) {
  await holdUntil(page, "ArrowUp", (s) => dd(s.cam.ang, PI) < 8);
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
  await resetDebug(page);
  const down = await holdUntil(page, "ArrowDown", (s) => dd(s.cam.ang, 0) < 12);
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
    // MESAFE değil HIZ: dev sunucusu takıldığında örnek arası 300 ms'e çıkıyor ve meşru
    // hareket "sıçrama" gibi görünüyordu. Ters yöne atlama tek karede olur: 10.8 birim /
    // 16 ms ≈ 675 birim/sn. Meşru tepe ~19 birim/sn (orbit 14 + yürüme 4.6).
    const secs = Math.max(0.001, (b.t - a.t) / 1000);
    jumps.push(Math.hypot(b.cam.x - a.cam.x, b.cam.z - a.cam.z) / secs);
    if (Math.abs(b.cam.x) > 6.51 || Math.abs(b.cam.z) > 19.21) outside.push(`x${b.cam.x} z${b.cam.z}`);
    const d = deg(norm(b.cam.ang - a.cam.ang));
    if (Math.abs(d) > 0.5) deltas.push(Math.sign(d));
  }
  const flips = deltas.filter((v, i) => i > 0 && v !== deltas[i - 1]).length;
  ok(Math.max(...jumps) < 60,
    "dönüş boyunca kamera ışınlanmıyor (hız < 60 birim/sn; ters yöne atlasa ~675 olurdu)",
    `en büyük hız ${Math.max(...jumps).toFixed(1)} birim/sn`);
  ok(flips === 0,
    "(b) dönüş tek yönde ilerliyor — kamera 180°'de titremiyor",
    `${flips} yön değişimi`);
  ok(outside.length === 0,
    "dönüş boyunca kamera duvarın içine girmiyor",
    outside.slice(0, 3).join(" · "));

  // Tepe ayrışma ve kovalar KARE DÖNGÜSÜNDEN okunur (örnekleme tepeyi kaçırıyordu).
  const last = down.at(-1);
  const seen = new Set(Object.entries(last.seenViews).filter(([, v]) => v).map(([k]) => k));
  const spread = deg(last.peakSpread);
  ok(seen.size > 1 && seen.has("back34"),
    "dönüş sırasında sprite açıya göre değişiyor (back → back34)",
    `görülen: ${[...seen].join(", ")}`);
  // `side` kovası 67.5°'de başlar. CHAR_TURN_BASE 0.002 ile tepe ayrışma 74.2° — 6.7° pay var.
  // Taban büyütülürse (0.005 → 65.2°) bu kova ÖLÜR ve çizerden istenen 8 çizimin ikisi boşa gider.
  ok(seen.has("side"),
    "180° dönüşte `side` kovası en az bir kare tetikleniyor",
    `görülen: ${[...seen].join(", ")}`);
  ok(spread > 70 && spread < 85,
    "karakter kameradan hızlı dönüyor — tepe ayrışma 70–85° (beklenen 74.2°)",
    `en büyük ayrışma ${spread.toFixed(1)}°`);
  ok(down.at(-1).view === "back",
    "dönüş bitince sprite yine 'back' (ikisi aynı yöne yerleşti)",
    `görünen: ${down.at(-1).view}`);

  // Dönüş süresi: TURN_BASE 0.15 → 180° ≈ 1.2 sn. Sabit katsayıya kaçılırsa bu bozulur.
  // SİMÜLASYON saniyesi — duvar saati değil (bkz. `debug.simTime`).
  const firstDone = down.find((s) => dd(s.cam.ang, 0) < 12);
  const turnMs = firstDone ? firstDone.simTime * 1000 : null;
  ok(turnMs !== null && turnMs > 600 && turnMs < 2600,
    "180° dönüş ~1.2 sn simülasyon süresi (600–2600 ms)",
    `ölçülen ${turnMs === null ? "-" : turnMs.toFixed(0)} ms sim`);

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
    const target = (want * PI) / 180;
    const s = await holdUntil(page, key, (x) => dd(x.cam.ang, target) < 12);
    const got = deg(norm(s.at(-1).cam.ang));
    ok(dd(s.at(-1).cam.ang, (want * PI) / 180) < 12,
      `${label}: kamera ${want}° yönüne dönüyor`,
      `ölçülen ${got.toFixed(0)}°`);
  }

  /* --- aynalama (spec 8.1) ---
     ÖNCEKİ HÂLİ KIRILGANDI: "aşağı+sağ negatif yönde döner" diye VARSAYIYORDU. Dönüş yönü
     o anki `camAng`'a bağlı; testin başlangıç açısı birkaç saniyelik yürüyüşün sonunda
     tam 180° olmayabiliyor ve varsayım ara sıra ters dönüyordu (koşular arası oynak sonuç).
     Onun yerine KURALIN KENDİSİ ölçülüyor — her örnekte:
         mirrored  ⇔  rel < 0 ve görünüm asimetrik (back/front değil)
     Bu, dönüşün hangi yöne gittiğinden bağımsızdır. İki çapraz dönüş, iki işareti de görsün diye. */
  const turns = [];
  for (const delta of [-135, +135]) {
    await settleBack(page);
    // Dönüş yönü, o anki kamera açısına göre BELİRLENİR — sabit tuş çifti varsaymak,
    // başlangıç açısı birkaç derece kaydığında yönü ters çeviriyordu (oynak test).
    const from = deg(norm((await read(page)).cam.ang));
    turns.push(...(await hold(page, inputForTarget(from + delta), 1200, 60)));
  }
  const rule = (s) => {
    const rel = norm(s.char.ang - s.cam.ang);
    return s.mirrored === (rel < 0 && s.view !== "back" && s.view !== "front");
  };
  const broken = turns.filter((s) => !rule(s));
  const sawMirrored = turns.some((s) => s.mirrored);
  const sawPlain = turns.some((s) => !s.mirrored && norm(s.char.ang - s.cam.ang) > 0 && s.view === "back34");

  ok(broken.length === 0,
    "aynalama kuralı sahnede birebir uygulanıyor (rel < 0 ∧ asimetrik görünüm)",
    `${broken.length}/${turns.length} örnek kuralı bozdu`);
  ok(sawMirrored && sawPlain,
    "iki dönüş yönü de görüldü — tek çizim seti iki yönü veriyor",
    `aynalı örnek: ${sawMirrored} · aynasız (rel>0) örnek: ${sawPlain}`);

  /* --- karakter salonun dışına çıkmıyor --- */
  const far = await hold(page, "ArrowLeft", 3600);
  ok(Math.abs(far.at(-1).char.x) <= 6.21,
    "karakter yan duvarı geçmiyor (|x| ≤ 6.2)",
    `x ${far.at(-1).char.x}`);

  /* ========================= 5.5.4: ayak izleri + NPC ========================= */

  /* İzin dönüşü HAREKET yönünden gelmeli, kamera yönünden değil (spec 8.3).
     Ayrım yapabilmek için ikisinin farklı olduğu ana bakıyoruz: 180°'e yerleştikten hemen
     sonra sağa yürümek — karakter sağa döner, kamera hâlâ geride. İz kamerayı takip etse
     ~180°, hareketi takip ederse ~270° çıkar. */
  await settle(page, "ArrowUp");
  const right = await hold(page, "ArrowRight", 700, 45);
  const rots = right.map((s) => s.lastStepRot).filter((v) => v != null);
  const lastRot = rots.at(-1);
  const camThen = right.at(-1).cam.ang;
  ok(
    lastRot != null && dd(lastRot, Math.PI * 1.5) < 35,
    "ayak izi dönüşü HAREKET yönünden (kamera yönünden değil)",
    `iz ${lastRot == null ? "-" : deg(norm(lastRot)).toFixed(0)}° · kamera ${deg(norm(camThen)).toFixed(0)}° · beklenen ~270°`,
  );
  ok(lastRot != null && dd(lastRot, camThen) > 20,
    "iz dönüşü kamera açısından AYRI (aynı olsaydı kamerayı takip ediyor olurdu)",
    `fark ${lastRot == null ? "-" : dd(lastRot, camThen).toFixed(0)}°`);

  /* Basılıyor · kadrajda · sönüyor.
     ÖNCE açık zemine geç: karakter arka duvara dayalıyken (önceki testler onu oraya
     götürüyor) girdi sürse de ilerlemiyor ve iz basılmıyor — bu doğru davranış, ama
     testin ölçmek istediği şey değil. */
  await settle(page, "ArrowDown", 1500);
  const walking = await hold(page, "ArrowDown", 1400, 90);
  const peakVisible = Math.max(...walking.map((s) => s.footprints?.visible ?? 0));
  const peakOnScreen = Math.max(...walking.map((s) => s.footprints?.onScreen ?? 0));
  ok(peakVisible >= 4, "yürürken ayak izi basılıyor", `en çok ${peakVisible} iz canlı`);
  ok(peakOnScreen >= 1,
    "izlerden en az biri kadrajda (kamera karakterin önüne bakıyor — çoğu arkada kalır)",
    `en çok ${peakOnScreen} iz ekranda`);

  await page.waitForTimeout(4200); // 0.85 opaklık, saniyede 0.28 → ~3 sn
  const faded = await read(page);
  ok(faded.footprints?.visible === 0,
    "durunca izler tamamen sönüyor (havuz yeniden kullanılabilir)",
    `kalan ${faded.footprints?.visible}`);

  /* NPC: konum, idle, billboard */
  const npc1 = (await read(page)).npc;
  ok(npc1 && Math.abs(npc1.x - -3.2) < 0.01 && Math.abs(npc1.z - -12) < 0.01,
    "NPC salonun dibinde (x −3.2, z −12)", JSON.stringify(npc1));

  // Idle bir sinüs (periyot ~3.14 sn, genlik 0.04). İKİ örnek yetmez: 500 ms arayla aynı
  // değere düşebiliyor (sinüs tepe çevresinde simetrik) ve test boşuna kırmızı yanıyordu.
  // Yarım periyodu tarayıp salınım genişliğine bakıyoruz.
  const ys = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(200);
    ys.push((await read(page)).npc?.y ?? 0);
  }
  const swing = Math.max(...ys) - Math.min(...ys);
  ok(swing > 0.015,
    "NPC idle: yerinde hafifçe süzülüyor",
    `salınım ${swing.toFixed(3)} (genlik 0.04 · en az 0.04 beklenir)`);
  {
    const st = await read(page);
    const aim = Math.atan2(st.cam.x - st.npc.x, st.cam.z - st.npc.z);
    ok(dd(st.npc.rotY, aim) < 3,
      "NPC de billboard yapıyor (kamera etrafından dolaşabiliyor)",
      `sapma ${dd(st.npc.rotY, aim).toFixed(1)}°`);
  }

  /* ===================== 5.5.5: çerçeveler + halka + prompt ===================== */

  const STOPS = { menu: [-5.6, -4], crew: [5.6, -4], mascot: [-5.6, 6], visit: [5.6, 6] };
  const tp = (x, z) => page.evaluate(({ x, z }) => window.__ZONE_TELEPORT__(x, z), { x, z });
  const promptId = () =>
    page.evaluate(() => document.querySelector("[data-testid=frame-prompt]")?.dataset.frame ?? null);

  let stopsOk = true;
  const stopDetail = [];
  for (const [id, [x, z]] of Object.entries(STOPS)) {
    await tp(x, z);
    await page.waitForTimeout(400);
    const near = (await read(page)).nearFrame;
    const shown = await promptId();
    if (near !== id || shown !== id) stopsOk = false;
    stopDetail.push(`${id}:${near}/${shown}`);
  }
  ok(stopsOk, "dört durma noktası doğru çerçeveyi ve promptu açıyor", stopDetail.join(" · "));

  /* Kural 44/55: `drei/<Html>` sahne ağacının içinde ama DOM'a portal ediliyor. next-intl
     context'i oraya ULAŞIYOR mu? Ulaşmasaydı `MISSING_MESSAGE` konsola düşer ve ekranda
     anahtarın kendisi ("frames.menu") görünürdü. Metni doğrudan denetliyoruz. */
  await tp(...STOPS.menu);
  await page.waitForTimeout(400);
  const promptText = await page.locator("[data-testid=frame-prompt]").innerText();
  ok(/SİPARİŞ VER/i.test(promptText) && !/frames\./.test(promptText),
    "prompt metni i18n'den geliyor (Html portalına next-intl context'i ulaşıyor)",
    JSON.stringify(promptText));

  /* Prompt, karakter duvara TAM dayalıyken bile tablo görselinin hiçbir pikseliyle
     örtüşmemeli (karar 2026-09-18). Görselin ekran dikdörtgeni sahneden projelendirilip
     prompt'un DOM dikdörtgeniyle karşılaştırılır. */
  let worstGap = Infinity;
  const gapDetail = [];
  for (const [id, [sx, sz]] of Object.entries(STOPS)) {
    const side = Math.sign(sx);
    await tp(side * 3, sz);
    await page.keyboard.down(side < 0 ? "ArrowLeft" : "ArrowRight");
    await page.waitForTimeout(2000);
    await page.keyboard.up(side < 0 ? "ArrowLeft" : "ArrowRight");
    await page.waitForTimeout(800);
    const gap = await page.evaluate((fid) => {
      const art = window.__ZONE_ART_RECT__(fid);
      const el = document.querySelector("[data-testid=frame-prompt]");
      if (!art || !el) return null;
      const p = el.getBoundingClientRect();
      return Math.max(art.left - p.right, p.left - art.right, art.top - p.bottom, p.top - art.bottom);
    }, id);
    if (gap === null) { worstGap = -Infinity; gapDetail.push(`${id}:ölçülemedi`); continue; }
    worstGap = Math.min(worstGap, gap);
    gapDetail.push(`${id}:${gap.toFixed(0)}px`);
  }
  ok(worstGap > 0,
    "duvara dayalıyken prompt tablo görseliyle ÖRTÜŞMÜYOR (dört tabloda da)",
    gapDetail.join(" · "));

  /* Kabul kriteri: halkanın GÖRÜNÜR yarıçapı 2.3, tetikleme 2.6 — halkanın üstündeki her
     nokta tetiklemenin İÇİNDE olmalı. "Halkanın üstündeyim ama açılmadı" olmamalı. */
  const [mx, mz] = STOPS.menu;
  const onRing = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    // Duvara doğru taşanları salon içine çekmeye gerek yok: x sınırı −6.2, menu halkası
    // −5.6 merkezli; 2.3 yarıçapın duvar tarafı kırpılır, kırpılan nokta da halkanın üstüdür.
    await tp(mx + Math.cos(a) * 2.3, mz + Math.sin(a) * 2.3);
    await page.waitForTimeout(220);
    onRing.push((await read(page)).nearFrame);
  }
  ok(onRing.every((v) => v === "menu"),
    "halkanın üstündeki 8 noktanın hepsi tetikliyor (görünür 2.3 < tetikleme 2.6)",
    onRing.join(", "));

  await tp(mx, mz + 2.8);
  await page.waitForTimeout(400);
  const offRing = await read(page);
  ok(offRing.nearFrame === null && (await promptId()) === null,
    "halkanın dışında (2.8) prompt kapalı",
    `yakın ${offRing.nearFrame}`);

  /* E ile gir, Esc ile çık (spec 7.2) — POV görseli 5.5.6'da, durum makinesi şimdi çalışıyor */
  await tp(mx, mz);
  await page.waitForTimeout(400);
  await page.keyboard.press("e");
  await page.waitForTimeout(400);
  const inPov = await read(page);
  ok(inPov.zoneState === "pov", "E tuşu tabloya giriyor", `durum ${inPov.zoneState}`);
  ok((await promptId()) === null, "POV'da prompt gizleniyor");

  const povAng = inPov.cam.ang;
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(600);
  await page.keyboard.up("ArrowRight");
  const stillPov = await read(page);
  ok(dd(povAng, stillPov.cam.ang) < 0.5,
    "POV'da hareket girdileri kapalı (spec 6.1)",
    `${deg(povAng).toFixed(0)}° → ${deg(stillPov.cam.ang).toFixed(0)}°`);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const back = await read(page);
  ok(back.zoneState === "zone", "Esc POV'dan çıkıyor", `durum ${back.zoneState}`);
  ok(dd(povAng, back.cam.ang) < 0.5,
    "POV'a girip çıkmak `camAng`'ı bozmuyor (spec 6.1)",
    `${deg(povAng).toFixed(0)}° → ${deg(back.cam.ang).toFixed(0)}°`);

  /* ======================= 5.5.6: POV geçişi + FrameBoard ======================= */

  const focused = () =>
    page.evaluate(() => {
      const a = document.activeElement;
      return a ? `${a.tagName.toLowerCase()}:${a.getAttribute("data-testid") ?? a.getAttribute("data-frame") ?? ""}` : null;
    });

  /* Dördünde de: GİR → odak panoda · GERİ → odak GİR butonunda (spec bölüm 10) */
  const focusDetail = [];
  let focusOk = true;
  for (const [id, [x, z]] of Object.entries(STOPS)) {
    await tp(x, z);
    await page.waitForTimeout(350);
    await page.locator("[data-testid=frame-enter]").focus();
    await page.locator("[data-testid=frame-enter]").click();
    await page.waitForTimeout(500);
    const inBoard = await focused();
    const boardId = await page.locator("[data-testid=frame-board]").getAttribute("data-frame");
    await page.locator("[data-testid=frame-board-back]").click();
    await page.waitForTimeout(600);
    const backOn = await focused();
    const okOne = inBoard === "div:frame-board" && boardId === id && backOn === "button:frame-enter";
    if (!okOne) focusOk = false;
    focusDetail.push(`${id}:${boardId}/${inBoard}→${backOn}`);
  }
  ok(focusOk,
    "dört tabloda da odak panoya gidiyor ve GERİ'de GİR butonuna dönüyor (spec 10)",
    focusDetail.join(" · "));

  /* Odak vermek sayfayı KAYDIRMAMALI: kart kadrajın ortasında, kaydırma onu dışarı itiyor.
     Klavyeyle açılıyor: Playwright'ın `click()`'i butonu görünür kılmak için sayfayı kendisi
     kaydırıyor ve ürünün davranışını ölçmek yerine sürücünün davranışını ölçmüş oluyorduk
     (koşular arası oynak sonuç). Gerçek kullanıcı tıklaması sayfayı kaydırmaz. */
  await tp(...STOPS.menu);
  await page.waitForTimeout(350);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press("e");
  await page.waitForTimeout(700);
  const geom = await page.evaluate(() => {
    const r = document.querySelector("[data-testid=frame-board]").getBoundingClientRect();
    return { scrollY: window.scrollY, top: r.top, bottom: r.bottom, vh: window.innerHeight };
  });
  ok(geom.scrollY === 0 && geom.top >= 0 && geom.bottom <= geom.vh,
    "pano açılınca sayfa kaymıyor ve kart tamamen kadrajda",
    `scrollY ${geom.scrollY} · üst ${geom.top.toFixed(0)} · alt ${geom.bottom.toFixed(0)} / ${geom.vh}`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  /* Geçiş ORTASINDA Esc: yarım kalan lerp'ten temiz çıkış */
  await tp(...STOPS.menu);
  await page.waitForTimeout(350);
  await page.keyboard.press("e");
  await page.waitForTimeout(180); // lerp daha bitmedi
  const mid = await read(page);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const afterMid = await read(page);
  ok(afterMid.zoneState === "zone", "geçişin ortasında Esc temiz çıkıyor", `durum ${afterMid.zoneState}`);
  ok(dd(mid.cam.ang, afterMid.cam.ang) < 0.5,
    "yarım geçişten çıkışta kamera açısı bozulmuyor",
    `${deg(mid.cam.ang).toFixed(0)}° → ${deg(afterMid.cam.ang).toFixed(0)}°`);

  /* E–Esc–E–Esc hızlı ardışık: durum makinesi kilitlenmemeli, hedef karışmamalı */
  const angBefore = (await read(page)).cam.ang;
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("e");
    await page.waitForTimeout(90);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(800);
  const afterSpam = await read(page);
  ok(afterSpam.zoneState === "zone" && afterSpam.nearFrame === "menu",
    "E–Esc dört kez hızlı: durum makinesi kilitlenmiyor",
    `durum ${afterSpam.zoneState} · yakın ${afterSpam.nearFrame}`);
  ok((await page.locator("[data-testid=frame-board]").count()) === 0,
    "hızlı ardışıktan sonra pano kapalı");
  ok(dd(angBefore, afterSpam.cam.ang) < 0.5,
    "hızlı ardışıktan sonra kamera hedefi karışmıyor",
    `${deg(angBefore).toFixed(0)}° → ${deg(afterSpam.cam.ang).toFixed(0)}°`);

  /* POV'da kamera gerçekten hedefe süzülüyor mu (spec 6.1) */
  await page.keyboard.press("e");
  await page.waitForTimeout(2500);
  const settled = await read(page);
  const menuFrame = { side: -1, z: -4 };
  const wantX = menuFrame.side * (7.2 - 0.12) - menuFrame.side * 3.25;
  ok(Math.abs(settled.cam.x - wantX) < 0.15 && Math.abs(settled.cam.z - menuFrame.z) < 0.15,
    "POV kamerası hedefe yerleşiyor (spec 6.1)",
    `kamera ${settled.cam.x},${settled.cam.z} · hedef ${wantX.toFixed(2)},${menuFrame.z}`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

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
  ok(s.every((x) => (x.footprints?.visible ?? 0) === 0),
    "reduced-motion: ayak izi hiç basılmıyor (spec 8.3)",
    `en çok ${Math.max(...s.map((x) => x.footprints?.visible ?? 0))} iz`);
  ok(after.npc && Math.abs(after.npc.y - 0.7) < 0.001,
    "reduced-motion: NPC idle durdu",
    `y ${after.npc?.y}`);
  await page.close();
}

await browser.close();
console.log(`\n${pass}/${pass + fail} ✓${fail ? `  — ${fail} BAŞARISIZ` : ""}`);
process.exit(fail ? 1 : 0);
