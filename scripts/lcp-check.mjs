// Ana sayfa LCP — öncesi/sonrası karşılaştırma için. 3 koşu medyanı.
// Kural 65: ölçüm build'i ayrı klasörde, port önce temizlenir.
// Kullanım: CHROME=<yol> BASE=http://localhost:3101 node scripts/lcp-check.mjs [/tr]
import { chromium } from "playwright-core";

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
  await p.waitForTimeout(3500);
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

for (const path of PATHS) {
  for (const [label, mobile] of [["mobil", true], ["masaüstü", false]]) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await lcpOnce(BASE + path, mobile));
    console.log(`${path} ${label.padEnd(9)} LCP medyan ${String(median(runs)).padStart(5)} ms  [${runs.join(", ")}]`);
  }
}
await b.close();
