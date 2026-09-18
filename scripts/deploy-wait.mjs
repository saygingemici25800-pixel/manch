// Vercel deploy'unu SHA'ya göre bekler ve sonucu doğru çıkış koduyla bildirir.
//
// Neden ayrı script: `vercel ls` çıktısını awk/grep ile ayrıştıran bir bekleme döngüsü
// hangi satırın YENİ deployment olduğunu bilemez (2026-09-18'de eski "Ready" satırını
// yeni sanıp, döngü sonunda da sebepsiz exit 1 verdi). Başarısız deploy'u başarılıdan
// ayırt edemeyen bir bekleme döngüsü, olmamasından kötüdür.
//
// ⚠️ BU SCRIPT TEK BAŞINA "DEPLOY BİTTİ" DEMEZ (karar 2026-09-18).
//    READY yalnızca Vercel'in kendi kaydıdır; canlıda gerçekten YENİ kodun servis edildiğini
//    kanıtlamaz (CDN, alias gecikmesi, sıradaki başka bir deploy). Onay **ürün seviyesinden**
//    verilir: beklenen commit'in getirdiği bir DOM çapası canlı HTML'de görünmeden bitti denmez.
//
//      curl -s https://<host>/<yol> | grep -c '<o commit ile gelen çapa>'
//
//    Kanıt (2026-09-18 birleştirmesi): token 403 verdiği için deploy ürün seviyesinden beklendi
//    ve bu bir hatadan korudu — `zone-gate` zaten canlıydı ama ARA bir commit'ten geliyordu;
//    "Zone görünüyor, demek ki bitti" denseydi eski build onaylanmış olacaktı. Çapa olarak o
//    turun EN SON commit'iyle gelen bir şey seçilir (o turda: `id="mascots"`).
//    Token yeşil olsa bile bu adım atlanmaz.
//
// Kullanım: node scripts/deploy-wait.mjs [--project manch-v2] [--sha <git sha>] [--timeout 600]
// Çıkış: 0 READY · 1 ERROR/CANCELED · 2 zaman aşımı · 3 yapılandırma hatası
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const PROJECT = arg("project", "manch-v2");
const TIMEOUT = Number(arg("timeout", 600)) * 1000;
const SHA = arg("sha", execSync("git rev-parse HEAD").toString().trim());

let token, teamId;
try {
  const dir = join(homedir(), "Library/Application Support/com.vercel.cli");
  token = JSON.parse(readFileSync(join(dir, "auth.json"), "utf8")).token;
  teamId = JSON.parse(readFileSync(".vercel/project.json", "utf8")).orgId;
} catch (e) {
  console.error("✗ Vercel kimlik/proje bilgisi okunamadı:", e.message);
  console.error("  `npx vercel link` ve `npx vercel login` gerekli.");
  process.exit(3);
}

const api = async (path) => {
  const r = await fetch(`https://api.vercel.com${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
};

const short = SHA.slice(0, 7);
console.log(`deploy bekleniyor — proje ${PROJECT}, commit ${short}`);

const started = Date.now();
let found = null;
let lastState = "";

while (Date.now() - started < TIMEOUT) {
  let list;
  try {
    list = await api(`/v6/deployments?app=${PROJECT}&teamId=${teamId}&limit=20`);
  } catch (e) {
    console.error("✗ API hatası:", e.message);
    process.exit(3);
  }

  // SHA eşleşmesi — hangi satırın YENİ deployment olduğu tahmin edilmez.
  const d = list.deployments.find((x) => x.meta?.githubCommitSha === SHA);
  if (!d) {
    if (lastState !== "yok") { console.log("  … deployment henüz oluşmadı"); lastState = "yok"; }
  } else {
    found = d;
    const state = d.readyState ?? d.state;
    if (state !== lastState) {
      const sec = Math.round((Date.now() - started) / 1000);
      console.log(`  [${sec}s] ${state}  ${d.target ?? "preview"}  ${d.url ?? ""}`);
      lastState = state;
    }
    if (state === "READY") {
      console.log(`\n✓ READY — https://${d.url}`);
      const build = d.ready && d.buildingAt ? Math.round((d.ready - d.buildingAt) / 1000) : null;
      if (build) console.log(`  build süresi: ${build} s`);
      process.exit(0);
    }
    if (state === "ERROR" || state === "CANCELED") {
      console.error(`\n✗ ${state} — https://${d.url}`);
      console.error(`  loglar: npx vercel inspect --logs ${d.url}`);
      process.exit(1);
    }
  }
  await new Promise((r) => setTimeout(r, 5000));
}

console.error(`\n✗ ZAMAN AŞIMI (${TIMEOUT / 1000} s) — son durum: ${lastState || "bilinmiyor"}`);
if (found) console.error(`  https://${found.url}`);
process.exit(2);
