# MANCH — devir notu

> **Tarih: 2026-09-19** (konum: `docs/manch-devir.md`; ilk yazıldığında `claude/` altındaydı, 2026-09-19'da taşındı). Tek doğruluk kaynağı hâlâ kökteki `CLAUDE.md`'dir; bu dosya onun
> özeti ve yeni bir oturuma/kişiye hızlı giriştir. Çelişki olursa `CLAUDE.md` geçerlidir.
>
> ⚠️ **Not:** Bu dosya 2026-09-19'da **sıfırdan yazıldı.** Daha önce bir devir notu olduğu
> söylendi ama repoda ve dosya sisteminde bulunamadı (git geçmişinde de yok) — muhtemelen
> planlayıcı tarafındaki proje dosyalarındaydı. Aşağıdaki "Sipariş sistemi" bölümü de bu
> yüzden **korunmadı, `CLAUDE.md`'deki kayıttan yeniden kuruldu**; eski metinde fazladan bir
> şey varsa elde değil.

---

## 1. Durum: ne bitti

**Fazlar 1–9 ve 5.5 kapalı. Site canlı: https://manch-v2.vercel.app**

| Faz | Ne |
|---|---|
| 1–4 | Kurulum, tasarım sistemi, motion primitive'leri, global layout |
| 5 | Ana sayfa (hero, hits, build sequence, zone, maskotlar, instagram, konum) |
| **5.5** | **MANCH Zone — 3D galeri** (11 adım, en büyük iş; aşağıda ayrı) |
| 6 | İç sayfalar: `/menu`, `/about`, `/contact`, 404 |
| 7 | İçerik, SEO, erişilebilirlik |
| 7.5 | İçerik commit'i (kesitler, logo, menü verisi, fotoğraflar) |
| 8 | Performans & QA |
| 9 | Deploy |

**MANCH Zone:** ana sayfadaki `#zone` bölümünden girilen tam ekran 3D galeri. Karakter seçimi
(Misu/Miyu) → yükleyici → salon. WASD/ok tuşları veya ekrandaki joystick ile geziliyor; dört
tablonun önündeki halkaya basınca POV'a geçip pano açılıyor: biri **sipariş tahtası** (15 satır,
site sepetine yazıyor), üçü hikâye panosu. `next/dynamic` ile ayrı chunk (241.6 kB gz) — ana
sayfaya dokunmuyor. Spec: `docs/manch-zone-3d.md`.

---

## 2. Dal ve etiket durumu

| | |
|---|---|
| **Production dalı** | `faz-1-yeniden` — Vercel `manch-v2` bu dalı otomatik deploy eder; **push = canlı** |
| `zone/3d-galeri` | Faz 5.5 dalı, **birleştirildi** (2026-09-18, `--no-ff`, çakışma yok) |
| `main` | Eski tam proje (eski site `manch-eight.vercel.app` buradan besleniyor, **dokunulmadı**) |
| `yedek/faz-1-9` | Eski projenin yedek dalı |
| **Etiketler (uzakta)** | `yedek-faz-9` · `yedek-zone-oncesi` (Zone birleştirmesinden hemen önceki hâl) |

İki Vercel projesi aynı GitHub reposunu paylaşır: `manch-v2` (yeni, `faz-1-yeniden`) ve
`manch` (eski, `main`). **`vercel.json` ikisi için ORTAKTIR** — proje bazlı ayar oradan
yapılamaz (Kural 58).

---

## 3. Bu oturumda eklenen kurallar

`CLAUDE.md > 📏 KURALLAR` **73 madde**. Bu oturumda eklenenler/revize edilenler:

| # | Özet |
|---|---|
| **68** | Satır içi `style` sınıfı ezer — kırılıma bağlı ölçü `style` ile verilmez |
| **69** | Ekran görüntüsü: faz başına en fazla 2 commit, yalnız kabul edilmiş kararı belgeleyenler |
| **70** | Auto-deploy'lu dala **kademeli push YASAK** — her ara push ayrı deploy tetikler |
| **71** | Ölçüm hijyeni: ağır ölçüm canlıya karşı değil, yerel prod build'de, dev sunucusu kapalı |
| **72** | LCP kabul kapısı **gerçek CDP throttling**, Lighthouse'un simüle değeri değil |
| **73** | Uzakta olmayan yedek yedek değildir · kutu ancak sonucu doğrulanınca işaretlenir |
| **2** *(revize)* | Kapı `lint && build` — ikisi farklı sınıf hata yakalar |
| **46** *(revize)* | First Load hedefi **200 → 220 kB gz**, gerekçesiyle |
| **56** *(ek)* | `.catch()` zorunluluğu `next/dynamic` yükleyicilerini de kapsar |
| **60** *(ek)* | "Yeşil rapor da yanlış öznede olabilir" — deploy onayı ürün çapasıyla verilir |

---

## 4. Scriptler — hangisi neyi ölçer

| script | tek satırda |
|---|---|
| `lab-check.mjs` | Site geneli regresyon: 4 sayfa × 2 dil, fold kuralı + sabotaj, sepet→WhatsApp, JSON-LD, a11y temelleri (**100/100**, `BROWSER=webkit` ile ikinci koşu) |
| `a11y-check.mjs` | Gerçek klavye turu: focus ring, tab sırası, kapalı diyalog tuzağı, Esc'ler, kontrast (**39/39**) |
| `faz6-check.mjs` | İç sayfalar 4 kırılım × TR/EN: durum, tek h1, taşma, kırık görsel, ham i18n anahtarı (**227/227**) |
| `zone-camera-check.mjs` | Zone'un tamamı: açı matematiği, kamera, sprite, prompt, POV, sipariş tahtası, kapı (**105/105**) |
| `zone-leak-check.mjs` | Zone aç-kapa ×6: WebGL bağlamı, canvas, doku sayısı sabit mi (bellek sızıntısı) |
| `zone-bundle-check.mjs` | three ana bundle'a sızdı mı + Zone chunk boyutu + sayfa ilk yükleme gz |
| `zone-perf-check.mjs` | Zone kare hızı (ortam tavanı farkında) + POV'da hareketin durduğu (**29/29**) |
| `zone-walkthrough.mjs` | Gözle bakma turu: 4 kırılım × 12 kare, çıktı `docs/screens/_tur/` (yok sayılır) |
| `perf-ab.mjs` | Varyantları **aynı oturumda dönüşümlü** ölçer (kayma ölçülen etkiden büyükse) |
| `lighthouse.mjs` | Perf/A11y/SEO × mobil/masaüstü × preloader'lı/sız, 3 koşu medyanı |
| `lcp-check.mjs` | Gerçek CDP throttling ile LCP (Kural 72'nin kapısı) |
| `smoke.mjs` | Canlı duman testi: rotalar, metadata, canonical/hreflang, JSON-LD (**32/32**) |
| `deploy-wait.mjs` | Vercel deploy'unu SHA ile bekler — **ama onay ürün çapasıyla verilir** |
| `zone-fov-compare.mjs` · `screens.mjs` · `bundle-report.mjs` | Karşılaştırma kareleri · kırılım ekranları · bundle raporu |

---

## 5. Sahibinden bekleyen 6 kalem

Hiçbiri kod işi değil; geldiklerinde yapılacak iş `src/content-status.ts`'te kayıtlı.

1. **Misu & Miyu'nun 8 çizimi** (4 açı × 2 karakter) → `public/images/mascots/`.
   Gelince değişen tek satır: `src/lib/zone/character.ts` → `MASCOT_SPRITE_BASE`.
   O zamana kadar `drawCapy()` geçici sprite üretiyor — **canlıda görünen bu.**
2. **İçecek fiyatları** (Limonata · Soft Drink · Ayran) — şu an `price: null`, arayüzde
   YAKINDA rozeti, sipariş edilemiyor. `menu.ts`'e fiyat girilince kendiliğinden düzelir.
3. **Menü metinlerinin müşteri onayı** — 25 ürün TR+EN taslak. `Menu.disclaimer` sitede duyuruyor.
4. **Orijinal vektör logo + marka renk kılavuzu** — şimdikiler potrace izi
   (`MENÜ` wordmark'ında ü noktaları bozuk); 8 renk tokeni hâlâ teyitsiz.
5. **Online sipariş linki** — sağlayıcı belli değil, sipariş şimdilik WhatsApp'ta.
6. **Domain** — Cloudflare DNS adımları `CLAUDE.md > DURUM`'da hazır.

---

## 6. Kalan teknik borç

- **İlk yükleme JS 218.9 kB gz.** Yeni hedefin (220) altında. Kesilecek kütüphane kalmadı;
  geri kalan React + Next çatısı (~146 kB). Daha azı çatı seviyesi müdahale ister.
- **Lighthouse simüle LCP** `/menu` 3900 · `/contact` 2968 ms — **kabul kapısı değil**
  (Kural 72). Gerçek throttling'de üçü de hedef altında: 836 / 2084 / 820 ms.
- **`geo` JSON-LD'de yok** — koordinat verisi yok, Kural 54-B uydurmayı yasaklıyor.
- **Gerçek cihaz testi yapılmadı** (fiziksel telefon) — emülasyon temiz, dokunmatik joystick
  ve gerçek Safari davranışı sahibince teyit edilmeli.
- **`docs/screens/` 159 MB** — budanmıyor (geçmişten silmek depoyu küçültmez); Kural 69
  yenisinin girmesini engelliyor.
- **`EST. 2026` Modak'ta** — sitedeki tek okunması zor rakam; `SectionHeader` eyebrow ortak
  bileşen olduğu için tek başına değiştirilmedi (karar: kapandı, yeniden açılmayacak).

---

## 7. Sipariş sistemi — HENÜZ BAŞLANMADI

> Bu bölüm `CLAUDE.md > Kural 66`'daki kayıttan yeniden kuruldu (önceki devir notu bulunamadı).

İşletme sahibiyle **gerçek bir sipariş sistemi** konuşuluyor: veritabanı + yönetim paneli +
kurye bildirimi. Henüz **hiçbir şeye başlanmadı.**

Bugünkü durum: sipariş **WhatsApp bağlantısıyla** gidiyor. Ama bu, kodun her yerine dağılmış
değil — **tek adaptörün arkasında**:

`src/lib/order/submit.ts`
- `submitOrder(lines, locale, t)` — tek dışa açık gönderme yolu
- `orderChannel()` — kanal uygun mu + **düğmenin metin anahtarı**
- `orderTotal(lines)` — fiyatı bilinmeyen ürün toplama girmez

**Hiçbir tüketici kanalı bilmez.** Ne Zone'un sipariş tahtası ne site sepeti "WhatsApp"
kelimesini geçirir; düğme metni bile adaptörden gelir (`channel.labelKey`). Sabotajla
doğrulandı: adaptör boş gerçeklemeyle değiştirildiğinde ikisi de derleniyor ve `wa.me`
yalnızca adaptörde geçiyor.

**Gerçek sistem geldiğinde değişmesi gereken tek dosya bu adaptördür** — tahta ve sepet
dokunulmadan kalmalı. İmza aynı kalabilir: bugün bağlantı açıyor, yarın sunucuya POST atıp
sipariş numarası döndürebilir.

(`ContactClient`'taki WhatsApp bağlantısı **iletişim** kanalıdır, sipariş değil — kapsam dışı.)
