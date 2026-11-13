// Çalışma saati penceresi — saf fonksiyon testi (tarayıcı/sunucu gerekmez).
//
// Sınırlar burada kırılır: 23:29 açık / 23:30 kapalı · Cuma 23:59 açık / Cumartesi 00:00
// kapalı ("00:00" = gece yarısı, ertesi güne taşmaz) · gece yarısını aşan aralık (02:00'ye
// kadar açık) ertesi günün başına sarkar · cihazın saat dilimi sonucu DEĞİŞTİRMEZ.
//
// Kural 77(b): iddialar düşebilir olmalı — sondaki sabotaj aynı tabloyu bilerek bozuk bir
// gerçeklemeyle koşar ve en az bir satırın düştüğünü kanıtlar.
//
// Kullanım: node scripts/hours-check.mjs
import { hoursWindow } from "../src/lib/hours.ts";
import { site } from "../src/lib/site.ts";

let pass = 0, fail = 0;
const ok = (c, l, e = "") => { if (c) { pass++; console.log(`  ✓ ${l}${e ? " — " + e : ""}`); } else { fail++; console.log(`  ✗ ${l}${e ? " — " + e : ""}`); } };

/** İstanbul yerel saatiyle bir an (UTC+3). */
const ist = (iso) => new Date(`${iso}+03:00`);
const gunu = (d) => new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", weekday: "long" }).format(d);

// Takvim varsayımını önce DOĞRULA — yanlış güne bakan test her şeyi yanlış kanıtlar.
ok(gunu(ist("2026-11-16T12:00:00")) === "Monday", "takvim: 2026-11-16 Pazartesi");
ok(gunu(ist("2026-11-20T12:00:00")) === "Friday", "takvim: 2026-11-20 Cuma");

console.log("\nGERÇEK SAATLER (site.hours)");
const tablo = [
  ["2026-11-16T08:29:00", false, "Pzt 08:29 kapalı (açılıştan 1 dk önce)"],
  ["2026-11-16T08:30:00", true, "Pzt 08:30 açık"],
  ["2026-11-16T23:29:00", true, "Pzt 23:29 açık"],
  ["2026-11-16T23:30:00", false, "Pzt 23:30 kapalı (kapanış anı)"],
  ["2026-11-17T00:10:00", false, "Sal 00:10 kapalı (Pzt taşmaz)"],
  ["2026-11-20T23:59:00", true, "Cuma 23:59 açık (kapanış 00:00)"],
  ["2026-11-21T00:00:00", false, "Cmt 00:00 kapalı (Cuma'nın 00:00'ı ertesi güne TAŞMAZ)"],
  ["2026-11-21T08:30:00", true, "Cmt 08:30 açık"],
  ["2026-11-21T23:59:00", true, "Cmt 23:59 açık"],
  ["2026-11-22T00:00:00", false, "Paz 00:00 kapalı"],
  ["2026-11-22T23:29:00", true, "Paz 23:29 açık"],
  ["2026-11-22T23:30:00", false, "Paz 23:30 kapalı"],
];
for (const [iso, beklenen, ad] of tablo) {
  const w = hoursWindow(ist(iso), site.hours);
  ok(w.withinHours === beklenen, ad, `withinHours=${w.withinHours}`);
}

const kapanis = hoursWindow(ist("2026-11-16T12:00:00"), site.hours);
ok(kapanis.closesAt === "23:30", "Pzt öğlen: kapanış 23:30 bildiriliyor", String(kapanis.closesAt));
const sabah = hoursWindow(ist("2026-11-16T07:00:00"), site.hours);
ok(sabah.opensAt === "08:30" && sabah.opensToday === true, "Pzt 07:00: BUGÜN 08:30'da açılıyor", JSON.stringify(sabah));
const gece = hoursWindow(ist("2026-11-16T23:45:00"), site.hours);
ok(gece.opensAt === "08:30" && gece.opensToday === false, "Pzt 23:45: YARIN 08:30'da açılıyor", JSON.stringify(gece));

console.log("\nCİHAZ SAAT DİLİMİ ÖNEMSİZ");
// Aynı UTC anı — farklı TZ altında koşan bir sürecin sonucu da aynı olmalı. Date nesnesi
// zaten UTC taşır; burada süreç TZ'sini değiştirmeden aynı anın iki yazımını karşılaştırıyoruz.
const a = hoursWindow(new Date("2026-11-16T20:29:00Z"), site.hours); // = İstanbul 23:29
const b = hoursWindow(new Date("2026-11-16T20:30:00Z"), site.hours); // = İstanbul 23:30
ok(a.withinHours === true && b.withinHours === false, "UTC 20:29 açık / 20:30 kapalı (= İstanbul 23:29/23:30)");

console.log("\nGECE YARISINI AŞAN ARALIK (sentetik)");
const gecGece = [{ dayOfWeek: ["Monday"], opens: "18:00", closes: "02:00" }];
ok(hoursWindow(ist("2026-11-16T17:59:00"), gecGece).withinHours === false, "Pzt 17:59 kapalı");
ok(hoursWindow(ist("2026-11-16T23:00:00"), gecGece).withinHours === true, "Pzt 23:00 açık");
ok(hoursWindow(ist("2026-11-17T01:59:00"), gecGece).withinHours === true, "Sal 01:59 açık (Pzt'den sarkan)");
ok(hoursWindow(ist("2026-11-17T02:00:00"), gecGece).withinHours === false, "Sal 02:00 kapalı");
const salSabah = hoursWindow(ist("2026-11-17T09:00:00"), gecGece);
ok(salSabah.opensAt === "18:00" && salSabah.opensToday === false, "Sal 09:00: sıradaki açılış Pzt 18:00 (bugün değil)", JSON.stringify(salSabah));

// ---- SABOTAJ (Kural 77-b): "00:00"ı ertesi güne taşan bir aralık sayan bozuk mantık.
// Aynı beklentilerle koşulduğunda en az bir satır DÜŞMELİ; düşmüyorsa tablo hiçbir şeyi
// ayırt etmiyor demektir.
console.log("\nSABOTAJ — bozuk gerçekleme tabloyu düşürüyor mu?");
const bozuk = (date, hours) => {
  const w = hoursWindow(date, hours.map((h) => ({ ...h, closes: h.closes === "00:00" ? "01:00" : h.closes })));
  return w;
};
const yakalanan = tablo.filter(([iso, beklenen]) => bozuk(ist(iso), site.hours).withinHours !== beklenen);
ok(yakalanan.length > 0, "sabotaj yakalandı", yakalanan.map(([, , ad]) => ad).join(" | "));

console.log(`\n${pass}/${pass + fail} ${fail ? "✗" : "✓"}`);
process.exit(fail ? 1 : 0);
