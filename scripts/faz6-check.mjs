// Faz 6 · Kural 59 gözle bakma turu + yapısal denetim.
// 4 kırılım × (menu, about, contact, 404) × TR/EN. Kareler yok sayılan _tur/'a düşer (Kural 69).
// Kullanım: BASE=http://localhost:3101 CHROME=<yol> node scripts/faz6-check.mjs
import { mkdirSync } from "node:fs";
import { hazir } from "./_bekle.mjs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3101";
const OUT = process.env.ZONE_SHOTS ?? "docs/screens/_tur";
mkdirSync(OUT, { recursive: true });
const KNOWN = "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";

const BPS = [[390,844,3],[768,1024,2],[1440,810,2],[1920,1080,1]];
const PAGES = [["menu","/menu"],["about","/about"],["contact","/contact"],["404","/yok-boyle-sayfa"]];

let pass = 0, fail = 0;
const ok = (c, l, e="") => { if (c) { pass++; } else { fail++; console.log(`  ✗ ${l}${e?" — "+e:""}`); } };

const br = await chromium.launch({ executablePath: process.env.CHROME });
for (const [w,h,dsf] of BPS) {
  for (const loc of ["tr","en"]) {
    for (const [name, path] of PAGES) {
      const p = await br.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:dsf, isMobile:w<768, hasTouch:w<768 });
      p.setDefaultTimeout(45000);
      const errs = [], net = [];
      /* Kural 53: KASITLI 404 sayfasında tarayıcı belgenin kendi 404'ü için konsola
         "Failed to load resource" basar. Bunu genel olarak filtrelemek gerçek eksik
         varlıkları da gizlerdi — yalnız 404 rotasında ve yalnız bu metin hariç tutulur;
         ağ denetimi (aşağıda) zaten URL bazında ayrıca bakıyor. */
      const beklenen404 = name === "404";
      p.on("console", m => {
        if (m.type()!=="error" && m.type()!=="warning") return;
        const txt = m.text().trim();
        if (txt === KNOWN) return;
        if (beklenen404 && /Failed to load resource.*404/.test(txt)) return;
        errs.push(txt.slice(0,80));
      });
      p.on("pageerror", e => errs.push("pageerror: "+e.message.slice(0,80)));
      p.on("response", r => { if (r.status()>=400 && !r.url().includes("yok-boyle-sayfa")) net.push(`${r.status()} ${r.url().replace(BASE,"")}`); });
      const res = await p.goto(`${BASE}/${loc}${path}?nopreload=1`, { waitUntil:"domcontentloaded" });
      await hazir(p); // Kural 75: sabit 1800/2600 ms yerine koşul
      await p.evaluate(() => Promise.all([...document.images].filter(i=>i.src&&i.getBoundingClientRect().top<innerHeight)
        .map(i=>Promise.race([i.decode().catch(()=>{}), new Promise(r=>setTimeout(r,2500))]))));
      const m = await p.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        kirik: [...document.images].filter(i=>i.complete && i.naturalWidth===0).length,
        hamKey: /\b[A-Z][a-zA-Z]+\.[a-z][a-zA-Z.]+\b/.test(document.body.innerText) &&
                /MISSING_MESSAGE|^[A-Z][a-zA-Z]+\.[a-z]/m.test(document.body.innerText),
      }));
      const tag = `${w}-${loc}-${name}`;
      await p.screenshot({ path: `${OUT}/faz6-${tag}.png` });
      ok(res.status() === (name==="404" ? 404 : 200), `${tag} durum`, `${res.status()}`);
      ok(m.h1 === 1, `${tag} tek h1`, `${m.h1}`);
      ok(!m.overflow, `${tag} yatay taşma yok`);
      ok(m.kirik === 0, `${tag} kırık görsel`, `${m.kirik}`);
      ok(!m.hamKey, `${tag} ham i18n anahtarı yok`);
      ok(errs.length === 0, `${tag} konsol`, errs.slice(0,2).join(" | "));
      ok(net.length === 0, `${tag} 4xx/5xx`, net.slice(0,2).join(" | "));
      await p.close();
    }
  }
}

// Zone → /about#mascots çapası gerçekten hedefe iniyor mu
{
  const p = await br.newPage({ viewport:{width:1440,height:810}, deviceScaleFactor:2 });
  p.setDefaultTimeout(45000);
  /* Hash sorgudan SONRA gelmeli: `…/about#mascots?nopreload=1` yazıldığında fragment
     "mascots?nopreload=1" olur ve hiçbir elemanla eşleşmez — ürün değil, URL yazım hatası. */
  await p.goto(`${BASE}/tr/about?nopreload=1#mascots`, { waitUntil:"domcontentloaded" });
  await hazir(p); // Kural 75: sabit 2500 ms yerine koşul
  const r = await p.evaluate(() => {
    const el = document.querySelector("#mascots");
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { var: true, top: Math.round(b.top), kadrajda: b.top < innerHeight && b.bottom > 0, scrollY: Math.round(scrollY) };
  });
  ok(!!r?.var, "#mascots çapası var");
  ok(!!r?.kadrajda, "#mascots çapası hedefe iniyor", JSON.stringify(r));
  // /about → Zone dönüş bağlantısı
  await p.goto(`${BASE}/tr/about?nopreload=1`, { waitUntil:"domcontentloaded" });
  await hazir(p); // Kural 75: sabit 2000 ms yerine koşul
  const cta = await p.locator("[data-testid=about-zone-cta]").getAttribute("href").catch(()=>null);
  /* next-intl `Link` locale önekini kendisi ekler: `/#zone` → `/tr#zone`. Beklenti
     bu yüzden "ana sayfa + #zone" olarak yazılır, birebir dizge olarak değil. */
  ok(/^\/(tr|en)?\/?#zone$/.test(cta ?? ""), "/about → Zone dönüş bağlantısı", `href=${cta}`);
  await p.close();
}
await br.close();
console.log(`\n${pass}/${pass+fail} ${fail?"✗":"✓"}  · kareler: ${OUT}/faz6-*`);
process.exit(fail?1:0);
