// Deploy duman testi. Kullanım: node scripts/smoke.mjs https://<host>
//
// Kural 48: HTML attribute adları büyük/küçük harf DUYARSIZ — Next 16 metadata çıktısı
// `hrefLang` (camelCase) yazar, regex bunu `/i` ile aramalı. Aksi halde doğru çıktı
// "eksik" sanılır (ürün hatası değil, test hatası).
const BASE = (process.argv[2] ?? process.env.BASE ?? "http://localhost:3101").replace(/\/+$/, "");
const G = "\x1b[32m", R = "\x1b[31m", Y = "\x1b[33m", X = "\x1b[0m";

let pass = 0, fail = 0, warn = 0;
const ok = (n, d = "") => { pass++; console.log(`${G}✓${X} ${n}${d ? " — " + d : ""}`); };
const no = (n, d = "") => { fail++; console.log(`${R}✗${X} ${n}${d ? " — " + d : ""}`); };
const wr = (n, d = "") => { warn++; console.log(`${Y}!${X} ${n}${d ? " — " + d : ""}`); };
const t = (c, n, d) => (c ? ok(n, d) : no(n, d));

const get = async (path, opts = {}) => {
  const r = await fetch(BASE + path, { redirect: "manual", ...opts });
  return { status: r.status, loc: r.headers.get("location"), type: r.headers.get("content-type") ?? "", body: await r.text() };
};

const PAGES = ["", "/menu", "/about", "/contact"];
const LOCALES = ["tr", "en"];

// --- 1. dört sayfa × iki dil
for (const l of LOCALES) {
  for (const p of PAGES) {
    const u = `/${l}${p}`;
    const r = await get(u);
    t(r.status === 200 && r.type.includes("text/html"), `GET ${u}`, `${r.status} ${r.type.split(";")[0]}`);
  }
}

// --- 2. kök yönlendirme
{
  const r = await get("/");
  t([307, 308].includes(r.status) && (r.loc ?? "").endsWith("/tr"), "/ → 307 → /tr", `${r.status} → ${r.loc}`);
}

// --- 3. 404
{
  const r = await get("/tr/olmayan-sayfa");
  t(r.status === 404, "bilinmeyen yol → 404", String(r.status));
}

// --- 4. metadata dosyaları
for (const [u, ct] of [["/robots.txt", "text/plain"], ["/sitemap.xml", "xml"], ["/manifest.webmanifest", "json"],
                       ["/icon/32", "image/png"], ["/apple-icon", "image/png"], ["/tr/opengraph-image", "image/png"]]) {
  const r = await get(u);
  t(r.status === 200 && r.type.includes(ct), `GET ${u}`, `${r.status} ${r.type.split(";")[0]}`);
}

// --- 5. head: canonical + hreflang + og:image (dört sayfa × iki dil)
for (const l of LOCALES) {
  for (const p of PAGES) {
    const u = `/${l}${p}`;
    const { body } = await get(u);
    const canonical = body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
    const langs = [...body.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"/gi)].map((m) => m[1]).sort();
    const og = /<meta[^>]*property="og:image"[^>]*content="[^"]+"/i.test(body);
    const tw = /<meta[^>]*name="twitter:card"[^>]*content="summary_large_image"/i.test(body);
    const langsOk = JSON.stringify(langs) === JSON.stringify(["en", "tr", "x-default"]);
    t(!!canonical && langsOk && og && tw, `head ${u}`, `canonical=${canonical ?? "yok"} hreflang=${langs.join(",") || "yok"} og=${og} tw=${tw}`);
    if (canonical && !canonical.startsWith(BASE)) {
      wr(`canonical host ≠ ölçülen host (${u})`, `${canonical} vs ${BASE} — NEXT_PUBLIC_SITE_URL eksik/yanlış olabilir`);
    }
  }
}

// --- 6. Restaurant JSON-LD (Kural 54-B: bilinmeyen alan yazılmaz)
{
  const { body } = await get("/tr");
  const raw = body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  let ld = null;
  try { ld = raw ? JSON.parse(raw) : null; } catch { /* yoksay */ }
  const must = ["name", "url", "image", "address", "telephone", "email", "sameAs", "hasMenu", "servesCuisine", "openingHoursSpecification"];
  const missing = must.filter((k) => !ld?.[k]);
  t(ld?.["@type"] === "Restaurant" && missing.length === 0, "Restaurant JSON-LD", missing.length ? `eksik: ${missing.join(", ")}` : `${Object.keys(ld ?? {}).length} alan`);
  /* priceRange 2026-09-19'da EKLENDİ (karar: kullanıcı): `menu.ts`'teki gerçek fiyatlardan
     hesaplanıyor, uydurulmuyor. Kontrol "yok mu" değil **"var mı ve iki sayılı bir aralık mı"**
     diye sorar; boş/uydurma bir değer buradan geçemez. Bilinmeyen alanlar hâlâ yasak. */
  {
    const pr = ld?.priceRange;
    const n = String(pr ?? "").match(/\d+/g)?.map(Number) ?? [];
    t(n.length === 2 && n[0] < n[1], "KURAL B · priceRange gerçek fiyat aralığından", `priceRange="${pr}"`);
    const uydurma = ["geo", "acceptsReservations", "potentialAction", "aggregateRating"].filter((k) => k in (ld ?? {}));
    t(uydurma.length === 0, "KURAL B · bilinmeyen alan yazılmamış", uydurma.join(", ") || "yok ✓");
  }
  const days = (ld?.openingHoursSpecification ?? []).flatMap((o) => o.dayOfWeek ?? []);
  t(days.length === 7, "JSON-LD saatleri 7 günü kapsıyor", `${days.length} gün`);
  if (ld?.url && !ld.url.startsWith(BASE)) wr("JSON-LD url host ≠ ölçülen host", `${ld.url} vs ${BASE}`);
}

// --- 7. sitemap içeriği
{
  const { body } = await get("/sitemap.xml");
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  t(locs.length >= 8, "sitemap ≥ 8 URL", `${locs.length} URL`);
  t(locs.every((l) => l.startsWith(BASE)), "sitemap URL'leri ölçülen host'ta", locs[0] ?? "—");
}

// --- 8. robots
{
  const { body } = await get("/robots.txt");
  t(/Sitemap:\s*\S+sitemap\.xml/i.test(body), "robots.txt sitemap satırı", body.split("\n").find((l) => /sitemap/i.test(l))?.trim() ?? "yok");
  t(/Disallow:\s*\/\w+\/lab/i.test(body), "robots.txt /lab disallow");
}

const total = pass + fail;
console.log(`\n${fail ? R : G}SONUÇ: ${pass}/${total}${X}${warn ? `  ${Y}(${warn} uyarı)${X}` : ""}`);
process.exit(fail ? 1 : 0);
