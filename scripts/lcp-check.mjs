// LCP — **Kural 72'nin kabul kapısı**. Gerçek CDP throttling (yavaş 4G + 4× CPU),
// 3 koşu medyanı. Lighthouse'un Lantern tahmini kapı DEĞİLDİR (bkz. lighthouse.mjs).
//
// Kapı üç sonuç verir:
//   0 = medyan < 2500 ms · 1 = ÜRÜN hedefin altında · 2 = ÖLÇÜM GÜVENİLMEZ
// Sapma (en yüksek − en düşük) > 200 ms ise sayı raporlanmaz: Kural 72 böyle bir koşuyu
// reddeder, çünkü o noktada ölçülen şey ürün değil ortamdır (2026-09-19'da sapma 1812 ms
// çıktı ve sonuç geçersiz sayıldı). Kötü bir sayıyı "sonuç" diye yazmak en kötü seçenek.
//
// Kural 71: dev sunucusu KAPALI, makine boşta. Kural 65: ölçüm build'i ayrı klasörde,
// port önce temizlenir. Kural 72: kapı yalnız `src/` değiştiğinde açılır — kod
// değişmediyse son geçerli ölçüm geçerlidir, yük altında tekrar ölçmek Kural 60 ihlalidir.
// Kullanım: CHROME=<yol> BASE=http://localhost:3101 node scripts/lcp-check.mjs [/tr]
import { chromium } from "playwright-core";
import { pencere } from "./_bekle.mjs";

const BASE = process.env.BASE ?? "http://localhost:3101";
const PATHS = process.argv.slice(2).length ? process.argv.slice(2) : ["/tr"];
const RUNS = Number(process.env.RUNS ?? 3);

const b = await chromium.launch({ executablePath: process.env.CHROME });

async function lcpOnce(url, mobile) {
  const p = await b.newPage(
    mobile
      ? { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 810 } },
  );
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Network.enable");
  // Faz 8 ile aynı sınıf: yavaş 4G + 4× CPU
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.goto(url, { waitUntil: "load", timeout: 120000 });
  // ÖLÇÜM PENCERESİ (Kural 75 istisnası): LCP adayı geç değişebilir — beklenen bir
  // koşul yok, ölçülen şeyin kendisi süredir. Kısaltmak LCP'yi olduğundan iyi gösterir.
  await pencere(p, 3500);
  const lcp = await p.evaluate(
    () =>
      new Promise((res) => {
        let v = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) v = e.startTime; }).observe({
          type: "largest-contentful-paint", buffered: true,
        });
        setTimeout(() => res(Math.round(v)), 400);
      }),
  );
  await p.close();
  return lcp;
}

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

const ESIK = Number(process.env.ESIK ?? 2500);      // Kural 72 kabul ölçütü
const SAPMA_MAX = Number(process.env.SAPMA_MAX ?? 200); // üstünde ölçüm güvenilmez

const dusuk = [], oynak = [];
for (const path of PATHS) {
  for (const [label, mobile] of [["mobil", true], ["masaüstü", false]]) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await lcpOnce(BASE + path, mobile));
    const med = median(runs);
    const sapma = Math.max(...runs) - Math.min(...runs);
    // Kapı YALNIZ mobilde: Kural 43/72 hedefi preloader'sız mobile. Masaüstü bilgi.
    const kapi = mobile;
    let damga = "";
    if (kapi && sapma > SAPMA_MAX) { damga = `⚠ ÖLÇÜM GÜVENİLMEZ (sapma ${sapma} ms > ${SAPMA_MAX})`; oynak.push(`${path} sapma=${sapma}`); }
    else if (kapi && med >= ESIK) { damga = `✗ hedef altı (≥ ${ESIK})`; dusuk.push(`${path} ${med} ms`); }
    else if (kapi) damga = "✓";
    console.log(`${path} ${label.padEnd(9)} LCP medyan ${String(med).padStart(5)} ms  sapma ${String(sapma).padStart(4)} ms  [${runs.join(", ")}] ${damga}`);
  }
}
await b.close();

if (oynak.length) {
  console.error(`\n⚠ Kural 72: sapma eşiği aşıldı → sayı RAPORLANMAZ, ölçüm geçersiz: ${oynak.join(" · ")}`);
  console.error("  Makine boşta mı? Dev sunucusu kapalı mı (Kural 71)? Artık tarayıcı süreci var mı?");
  process.exit(2);
}
if (dusuk.length) {
  console.error(`\n✗ Kural 72 kapısı: ${dusuk.join(" · ")} (eşik ${ESIK} ms)`);
  process.exit(1);
}
console.log(`\n✓ Kural 72 kapısı: mobil LCP medyanı < ${ESIK} ms, sapma ≤ ${SAPMA_MAX} ms`);
