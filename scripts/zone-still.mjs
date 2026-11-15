// Zone salonundan ÜRÜN karesi üretir — ana sayfanın `#zone` bölümü için.
//
// Kare neyi içeriyor (karar 2026-11-13, kullanıcı): arka duvardaki **künye yazısı**
// + **her iki maskot** (oyuncu sprite'ı önde, NPC salonun dibinde). Salon geometrisi
// bunu tek kadrajda veriyor: oyuncu z=+12'den −z'ye bakıyor, NPC z=−12'de, künye z=−20'de.
//
// Kural 60 / 5.5.11 dersleri burada da geçerli:
//   · tuşlar ekran görüntüsünden ÖNCE bırakılır — yoksa karakterin konumu PNG kodlama
//     süresine, yani ÖLÇÜM ARACININ hızına bağlı olur.
//   · sahne "hazır" sayılmaz: `gsapReady` hydration'ı ölçer, three.js sahnesini değil.
//     Koşul mesh sayısı (Kural 75 + 2026-09-20 dersi; `meshes` bir DİZİ, `.length` şart).
//   · lab HUD'ı gizlenir — ürün karesinde lab kromu olmaz.
//
// Kullanım: CHROME=<yol> node scripts/zone-still.mjs [--walk 26] [--out public/images/zone-hall]
//   Ana sayfa hero karesi (2026-11-15, kullanıcı: "geniş açı, duvar yazısı + Misu & Miyu"):
//   --tp -2.4,13 (yan koridordan, tezgâh sağda) · --vp 1920x1080 · --res 1920x1080
//   Mobil dikey: --vp 900x1600 --res 1080x1920 (portrede FOV 80°, Kural 5.5.11 kararı ①)
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";
import { kosul, sabit, pencere } from "./_bekle.mjs";

const BASE = process.env.BASE ?? "http://localhost:3113";
const arg = (ad, varsayilan) => {
  const i = process.argv.indexOf(`--${ad}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : varsayilan;
};
const WALK = Number(arg("walk", 26));
const OUT = arg("out", "public/images/zone-hall");
const [W, H] = arg("vp", "1600x1200").split("x").map(Number);
const [RW, RH] = arg("res", "1400x1050").split("x").map(Number);
const TP = arg("tp", null)?.split(",").map(Number) ?? null;

const br = await chromium.launch({ executablePath: process.env.CHROME });
const p = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
p.setDefaultTimeout(90000);

await p.goto(`${BASE}/tr/lab/zone`, { waitUntil: "domcontentloaded" });

// Sahne GERÇEKTEN kuruldu mu (hydration değil).
await kosul(p, () => {
  const s = window.__ZONE_STATS__?.();
  return document.querySelectorAll("canvas").length === 1 && (s?.meshes?.length ?? 0) > 10;
}, null, 60000);
await p.evaluate(() => document.fonts.ready);

// İsteğe bağlı başlangıç noktası (dev kancası; yalnız lab'da var).
if (TP) await p.evaluate(([x, z]) => window.__ZONE_TELEPORT__(x, z), TP);

// İleri yürü: NPC ve künye kadrajda büyüsün. Süre KASITLI (Kural 75 `pencere()` istisnası).
await p.keyboard.down("w");
await pencere(p, WALK * 40);
await p.keyboard.up("w");

// Tuşlar bırakıldı; şimdi sahnenin durmasını bekle (konum ölçüm hızına bağlı kalmasın).
await sabit(p, "canvas").catch(() => {});
await pencere(p, 600);

// Lab kromunu gizle — ürün karesinde lab kromu olmaz.
// Canvas'ın KENDİSİ ve ATALARI dışında her şey gizlenir: `locator().screenshot()`
// elemanın kutusunu kırpar ama ÜSTÜNDEKİ DOM katmanını da alır (ilk denemede
// başlık, okuma paneli, joystick ve MİSU/MİYU düğmeleri kareye girdi).
await p.evaluate(() => {
  const c = document.querySelector("canvas");
  if (!c) return;
  const kal = new Set();
  for (let e = c; e; e = e.parentElement) kal.add(e);
  document.querySelectorAll("body *").forEach((e) => {
    if (!kal.has(e)) (e).style.visibility = "hidden";
  });
});

const png = await p.locator("canvas").screenshot();
const stat = await p.evaluate(() => {
  const s = window.__ZONE_STATS__?.() ?? {};
  return { mesh: s.meshes?.length ?? 0, char: s.char ?? null };
});
await br.close();

await mkdir(dirname(OUT), { recursive: true });
await sharp(png).resize(RW, RH, { fit: "cover" }).jpeg({ quality: 82 }).toFile(`${OUT}.jpg`);
await sharp(png).resize(RW, RH, { fit: "cover" }).webp({ quality: 80 }).toFile(`${OUT}.webp`);
console.log(`✓ ${OUT}.{jpg,webp} — mesh ${stat.mesh} · karakter`, stat.char);
