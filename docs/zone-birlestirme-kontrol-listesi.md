# MANCH Zone — birleştirme öncesi kontrol listesi

> Hazırlanma tarihi: **2026-09-18**, Faz 5.5.11 kapanışı · Dal: `zone/3d-galeri`
> **Güncellendi:** altı kararın uygulanmasından sonra (FOV 80 · rakamlar `font-ui` · spec netleştirmesi).
> ## ✅ KAPANDI — birleştirme yapıldı (2026-09-18)
>
> `zone/3d-galeri` → `faz-1-yeniden`, `--no-ff`, **çakışma yok**, 62 dosya.
> Birleştirme commit'i **`a21cf82`** · yedek etiketi **`yedek-zone-oncesi`** (`f860aca`, origin'de).
> **Zone canlı: https://manch-v2.vercel.app** · smoke **31/31** · 12 sayfa regresyon temiz.
>
> Aşağıdaki liste kayıt olarak duruyor; bölüm 5'teki adımlar uygulandı.

---

## 1 · Script durumu (hepsi son koda karşı koşuldu)

| script | nerede koşar | sonuç |
|---|---|---|
| `zone-camera-check.mjs` | dev · `/lab/zone` | **105/105 ✓** (5.5.10'da 100; +3 portre, +2 FOV kararı bekçisi) |
| `zone-leak-check.mjs` | dev · aç-kapa ×6 | **✓ sızıntı yok** — bağlam 1, canvas 1, canlı doku **21 sabit**, ölü bağ 0, kapalıyken 0 |
| `zone-bundle-check.mjs` | prod build | **✓** three hiçbir sayfanın ilk yüklemesinde yok · Zone chunk **241.6 kB gz** (limit 260) |
| `lab-check.mjs` | dev | **93/93 ✓**, konsol 0 hata/uyarı |
| `zone-perf-check.mjs` *(5.5.11'de eklendi)* | dev (POV) + prod (fps) | **41/41 ✓** |

`pnpm lint` temiz (0 uyarı) · `pnpm build` temiz (21 rota + `ƒ Proxy`).

**Koşma komutları** (Kural 65: ölçüm build'i ayrı klasörde, dev sunucusuna dokunulmaz):

```bash
export CHROME="$HOME/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
BASE=http://localhost:3000 node scripts/zone-camera-check.mjs
BASE=http://localhost:3000 node scripts/zone-leak-check.mjs
PORT=3000 node scripts/lab-check.mjs
NEXT_DIST_DIR=.next-build BASE=http://localhost:3101 node scripts/zone-bundle-check.mjs
BASE=http://localhost:3000 PROD=http://localhost:3101 node scripts/zone-perf-check.mjs
```

---

## 2 · Ölçülen değerler

| ölçüm | değer | hedef | durum |
|---|---|---|---|
| Zone chunk | **241.6 kB gz** | < 260 (spec 9) | ✓ |
| Portrede uzak tablolar kadrajda | **%100** (72°'de %73) | tam görünsün | ✓ `FOV_MAX` 80 |
| `/tr` ilk yükleme | **218.4 kB gz** | ≤ 200 (Kural 46) | ✗ **Faz 8'den devreden borç** — Zone'dan bağımsız |
| Ana sayfa LCP (mobil) | **796 ms** | bozulmasın | ✓ (5.5.9: 772 — gürültü) |
| Ana sayfa LCP (masaüstü) | **792 ms** | bozulmasın | ✓ (5.5.9: 780 — gürültü) |
| Kare hızı · masaüstü 1440 | **60 fps** (boşta/yürürken/POV) | 60 | ✓ |
| Kare hızı · mobil 390×844 dpr3 | **60 fps** | 60 | ✓ |
| Kare hızı · mobil dpr3 + CPU 4× | **60 fps** | 60 | ✓ |
| En uzun kare | **17.8 ms** | < 50 (`dt` kırpması) | ✓ kırpma hiç çalışmadı |
| Pay sondası · CPU 20× | 33–36 fps | — | ℹ️ puanlanmıyor |

⚠️ **Kare hızı ölçümünün sınırı:** Apple M1 GPU / ANGLE Metal üzerinde alındı. CPU tarafında pay
büyük (4× yavaşlatma hiçbir şeyi değiştirmedi), **ama gerçek telefon GPU'su ölçülemedi.**
Karar 2026-09-18: **gerçek cihaz testi birleştirmeyi bloklamıyor, canlıdan bakılacak.**
`setPixelRatio 1.5` kolunun CPU darboğazında **işe yaramadığı** ölçüldü.
⚠️ **20× sondası oynaktır:** ardışık iki koşu 14.4 ve 32.8 fps verdi. Tek koşusundan sonuç
çıkarılmaz (en az üç koşu). Hedef senaryolar (1× ve 4×) **her koşuda** 60 fps.

---

## 3 · Gözle bakma turu (Kural 59)

**4 kırılım × 12 kare × 2 mod = 96 ekran görüntüsü**, zincir kesintisiz:
ana sayfa → kapı → seçim → yükleyici → sahne → yürüme → halka/prompt → POV → OrderBoard →
StoryBoard → TAM SAYFAYA GİT → geri dönüş → çıkış.

- `docs/screens/faz-5.5.11-{390,768,1440,1920}-01..12-*.png`
- reduced-motion: `docs/screens/faz-5.5.11-reduced-*`
- FOV karşılaştırması: `docs/screens/faz-5.5.11-fov-*`
- **Bundan sonra Kural 69:** faz başına en fazla 2 kare commit edilir (yalnız kabul edilmiş bir
  kararı belgeleyenler). Tur kareleri yerelde üretilir — `scripts/zone-walkthrough.mjs` tek
  komutla yeniden üretir.

Dört kırılımda da **konsol 0 · 4xx/5xx 0**. Turda **üç kusur** bulundu, üçü de düzeltildi:
karakter seçimi portrede taşıyordu · `/about#mascots` çapası yoktu · joystick etiketi Kural 40'ı
ihlal ediyordu (ayrıntı: `CLAUDE.md` hata günlüğü).

---

## 4 · Zone canlıya çıkarsa kullanıcının karşılaşacağı BİLİNEN eksikler

Bunlar kusur değil, **bilinçli olarak eksik bırakılmış** ya da karar bekleyen şeyler.
Birleştirme kararı verilirken bunların canlıda görüneceği bilinerek verilmeli.

1. **Maskot çizimleri yok.** Misu ve Miyu'nun 8 gerçek çizimi (4 açı × 2 karakter) çizerde.
   Şu an `drawCapy()` ile üretilen **geçici sprite** görünüyor — sahnedeki karakter de, NPC de,
   karakter seçim ekranındaki yüzler de. Çizimler gelince tek satır değişir
   (`character.ts` → `MASCOT_SPRITE_BASE = "/images/mascots"`).
2. **İçecek fiyatları yok.** Limonata · Soft Drink · Ayran sipariş tahtasında **YAKINDA** rozetiyle
   çıkıyor, `+` devre dışı, toplama girmiyor, sepete eklenemiyor. Koşul veriden türüyor
   (`price == null`) — gerçek fiyat `menu.ts`'e girilince satır kendiliğinden normale döner.
3. ~~Mobil portrede salon dar okunuyor.~~ **ÇÖZÜLDÜ** — `FOV_MAX` 72 → 80, uzak tablolar
   %73 → **%100** kadrajda (karar 2026-09-18). Masaüstü etkilenmedi.
4. ~~Modak'ın `0`'ı okunmuyor.~~ **ÇÖZÜLDÜ** — sipariş tahtası adedi/TOPLAM'ı ve site sepeti
   TOPLAM'ı `font-ui`'ye geçti (karar 2026-09-18). İki kırılımda `0 TL` · `2460 TL` ile gözle
   doğrulandı. Sitede Modak'ta kalan tek rakam `About.timeline.eyebrow` = "EST. 2026 — FETHİYE"
   idi: **Karar 2026-09-18 — `SectionHeader` eyebrow ortak bileşen olduğu için Modak kalır.
   Rakam-font kuralı fiyat/adet/toplam içindir. Madde kapandı, yeniden açılmayacak.**
5. **Menü metinleri taslak** — `Menu.disclaimer` bunu tahtanın üstünde de duyuruyor
   ("Menü ve fiyatlar örnek amaçlıdır, değişebilir").
6. **Prod konsolunda bir kütüphane uyarısı var:** `THREE.Clock … deprecated`
   (`@react-three/fiber@9.7.0`, son kararlı sürüm). İşlevsel etkisi yok, kullanıcı görmez.
   **Kalıcı kabul edildi** (karar 2026-09-18); canary sürüme geçilmeyecek.
7. ~~POV'da ayak izlerinin sönmesi.~~ **KAPANDI** — spec netleştirildi: "ayak izi durur" =
   **yeni iz basılmaz**; havuzdaki izlerin sönmesi sürer (karar 2026-09-18).

---

## 5 · Birleştirme yapılacaksa sıra (ŞU AN YAPILMADI)

1. Kullanıcı onayı — `faz-1-yeniden` **production** dalı, push = canlı.
2. `git checkout faz-1-yeniden && git merge zone/3d-galeri`
3. `NEXT_DIST_DIR=.next-build pnpm build` (Kural 65) + `pnpm lint`
4. Beş script yeniden (yukarıdaki komutlar), `BROWSER=webkit node scripts/lab-check.mjs` (Kural 45)
5. Push → Vercel `manch-v2` otomatik deploy → `node scripts/smoke.mjs https://manch-v2.vercel.app`
6. **Canlıda gözle bak** (Kural 59): ana sayfa → Zone kapısı → sahne, mobil + masaüstü

---

## 7 · Kapanış notu (2026-09-18)

**Kod tarafı kapalı.** Faz 5.5'in tüm adımları ve spec bölüm 11 kabul kriterleri geçildi;
birleştirilmiş dalda beş script yeşil, lint + build temiz, production'da gözle bakma yapıldı.

**Kalan üç eksik Saygın'dan bekleniyor — hiçbiri kod işi değil:**

1. **Misu & Miyu'nun 8 çizimi** (4 açı × 2 karakter, `public/images/mascots/`). Gelene kadar
   `drawCapy()` geçici sprite üretiyor. Geldiğinde değişecek tek şey:
   `src/lib/zone/character.ts` → `MASCOT_SPRITE_BASE = "/images/mascots"`.
2. **İçecek fiyatları** (Limonata · Soft Drink · Ayran). Şu an `price: null` → tahtada
   **YAKINDA** rozeti, `+` devre dışı, toplama girmiyor. `src/data/menu.ts`'e gerçek fiyat
   girildiği an satır kendiliğinden normale döner — koda dokunulmaz.
3. **Menü metinlerinin müşteri onayı** (25 ürün TR+EN taslak). `Menu.disclaimer` bunu sitede
   de duyuruyor: "Menü ve fiyatlar örnek amaçlıdır, değişebilir."

**Kapanan kararlar** (yeniden açılmayacak): FOV_MAX 80 · rakamlar `font-ui` (fiyat/adet/toplam) ·
"EST. 2026" Modak kalır · POV'da yeni iz basılmaz, mevcut izler söner · fiber `THREE.Clock`
uyarısı kalıcı kabul · `docs/screens/` budanmaz, Kural 69 geçerli.

**Gerçek cihaz testi** (fiziksel telefon) yapılmadı — karar gereği birleştirmeyi bloklamıyordu,
canlıdan bakılacak. Otomatik tur mobil kırılımda (390×844, dpr 3) production URL'i üzerinden
koşuldu ve temiz geçti, ama bu bir **emülasyon**; gerçek cihazda dokunmatik joystick ve
Safari/WebKit davranışı Saygın tarafından teyit edilmeli.
