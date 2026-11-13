// Yönetim paneli — uçtan uca bekçi (Kural 80).
//
// Yerel PROD build'e karşı koşar, depo dosyada:
//   ADMIN_STORE=file ORDER_TEST_CLOCK=1 ADMIN_PASSWORD=… ADMIN_SESSION_SECRET=… \
//   NEXT_DIST_DIR=.next-build pnpm start -p 3101
//   ADMIN_PASSWORD=… BASE=http://localhost:3101 CHROME=… node scripts/admin-check.mjs
//
// Neyi kanıtlar:
//   A · erişim — oturumsuz /admin girişe döner · noindex · robots
//   B · giriş — yanlış şifre · 5 hatada kilit (doğru şifre bile geçmez) · doğru şifre
//   C · ÇEREZSİZ ACTION TEKRARI — panelde yakalanan gerçek fiyat/aç-kapa isteği oturumsuz
//       yeniden gönderilir, deponun DEĞİŞMEDİĞİ dosyadan okunur. Sayfanın korumalı olması
//       bunu kanıtlamaz: server action doğrudan POST edilebilen bir uç noktadır.
//   D · aç/kapa — panel kapatınca /api/order-status kapalı, sitede sepet görünür ama
//       gönder kapalı ve SEBEP yazıyor; açınca geri
//   E · saat — test saatiyle Pzt 23:45: kapalı, "yarın 08:30"; kayıt 409
//   F · fiyat — panelde 999 → /tr/menu İLK yüklemede 999 (önbellek tazelendi mi) · JSON-LD
//       üst sınırı 999 · boş → YAKINDA ve `+` kapalı · geri alınır
//   G · sipariş akışı — sitede gönder → WhatsApp mesajında sipariş no · panelde aynı no,
//       tutarı SUNUCU hesaplamış · /api/orders kurcalanmış istekleri reddediyor
import { chromium, request as pwRequest } from "playwright-core";
import { readFile, rm } from "node:fs/promises";
import { kosul } from "./_bekle.mjs";

const BASE = process.env.BASE ?? "http://localhost:3101";
const PASSWORD = process.env.ADMIN_PASSWORD;
const STORE_FILE = ".data/admin-store.json";
const ACIK = "2026-11-16T12:00:00+03:00"; // Pazartesi öğlen — açık
const GECE = "2026-11-16T23:45:00+03:00"; // Pazartesi 23:45 — saat dışında

let pass = 0, fail = 0;
const ok = (c, l, e = "") => { if (c) { pass++; console.log(`  ✓ ${l}${e ? " — " + e : ""}`); } else { fail++; console.log(`  ✗ ${l}${e ? " — " + e : ""}`); } };

if (!PASSWORD) { console.log("✗ ADMIN_PASSWORD verilmedi — test koşamaz (Kural 77-a)"); process.exit(2); }

const depo = async () => { try { return JSON.parse(await readFile(STORE_FILE, "utf8")); } catch { return {}; } };
await rm(STORE_FILE, { force: true }); // temiz başlangıç

const br = await chromium.launch({ executablePath: process.env.CHROME });

/** Siteyi gezen bağlam: preloader/çerez bandı önceden geçilmiş, saat sabit, window.open yakalanır. */
async function siteBaglami(saat) {
  const ctx = await br.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-test-now": saat } });
  await ctx.addInitScript(() => {
    sessionStorage.setItem("manch-preloaded", "1");
    localStorage.setItem("manch-cookie", "ok");
    window.__OPENED__ = null;
    window.open = (u) => { window.__OPENED__ = String(u); return null; };
  });
  return ctx;
}

async function sepeteEkleVeAc(page, slug = "classic-manch") {
  await page.goto(`${BASE}/tr/menu`, { waitUntil: "domcontentloaded" });
  const btn = page.locator(`[data-add-to-cart=${slug}]`).first();
  await btn.waitFor({ state: "visible" });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  // Durum çekmece açılınca tazeleniyor. Bekleyici TIKLAMADAN ÖNCE kurulur — sonra kurulursa
  // hızlı dönen cevap kaçar ve test yerel yedeği (gerçek saat) ölçer (Kural 60).
  const durum = page.waitForResponse((r) => r.url().includes("/api/order-status"), { timeout: 15000 }).catch(() => null);
  await page.locator("[data-testid=cart-button]").click();
  await page.locator("[data-testid=cart-drawer]").waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  await durum;
}

/* ================================================================ A · erişim */
console.log("A · ERİŞİM");
{
  const p = await br.newPage();
  const r = await p.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  ok(p.url().includes("/admin/login"), "oturumsuz /admin → giriş sayfası", `${r?.status()} ${p.url().replace(BASE, "")}`);
  const robots = await p.locator('meta[name="robots"]').getAttribute("content").catch(() => null);
  ok(/noindex/.test(robots ?? ""), "panel noindex", robots ?? "meta yok");
  const rb = await (await fetch(`${BASE}/robots.txt`)).text();
  ok(/Disallow: \/admin/.test(rb), "robots.txt /admin disallow");
  const yonlenme = await fetch(`${BASE}/admin/login`, { redirect: "manual" });
  ok(yonlenme.status === 200, "/admin/login dil önekine yönlenmiyor (proxy dışı)", String(yonlenme.status));
  await p.close();
}

/* ================================================================ B · giriş */
console.log("\nB · GİRİŞ");
const admin = await br.newContext({ viewport: { width: 420, height: 900 } }); // sahip telefondan bakıyor
const ap = await admin.newPage();
ap.on("dialog", (d) => d.accept());

async function girisDene(sifre) {
  await ap.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await ap.locator("[data-testid=admin-password]").fill(sifre);
  await ap.locator("[data-testid=admin-login]").click();
  await kosul(ap, () => location.pathname === "/admin" || !!document.querySelector("[data-testid=admin-login-error]"), null, 15000);
  return ap.locator("[data-testid=admin-login-error]").textContent().catch(() => null);
}

{
  const girisIstegi = ap.waitForRequest((r) => r.method() === "POST" && !!r.headers()["next-action"], { timeout: 15000 });
  const e1 = await girisDene("yanlis-sifre");
  ok(/yanlış/i.test(e1 ?? ""), "yanlış şifre reddedildi", e1 ?? "hata yok");

  /* YARIŞ (inceleme 2026-11-13): ilk yazım "sayaca bak → şifreyi dene → say" sırasındaydı;
     paralel istekler sayacı aynı anda düşük görüp HEPSİ şifreye ulaşıyordu. Aynı isteği 15 kez
     PARALEL gönder: sayaç zaten 1 → en çok 4'ü şifre kontrolüne ulaşmalı. Eski kodda 15'i de
     ulaşırdı — kontrol ikisini ayırt ediyor. */
  const gi = await girisIstegi;
  const gh = { ...(await gi.allHeaders()) };
  delete gh.cookie;
  const govde = gi.postDataBuffer().toString("latin1");
  const yaris = await pwRequest.newContext();
  const yanitlar = await Promise.all(Array.from({ length: 15 }, (_, i) =>
    yaris.post(gi.url(), { headers: gh, data: Buffer.from(govde.replace("yanlis-sifre", `yanlis-${i}xx`), "latin1"), maxRedirects: 0 })
      .then((r) => r.text()).catch(() => "")));
  await yaris.dispose();
  const ulasan = yanitlar.filter((t) => /Şifre yanlış/.test(t)).length;
  const kilitli = yanitlar.filter((t) => /Çok fazla/.test(t)).length;
  ok(ulasan <= 4 && ulasan + kilitli === 15, "PARALEL 15 deneme: en çok 4'ü şifreye ulaştı (yarış kapalı)", `şifreye ulaşan ${ulasan} · kilitli ${kilitli}`);

  const kilit = await girisDene(PASSWORD);
  ok(/Çok fazla/i.test(kilit ?? "") && !ap.url().endsWith("/admin"), "5 hatadan sonra DOĞRU şifre bile kilitli", kilit ?? ap.url());
  await rm(STORE_FILE, { force: true }); // kilidi kaldır (sayaç dosyada)
  const e2 = await girisDene(PASSWORD);
  ok(e2 === null && new URL(ap.url()).pathname === "/admin", "doğru şifre → pano", new URL(ap.url()).pathname);
  const cerez = (await admin.cookies()).find((c) => c.name === "manch_admin");
  ok(cerez?.httpOnly === true && cerez?.sameSite === "Lax", "oturum çerezi HttpOnly + SameSite=Lax", JSON.stringify({ httpOnly: cerez?.httpOnly, sameSite: cerez?.sameSite }));

  // Kurcalanmış çerez: imza aynı, süre bir yıl uzatılmış → reddedilmeli.
  const [v, exp, sig] = cerez.value.split(".");
  const sahte = await br.newContext();
  await sahte.addCookies([{ name: cerez.name, value: `${v}.${Number(exp) + 365 * 864e5}.${sig}`, domain: cerez.domain, path: cerez.path }]);
  const sp = await sahte.newPage();
  await sp.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  ok(sp.url().includes("/admin/login"), "süresi kurcalanmış çerez reddedildi", sp.url().replace(BASE, ""));
  await sahte.close();
}

/* ================================================================ C · çerezsiz tekrar */
console.log("\nC · ÇEREZSİZ ACTION TEKRARI");
async function yakala(eylem) {
  const istek = ap.waitForRequest((r) => r.method() === "POST" && !!r.headers()["next-action"], { timeout: 15000 });
  await eylem();
  const r = await istek;
  const h = { ...(await r.allHeaders()) };
  delete h.cookie;
  return { url: r.url(), headers: h, body: r.postDataBuffer() };
}
{
  // Gerçek bir fiyat kaydı yakala (500), sonra aynı isteği ÇEREZSİZ ve fiyatı 1 yaparak oynat.
  const satir = ap.locator("form[data-price-row=truffle-fries]");
  await satir.locator("input[name=price]").fill("500");
  const fiyatIstegi = await yakala(() => satir.locator("button[type=submit]").click());
  await kosul(ap, () => /Kaydedildi/.test(document.querySelector("form[data-price-row=truffle-fries] [role=status]")?.textContent ?? ""), null, 15000);
  ok((await depo()).prices?.["truffle-fries"] === 500, "oturumlu kayıt depoya yazıldı (500)");

  const anon = await pwRequest.newContext();
  const sahte = Buffer.from(fiyatIstegi.body.toString("latin1").replace(/\r\n500\r\n/, "\r\n1\r\n"), "latin1");
  const rr = await anon.post(fiyatIstegi.url, { headers: fiyatIstegi.headers, data: sahte, maxRedirects: 0 });
  ok((await depo()).prices?.["truffle-fries"] === 500, "ÇEREZSİZ fiyat isteği depoyu DEĞİŞTİRMEDİ", `HTTP ${rr.status()} · depo=${(await depo()).prices?.["truffle-fries"]}`);

  // Aç/kapa: gerçek isteği yakala (kapat), sonra çerezsiz tekrar → yine açma denemesi etkisiz olmalı.
  const kapat = await yakala(() => ap.locator("[data-testid=admin-toggle]").click());
  await kosul(ap, () => document.querySelector("[data-testid=admin-toggle]")?.getAttribute("data-enabled") === "false", null, 15000);
  ok((await depo()).ordering === false, "oturumlu kapatma depoya yazıldı");
  const ac = Buffer.from(kapat.body.toString("utf8").replace("false", "true"), "utf8");
  const r2 = await anon.post(kapat.url, { headers: kapat.headers, data: ac, maxRedirects: 0 });
  ok((await depo()).ordering === false, "ÇEREZSİZ 'aç' isteği durumu DEĞİŞTİRMEDİ", `HTTP ${r2.status()} · ordering=${(await depo()).ordering}`);
  await anon.dispose();
}

/* ================================================================ D · aç/kapa sitede */
console.log("\nD · AÇ/KAPA");
{
  const durum = await (await fetch(`${BASE}/api/order-status`, { headers: { "x-test-now": ACIK } })).json();
  ok(durum.open === false && durum.reason === "manual", "panel kapalı → /api/order-status kapalı (manual)", JSON.stringify(durum));

  const ctx = await siteBaglami(ACIK);
  const sp = await ctx.newPage();
  await sepeteEkleVeAc(sp);
  await sp.locator("[data-testid=order-closed]").waitFor({ timeout: 15000 }).catch(() => {});
  const not = await sp.locator("[data-testid=order-closed]").textContent().catch(() => null);
  ok(/sipariş almıyoruz/i.test(not ?? ""), "sepet açık, SEBEP yazıyor", not ?? "not yok");
  ok(await sp.locator("[data-testid=checkout]").isDisabled(), "gönder KAPALI");
  ok((await sp.locator("[data-testid=cart-drawer] li").count()) >= 1, "sepet görünür, ürün eklenebildi");
  await ctx.close();

  await ap.locator("[data-testid=admin-toggle]").click();
  await kosul(ap, () => document.querySelector("[data-testid=admin-toggle]")?.getAttribute("data-enabled") === "true", null, 15000);
  const d2 = await (await fetch(`${BASE}/api/order-status`, { headers: { "x-test-now": ACIK } })).json();
  ok(d2.open === true, "panel açınca /api/order-status açık", JSON.stringify(d2));
}

/* ================================================================ E · saat */
console.log("\nE · SAAT");
{
  const d = await (await fetch(`${BASE}/api/order-status`, { headers: { "x-test-now": GECE } })).json();
  ok(d.open === false && d.reason === "hours" && d.opensAt === "08:30" && d.opensToday === false,
    "Pzt 23:45 → kapalı (saat), yarın 08:30", JSON.stringify(d));
  const ctx = await siteBaglami(GECE);
  const sp = await ctx.newPage();
  await sepeteEkleVeAc(sp);
  await sp.locator("[data-testid=order-closed]").waitFor({ timeout: 15000 }).catch(() => {});
  const not = await sp.locator("[data-testid=order-closed]").textContent().catch(() => null);
  ok(/yarın 08:30/.test(not ?? ""), "sepette 'yarın 08:30' yazıyor", not ?? "not yok");
  ok(await sp.locator("[data-testid=checkout]").isDisabled(), "gönder KAPALI (saat)");
  await ctx.close();
  const k = await fetch(`${BASE}/api/orders`, { method: "POST", headers: { "content-type": "application/json", "x-test-now": GECE },
    body: JSON.stringify({ id: "GECE01", locale: "tr", lines: [{ slug: "classic-manch", qty: 1 }] }) });
  ok(k.status === 409, "saat dışında kayıt reddediliyor (409)", String(k.status));
}

/* ================================================================ F · fiyat */
console.log("\nF · FİYAT");
async function fiyatKaydet(slug, deger) {
  await ap.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  const f = ap.locator(`form[data-price-row=${slug}]`);
  await f.locator("input[name=price]").fill(deger);
  await f.locator("button[type=submit]").click();
  await kosul(ap, (s) => /Kaydedildi/.test(document.querySelector(`form[data-price-row=${s}] [role=status]`)?.textContent ?? ""), slug, 15000);
}
async function kartFiyati(slug) {
  const ctx = await siteBaglami(ACIK); // TAZE bağlam: tarayıcı önbelleği yok, sunucunun ilk cevabı ölçülür
  const sp = await ctx.newPage();
  await sp.goto(`${BASE}/tr/menu`, { waitUntil: "domcontentloaded" });
  const kart = sp.locator("article", { has: sp.locator(`[data-add-to-cart=${slug}]`) }).first();
  await kart.waitFor();
  const metin = (await kart.innerText()).replace(/\s+/g, " ");
  const dugmeKapali = await sp.locator(`[data-add-to-cart=${slug}]`).first().isDisabled();
  const html = await (await fetch(`${BASE}/tr`)).text();
  const jsonld = html.match(/"priceRange":"([^"]+)"/)?.[1] ?? null;
  await ctx.close();
  return { metin, dugmeKapali, jsonld };
}
{
  await fiyatKaydet("classic-manch", "999");
  const k = await kartFiyati("classic-manch");
  ok(/999 TL/.test(k.metin), "/tr/menu İLK yüklemede yeni fiyat (999)", k.metin.slice(0, 60));
  ok(/–999 TL/.test(k.jsonld ?? ""), "JSON-LD priceRange üst sınırı 999", k.jsonld ?? "yok");

  await fiyatKaydet("classic-manch", "");
  const y = await kartFiyati("classic-manch");
  ok(/YAKINDA/i.test(y.metin) && y.dugmeKapali, "boş fiyat → YAKINDA + sepete ekle kapalı", `${y.metin.slice(0, 50)} · kapalı=${y.dugmeKapali}`);

  await fiyatKaydet("classic-manch", "570");
  const g = await kartFiyati("classic-manch");
  ok(/570 TL/.test(g.metin) && !g.dugmeKapali, "geri alındı (570)", g.metin.slice(0, 50));
  ok(/–790 TL/.test(g.jsonld ?? ""), "JSON-LD üst sınır 790'a döndü", g.jsonld ?? "yok");
}

/* ================================================================ G · sipariş akışı */
console.log("\nG · SİPARİŞ AKIŞI");
{
  const ctx = await siteBaglami(ACIK);
  const sp = await ctx.newPage();
  await sepeteEkleVeAc(sp, "truffle-fries"); // panelde 500 yapılmıştı
  await kosul(sp, () => !document.querySelector("[data-testid=checkout]")?.hasAttribute("disabled"), null, 15000);
  const kayit = sp.waitForResponse((r) => r.url().endsWith("/api/orders") && r.request().method() === "POST", { timeout: 15000 });
  await sp.locator("[data-testid=checkout]").click();
  const yanit = await kayit.catch(() => null);
  const acilan = await sp.evaluate(() => window.__OPENED__);
  const mesaj = acilan ? decodeURIComponent(acilan.split("text=")[1] ?? "") : "";
  const no = mesaj.match(/Sipariş no: ([A-Z0-9]{6})/)?.[1] ?? null;
  ok(!!acilan?.startsWith("https://wa.me/"), "WhatsApp açıldı");
  ok(!!no, "mesajda sipariş no var", no ?? mesaj.replace(/\n/g, " | ").slice(0, 80));
  ok(/500 TL/.test(mesaj), "mesajdaki tutar ETKİN fiyattan (500)", mesaj.replace(/\n/g, " | ").slice(0, 80));
  ok(yanit?.status() === 201, "kayıt 201", String(yanit?.status()));
  await ctx.close();

  await ap.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  const satir = ap.locator(`[data-order-id="${no}"]`);
  const gorundu = await satir.count();
  const metin = gorundu ? (await satir.innerText()).replace(/\s+/g, " ") : "";
  ok(gorundu === 1, "panelde aynı sipariş no görünüyor", no ?? "");
  ok(/500 TL/.test(metin), "paneldeki tutar SUNUCUNUN hesabı", metin.slice(0, 80));
  const bugun = await ap.locator("[data-testid=admin-today]").textContent();
  ok(/1 sipariş/.test(bugun ?? ""), "bugün sayacı", bugun ?? "");

  // Kurcalanmış istekler — hepsi açık saatte gönderiliyor ki reddin sebebi SAAT olmasın.
  const post = (body) => fetch(`${BASE}/api/orders`, { method: "POST", headers: { "content-type": "application/json", "x-test-now": ACIK }, body: JSON.stringify(body) });
  const tablo = [
    [{ id: "BADSLUG1", locale: "tr", lines: [{ slug: "yok-boyle-urun", qty: 1 }] }, 400, "bilinmeyen ürün"],
    [{ id: "QTYZERO1", locale: "tr", lines: [{ slug: "classic-manch", qty: 0 }] }, 400, "adet 0"],
    [{ id: "QTYBIG01", locale: "tr", lines: [{ slug: "classic-manch", qty: 1000 }] }, 400, "adet 1000"],
    [{ id: "NOPRICE1", locale: "tr", lines: [{ slug: "crispy-triangle", qty: 1 }] }, 400, "fiyatsız ürün"],
    [{ id: "x", locale: "tr", lines: [{ slug: "classic-manch", qty: 1 }] }, 400, "geçersiz id"],
    [{ id: "LOCALE01", locale: "de", lines: [{ slug: "classic-manch", qty: 1 }] }, 400, "geçersiz dil"],
  ];
  for (const [body, beklenen, ad] of tablo) {
    const r = await post(body);
    ok(r.status === beklenen, `kurcalama reddi: ${ad}`, String(r.status));
  }
  const iyi = await post({ id: "DUPE0001", locale: "tr", lines: [{ slug: "classic-manch", qty: 2 }], total: 1 });
  const ikinci = await post({ id: "DUPE0001", locale: "tr", lines: [{ slug: "classic-manch", qty: 2 }] });
  const kayitli = (await depo()).orders?.find((o) => o.id === "DUPE0001");
  ok(iyi.status === 201 && ikinci.status === 200, "aynı no ikinci kez yazılmıyor", `${iyi.status} → ${ikinci.status}`);
  ok(kayitli?.total === 1140, "istemcinin gönderdiği `total: 1` YOK SAYILDI, sunucu 2×570 hesapladı", String(kayitli?.total));

  const buyuk = await fetch(`${BASE}/api/orders`, { method: "POST", headers: { "content-type": "application/json", "x-test-now": ACIK }, body: "x".repeat(9000) });
  ok(buyuk.status === 413, "büyük gövde gövdesi okunmadan reddedildi (413)", String(buyuk.status));
  const cok = await post({ id: "TOOMANY1", locale: "tr", lines: [{ slug: "classic-manch", qty: 61 }] });
  ok(cok.status === 400, "sipariş başına 60 adet tavanı", String(cok.status));
  const gunluk = (await depo()).days ?? {};
  const bugunSayac = Object.values(gunluk)[0];
  ok(bugunSayac?.count === 2 && bugunSayac?.total === 500 + 1140, "günlük sayaç (listeden bağımsız)", JSON.stringify(bugunSayac));
}

/* ================================================================ H · bayat sekme + satıştan kalkan ürün */
console.log("\nH · BAYAT SEKME / SATIŞTAN KALKAN ÜRÜN");
{
  /* Sekme panelden ÖNCE açılır, fiyat sonra değişir. Çekmece açılınca sunucunun fiyat imzası
     farklı gelir → sayfa verisi tazelenir. WhatsApp mesajı YENİ fiyatla gitmeli (inceleme:
     eskiden mesaj eski, panel kaydı yeni fiyatla ayrışıyordu). */
  const ctx = await siteBaglami(ACIK);
  const sp = await ctx.newPage();
  await sp.goto(`${BASE}/tr/menu`, { waitUntil: "domcontentloaded" });
  await sp.locator("[data-add-to-cart=classic-manch]").first().click();
  await fiyatKaydet("classic-manch", "600");
  const durum = sp.waitForResponse((r) => r.url().includes("/api/order-status"), { timeout: 15000 }).catch(() => null);
  await sp.locator("[data-testid=cart-button]").click();
  await durum;
  await kosul(sp, () => /600/.test(document.querySelector("[data-testid=cart-total]")?.textContent ?? ""), null, 25000);
  const toplam = (await sp.locator("[data-testid=cart-total]").textContent())?.replace(/\s+/g, " ");
  ok(/600/.test(toplam ?? ""), "panelden önce açılmış sekme YENİ fiyata tazelendi", toplam ?? "");
  await kosul(sp, () => !document.querySelector("[data-testid=checkout]")?.hasAttribute("disabled"), null, 15000);
  await sp.locator("[data-testid=checkout]").click();
  await kosul(sp, () => typeof window.__OPENED__ === "string", null, 10000);
  const mesaj = decodeURIComponent((await sp.evaluate(() => window.__OPENED__))?.split("text=")[1] ?? "");
  ok(/600 TL/.test(mesaj) && !/570 TL/.test(mesaj), "WhatsApp mesajı yeni fiyatla (600)", mesaj.replace(/\n/g, " | ").slice(0, 90));
  await ctx.close();

  /* Satıştan kalkan ürün: sepette varken panel fiyatını boşaltır → gönder kapanmalı, sebep yazmalı. */
  const ctx2 = await siteBaglami(ACIK);
  const s2 = await ctx2.newPage();
  await s2.goto(`${BASE}/tr/menu`, { waitUntil: "domcontentloaded" });
  await s2.locator("[data-add-to-cart=classic-manch]").first().click();
  await fiyatKaydet("classic-manch", "");
  const d2 = s2.waitForResponse((r) => r.url().includes("/api/order-status"), { timeout: 15000 }).catch(() => null);
  await s2.locator("[data-testid=cart-button]").click();
  await d2;
  await kosul(s2, () => /satışta değil/.test(document.querySelector("[data-testid=order-closed]")?.textContent ?? ""), null, 25000);
  const not = await s2.locator("[data-testid=order-closed]").textContent().catch(() => null);
  ok(/satışta değil/.test(not ?? ""), "satıştan kalkan ürün: SEBEP yazıyor", not ?? "not yok");
  ok(await s2.locator("[data-testid=checkout]").isDisabled(), "satıştan kalkan ürün: gönder KAPALI");
  await ctx2.close();
  await fiyatKaydet("classic-manch", "570");
}

await br.close();
console.log(`\n${pass}/${pass + fail} ${fail ? "✗" : "✓"}`);
process.exit(fail ? 1 : 0);
