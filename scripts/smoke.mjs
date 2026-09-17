// Deploy sonrası duman testi: sayfalar 200, head'de canonical + hreflang + og:image, bilinmeyen yol 404.
// Kullanım: node scripts/smoke.mjs https://manch-eight.vercel.app
const BASE = (process.argv[2] ?? process.env.BASE ?? "http://localhost:3100").replace(/\/$/, "");
const OK_PATHS = ["/tr", "/en", "/tr/menu", "/tr/contact", "/sitemap.xml", "/robots.txt", "/tr/opengraph-image"];
const fails = [];
const warns = [];
const check = (name, ok, info = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${info ? " — " + info : ""}`);
  if (!ok) fails.push(name);
};

for (const p of OK_PATHS) {
  const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
  check(`GET ${p} → 200`, r.status === 200, `${r.status} ${r.headers.get("content-type")?.split(";")[0] ?? ""}`);
}

const nf = await fetch(`${BASE}/tr/olmayan`, { redirect: "manual" });
check("GET /tr/olmayan → 404", nf.status === 404, String(nf.status));

for (const p of ["/tr", "/en"]) {
  const html = await (await fetch(`${BASE}${p}`)).text();
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ?? null;
  // Next 16 metadata `hrefLang` (camelCase) yazar → case-insensitive (Kural 48)
  const hreflangs = [...html.matchAll(/hreflang="([^"]+)"/gi)].map((m) => m[1]).sort().join(",");
  const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ?? null;
  const jsonLd = /"@type":"Restaurant"/.test(html);
  check(`${p} head: canonical + hreflang + og:image + JSON-LD`, !!canonical && hreflangs === "en,tr,x-default" && !!og && jsonLd,
    `canonical=${canonical} hreflang=${hreflangs} og=${og ? "var" : "yok"} jsonld=${jsonLd}`);
  // canonical host, ölçülen host ile aynı mı? (NEXT_PUBLIC_SITE_URL doğru ayarlanmış mı)
  if (canonical && new URL(canonical).origin !== BASE) {
    warns.push(`${p}: canonical ${new URL(canonical).origin} ≠ ${BASE} → NEXT_PUBLIC_SITE_URL eksik/yanlış (env uyarısı, hata değil)`);
  }
}

console.log(`\nFAILS: ${fails.length}`);
for (const f of fails) console.log("  ✗ " + f);
console.log(`WARNINGS: ${warns.length}`);
for (const w of warns) console.log("  ! " + w);
process.exit(fails.length ? 1 : 0);
