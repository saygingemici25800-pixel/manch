# CLAUDE.md — MANCH Web Sitesi

> Bu dosya projenin tek doğruluk kaynağıdır. Claude Code her oturumun başında bunu okur.
> Konum: proje kökü (Faz 1'de `docs/` içinden taşındı, 2026-09-17). Detaylı brief: `docs/manch-brief.md`

---

## ⚠️ HATA PROTOKOLÜ (ZORUNLU — her fazda geçerli)

Claude Code, aşağıdaki durumlardan **herhangi biri** olduğunda işe devam etmeden önce **bu dosyayı kendisi revize eder**:

- `pnpm build`, `pnpm lint`, `tsc` veya dev server hatası
- Runtime / console hatası, hydration uyuşmazlığı
- Bir kütüphane API'sinin beklenenden farklı çıkması (sürüm farkı vb.)
- Kullanıcının "bu yanlış / olmamış" dediği her düzeltme
- Aynı hatanın ikinci kez görülmesi

**Revizyon adımları:**
1. `## 🧠 HATA GÜNLÜĞÜ` tablosuna yeni satır ekle: tarih · faz · hata özeti · kök neden · çözüm.
2. Hata bir kurala dönüşüyorsa `## 📏 KURALLAR` bölümüne kalıcı madde ekle (ör. "GSAP SplitText'i sadece client component'te import et").
3. Faz tanımı yanlış/eksikse ilgili fazın maddelerini düzelt ve sonuna `(revize: YYYY-MM-DD)` yaz.
4. `## 📍 DURUM` bölümünü güncelle.
5. Sonra düzeltmeyi uygula, `pnpm build` ile doğrula.

Bir faz bittiğinde: DURUM'u güncelle, fazın checkbox'larını işaretle, commit at (`feat(faz-N): ...`), **bir sonraki faza kendiliğinden geçme** — kullanıcı onayını bekle.

**Faz sonu raporu (zorunlu):** commit'ten sonra, kullanıcının planlayıcı Claude'a (claude.ai) yapıştıracağı **tek bir kod bloğu** üret. Başlık `# MANCH — Faz N raporu`, bölümler: `Durum` · `Yapılanlar` · `Plandan sapmalar` (CLAUDE.md'de neyi neden revize ettin) · `Hatalar & çözümler` · `Karar bekleyenler` (planlayıcının cevaplaması gereken sorular) · `Açık TODO'lar` · `Sonraki faz` (kapsam + riskler). Kısa, madde madde, dosya yolları ile.

---

## 📍 DURUM

- Aktif faz: **Faz 5.5 (MANCH Zone) — 5.5.1–5.5.11 BİTTİ.** Kabul kriterleri (spec bölüm 11) geçildi;
  birleştirme kullanıcı onayı bekliyor. **`faz-1-yeniden` production dalı — Zone onaylanana kadar merge/PR YOK.**
- **Adım sırası değişti (2026-09-18, kullanıcı — kota kısıtı):** 5.5.5 çerçeveler → POV → OrderBoard → ZoneGate/CharacterSelect/ZoneLoader → StoryBoard → Joystick → performans. Gerekçe: **ilk dördü bitince Zone gösterilebilir hale geliyor** (girilir, gezilir, tabloya girilip sipariş verilir). Joystick klavye varken şart değil, StoryBoard içerik — ikisi de eşikten sonraya alındı.
- **Geliştirme sunucusu `pnpm dev -p 3000` açık tutuluyor** (kullanıcı `http://localhost:3000/tr/lab/zone` adresinden canlı izliyor). Her adım sonunda ayakta olduğu doğrulanır.
- Dal: **`zone/3d-galeri`** (5.5 çalışması burada). **`faz-1-yeniden` production dalı, canlı site oradan besleniyor — Zone kabul kriterlerini geçene kadar BİRLEŞTİRİLMEZ.**
- Fazlar 1–9 tamamlandı, site yayında. Kalan: domain bağlama + Faz 8'den devreden performans borcu.
- **CANLI (yeni site): https://manch-v2.vercel.app** — Vercel projesi `manch-v2`, dal **`faz-1-yeniden`**, build 1 dk, smoke 31/31.
- **Eski site dokunulmadı: https://manch-eight.vercel.app** (Vercel projesi `manch`, dal `main`). İki proje aynı GitHub reposunu paylaşır.
- ✅ **Vercel `manch-v2` production branch = `faz-1-yeniden`** (2026-09-18, panodan ayarlandı). Bu dala yapılan push artık doğrudan `manch-v2.vercel.app`'i günceller; doğrulandı (hero düzeltmesi 49 s'de production'a çıktı).
- **Vercel env:** `manch-v2` → `NEXT_PUBLIC_SITE_URL=https://manch-v2.vercel.app` ✓ (Production). `NEXT_PUBLIC_ALLOW_NOPRELOAD` **eklenmedi** (Kural 43). Env **Preview kapsamına da** eklendi — ilk push'ta preview build Kural 57 ile kırılmıştı (koruma çalıştı); eklendikten sonra push → Ready (~40 s), auto-deploy doğrulandı.
- **Zone durumu (5.5.11 sonu): beş script de yeşil, dört kırılımda gözle geçiş yapıldı.**
  · `zone-camera-check` **103/103** (+3 yeni portre kontrolü) · `zone-leak-check` doku 21 sabit, kapalıyken 0
  · `zone-bundle-check` three ana bundle'da yok · **Zone chunk 241.6 kB gz** (limit 260 ✓) · `/tr` 218.4 kB gz
  · `lab-check` **93/93**, konsol 0 · **`zone-perf-check` 41/41** (yeni script)
  · **Ana sayfa LCP bozulmadı:** mobil **796 ms** · masaüstü **792 ms** (5.5.9: 772 / 780 — gürültü sınırında)
- **KARE HIZI ölçüldü (production build, gerçek kullanıcı yolundan; GPU: Apple M1 / ANGLE Metal):**
  masaüstü 1440 · mobil 390×844 **dpr 3** · mobil dpr3 **CPU 4×** → **üçünde de boşta/yürürken/POV'da 60 fps**,
  en uzun kare 17.8 ms. **`dt` kırpması (50 ms) hiçbir senaryoda devreye girmedi** — yani simülasyon saati
  duvar saatine eşit, ölçüm kırpmadan etkilenmemiş (Kural 60). `setPixelRatio 1.5` düşürmesine **gerek yok**.
  · **CPU throttle gerçekten uygulanıyor** (ayrı sonda: saf JS döngüsü 80 → 326 → 827 ms @ 1×/4×/10×) —
    4×'te hiçbir şeyin değişmemesi ölçüm hatası değil, sahnenin CPU'ya bağlı olmaması
  · **Pay sondası (puanlanmıyor): CPU 20×'te ~25–35 fps**, kırpma orada devreye giriyor. `dpr` 2 → 1.5
    bu noktada **hiçbir şey kazandırmıyor** → spec 9'un "önce `setPixelRatio` 1.5" reçetesi yalnızca
    **dolgu (fill-rate)** darboğazında işe yarar, CPU'da değil.
    ⚠️ **Sonda OYNAK:** aynı kodda ardışık iki koşu 14.4 ve 32.8 fps verdi (20×'te kare bütçesi zaten
    taşmış, makinedeki her başka yük buraya yansıyor). İlk koşu "FOV 80 pahalıya mal oldu" diye
    yorumlanacaktı, ikinci koşu çürüttü. **Tek koşusundan sonuç çıkarılmaz.** Hedef senaryolar
    (1× ve 4×) her koşuda 60 fps — kararlı ve anlamlı olan ölçüm odur
  · ⚠️ **Sınır:** ölçüm M1 GPU'da; gerçek telefon GPU'su ölçülemedi. CPU tarafında pay büyük, GPU tarafı açık
- **POV'da hareket DURUYOR — ölçüldü (5.5.11, daha önce yalnızca kodda vardı):** tuş basılı tutulsa bile
  karakter yürümüyor/dönmüyor, yeni ayak izi basılmıyor, **dört halkanın dördünün** dönüşü ve nabzı donuyor;
  sahne render'ı sürüyor (0.6 sn'de 37 kare). Çift yönlü kanıt: aynı koşuda POV DIŞINDA aynı değerlerin
  **değiştiği** de gösteriliyor (Kural 60 — hep 0 dönen bozuk ölçüm de "donmuş" derdi).
  · **Gözlem (karar planlayıcıda):** POV'da YENİ iz basılmıyor ama havuzdaki izlerin **sönmesi sürüyor**
    (en koyu 0.253 → 0). Spec "ayak izi durur" diyor; donmuş iz mi, sönmeye devam mı?
- **Gözle bakma turu (Kural 59): 4 kırılım × 12 kare × 2 mod = 96 ekran görüntüsü**, zincir kesintisiz
  (ana sayfa → kapı → seçim → yükleyici → sahne → yürüme → halka/prompt → POV → OrderBoard → StoryBoard →
  TAM SAYFAYA GİT → geri dönüş → çıkış). Dört kırılımda da **konsol 0, 4xx/5xx 0**.
  · `docs/screens/faz-5.5.11-{390,768,1440,1920}-01..12-*.png` · reduced-motion: `faz-5.5.11-reduced-*`
  · **Tur ÜÇ kusur yakaladı** (üçü de düzeltildi, ayrıntı hata günlüğünde): karakter seçimi portrede
    taşıyordu · `/about#mascots` çapası yoktu · joystick etiketi `text-ink/70` ile Kural 40'ı ihlal ediyordu
- **KARARLAR KAPANDI (2026-09-18, kullanıcı) — altı madde:**
  ① **`FOV_MAX` 72 → 80 uygulandı** (portrede uzak tablolar %73 → %100 kadrajda; masaüstü
  etkilenmez). Ölçütün düzeltilmesi onaylandı: "tablonun kadraja düşen oranı", "salonun yüzdesi"
  değil. 85.1 ek katkı vermiyor, `CAM_DIST 7.5` kamerayı salon sınırına dayıyor. Gerekçe
  `frames.ts`'te sabitin başında, bekçi `zone-camera-check`'te.
  ② **Rakamlar `font-ui`'ye geçti** — sipariş tahtası adedi, sipariş TOPLAM'ı, site sepeti
  TOPLAM'ı. Modak başlıklarda kalır. "Satış ekranında okunmayan rakam tipografi tercihi değil
  kusurdur." Tüm `src` tarandı: diğer tüm sayısal değerler zaten `font-ui`/`font-pixel`'di
  (fiyatlar, sayaçlar, rozet, timeline yılları, künye "2 0 2 6", kicker "01 · SİPARİŞ").
  **Modak'ta kalan tek rakam: `About.timeline.eyebrow` = "EST. 2026 — FETHİYE"** — dekoratif
  kicker, satış rakamı değil; `SectionHeader` eyebrow'u tüm sitede ortak olduğu için tek başına
  değiştirmek bütün bölüm kickerlarını etkilerdi → **dokunulmadı, ayrıca bildirildi.**
  ③ **POV'da mevcut izler sönmeye devam ediyor** — spec bu cümleyle netleştirildi.
  ④ **fiber uyarısı kalıcı kabul** (9.7.0 son kararlı sürüm; canary'ye geçilmeyecek).
  Belgeli birebir metin istisnası `zone-perf-check`'te.
  ⑤ **Gerçek cihaz testi birleştirmeyi bloklamıyor** — canlıdan bakılacak.
  ⑥ **`docs/screens/` budanmayacak**, bunun yerine **Kural 69**: faz başına en fazla 2 kare.
- **MOBİL PORTREDE SALON DARLIĞI — ölçüm (karar ① ile kapandı, `FOV_MAX` 80 uygulandı):**
  390×844'te vFOV tavana (72°) dayanıyor, yatay karşılığı **37.1°** (hedef 46°). Ölçüt olarak "salonun
  yüzde kaçı görünüyor" **yanıltıcı çıktı** — analitik olarak iki aday berabere görünüyordu ama ekranda
  biri tabloları kesiyordu. Doğru ölçüt: **tablonun ekran dikdörtgeninin kadraja düşen oranı**
  (`__ZONE_ART_RECT__`):

  | aday | vFOV | yatay | uzak tablolar kadrajda | not |
  |---|---|---|---|---|
  | **mevcut** FOV_MAX 72 | 72.0° | 37.1° | **%73** (kesik) | tünel etkisi burada |
  | FOV_MAX **80** | 80.0° | 42.4° | **%100** | **en küçük yeterli değişiklik — ÖNERİ** |
  | FOV_MAX 85.1 | 85.1° | 46.0° | %100 | yatay hedefi tam tutturur, %100'e ek katkı yok |
  | CAM_DIST 7.5 | 72.0° | 37.1° | %100 | kamera salon ucunda **sınıra dayanıyor** (z 19.2), karakter küçülüyor |

  **Uygulandı: `FOV_MAX` 72 → 80.** Masaüstü etkilenmez (orada alt sınır 48 devrede). Karşılaştırma kareleri:
  `docs/screens/faz-5.5.11-fov-{A-mevcut-fov72,B1-fovmax80,B2-fovmax85,C-camdist75}-390.png`
  (`scripts/zone-fov-compare.mjs` — sabiti elle değiştirip koşulur, script hiçbir şeyi değiştirmez)
- **KAPANDI (karar ②) — Modak'ın SIFIRI okunmuyor.** Sipariş tahtasında adet ve TOPLAM `font-display` (Modak);
  Modak'ın `0` karakteri dolu bir elips (ince bir eğik çizgi dışında counter kapalı). 1–9 sorunsuz, **yalnız
  `0`**. Tahta açıldığında 15 satırın hepsi `0`, TOPLAM da `0` → ilk izlenim "● TL". 40 px'te bile böyle,
  yani boyut meselesi değil, fontun tasarımı. Aday: rakamları `font-ui` (Mouse Memoirs) ya da `font-pixel`
  ile yazmak (ikisi de `0`'ı temiz veriyor). **`font-ui` seçildi ve uygulandı** — sipariş tahtası
  adedi + TOPLAM'ı ve site sepeti TOPLAM'ı. Mouse Memoirs Modak'tan optik olarak küçük durduğu
  için punto biraz büyütüldü (1.25 → 1.35vw · 1.4 → 1.5vw · 1.8 → 1.9vw).
- **Zone durumu (5.5.10 sonu): dört panonun dördü de dolu.** `menu` → sipariş tahtası · `crew`/`mascot`/`visit` → hikâye panoları (görsel + başlık + iki paragraf + TAM SAYFAYA GİT). Metinler `Zone.story.<id>.{p1,p2}` — 3 pano × 2 paragraf × 2 dil, anahtarlar simetrik (261/261).
  · `zone-camera-check` → **100/100** · `zone-leak-check` → doku 21 sabit, kapalıyken 0 · `/tr` 218.4 kB gz · **Zone chunk 241.6 kB gz (limit 260 ✓)**
  · **"TAM SAYFAYA GİT" Zone'u kapatıp gezdiriyor** (`TransitionLink` + `exit()`); gezindikten sonra **kaydırma kilidi sayaçta asılı kalmıyor** — 5.5.9'da düzeltilen hatanın tekrar alanı, kalıcı kontrol eklendi
  · Panodan Zone'a dönüşte **karakter ve konum korunuyor** (üç panoda da ölçüldü)
  · İki kırılımda da yatay taşma yok, kart tamamen kadrajda, sticky şerit metni kapatmıyor
  · Ekranlar: `docs/screens/faz-5.5.10-storyboard-{1440,390}.png` (üç pano yan yana)
- **Zone durumu (5.5.9 sonu): Zone ANA SAYFADAN girilebiliyor.** `#zone` bölümündeki **ZONE'A GİR** → karakter seçimi (`drawCapy` yüzleri, `sessionStorage manch_char`) → yükleyici (% sahne gerçekten kurulunca 100'e gider) → sahne. Perde `fixed inset-0 z-100`, `role="dialog"` + `aria-modal`, Esc, focus trap, kaydırma kilidi — `useDialog` ile, sitenin diğer modalleriyle aynı davranış.
  · `zone-camera-check` → **96/96** · `zone-leak-check` → doku 21 sabit, kapalıyken 0
  · **Site kromu perdenin ALTINDA**: sepet düğmesi, nav ve çerez bandı sızmıyor (üç köşede `elementFromPoint` ile denetleniyor). Joystick'in sepetin altında kalması (5.5.7) bu perdenin yokluğundandı — kapı gelince kalktığı doğrulandı
  · **Karakter hatırlanıyor**: ikinci girişte seçim atlanıyor
  · **Ana sayfa LCP bozulmadı** (prod build, yavaş 4G + 4× CPU, 3 koşu medyanı): mobil **796 → 772 ms**, masaüstü **764 → 780 ms** — gürültü sınırında
  · `/tr` ilk yükleme **215.5 → 218.4 kB gz** (+2.9: kapı/seçim/yükleyici arayüzü)
  · **Zone chunk 241.5 kB gz — limit 180 → 260'a çekildi (karar 2026-09-18, kullanıcı).** 180 gerçek maliyet bilinmeden yazılmış bir tahmindi. Chunk ana sayfaya dokunmuyor, LCP'yi bozmuyor, kullanıcı kapıya basıp yükleyiciyi gördükten sonra iniyor. **Kırılım ölçüldü:** drei **2.7 kB** (tek kullanıcısı `<Html>`, budama çalışıyor) · yalnız three **245.4 kB** → **yük neredeyse tamamen three**; fiber/drei'de kesecek şey yok. İleride mobilde takılırsa tek kesme yeri three'nin kendisi (spec bölüm 9)
  · Ekranlar: `docs/screens/faz-5.5.9-{1-anasayfa,2-secim,3-yukleyici,4-sahne}-{1440,390}.png`
- **Zone durumu (5.5.8 sonu):** `SİPARİŞ VER` tablosuna girince **15 satırlık sipariş tahtası** açılıyor (7 smash burger · 4 yanında · 4 içecek/tatlı). −/+ adet **mevcut `useCartStore`'a** yazıyor; Zone'da eklenen ürün site sepetinde ve sepet rozetinde görünüyor (uçtan uca doğrulandı). Sticky alt şerit: TOPLAM (`aria-live="polite"`) + gönder düğmesi. Sahne 21 doku (değişmedi).
  · `zone-camera-check` → **84/84** · `zone-leak-check` → doku 21 sabit, kapalıyken 0 · `/tr` **215.5 kB gz**
  · **Adet değişince `scrollTop` korunuyor** (ölçüldü: 99 → 99); `−` adet 0 iken devre dışı; `Menu.disclaimer` tahtanın üstünde
  · **Kural 66 — sipariş adaptörü kuruldu:** `lib/order/submit.ts`. `OrderBoard` ve site sepeti **aynı** yolu kullanıyor, ikisi de WhatsApp'ı bilmiyor, düğme metni `channel.labelKey`'den geliyor. Sabotajla doğrulandı: adaptör boş gerçeklemeyle değiştirildiğinde ikisi de derleniyor; `wa.me` sipariş yolunda **yalnızca adaptörde**
  · `Order` namespace'i eklendi (`intro`/`total`/`send`, `Cart.waIntro`/`waTotal`'dan taşındı) ve `BASE_CLIENT_NAMESPACES`'e girdi
  · Ekranlar: `docs/screens/faz-5.5.8-orderboard-{1440,390}.png`
- **Zone durumu (5.5.7 sonu):** **Joystick ekranda** — sağ altta (right 22 + safe-area, bottom 30 + safe-area), 112 px taban + 50 px topuz, masaüstünde de görünür ve fareyle sürüklenir. Çıktı dünya-göreli, `readInput()` içinde klavyeyle **toplanıyor**: sekiz yönün sekizi de `S`/`D`/ok tuşlarıyla **birebir aynı yön vektörünü** üretiyor. Sahne 21 doku (değişmedi).
  · `zone-camera-check` → **73/73**
  · **Dinleyiciler `window`'da**, tabana değil: sürükleme pedin dışına çıkınca ölmüyor; düğme **pedin dışında** bırakılınca kontrol sıfırlanıyor, karakter duruyor, topuz merkeze dönüyor. `blur` da bırakıyor
  · Topuz taban yarıçapıyla sınırlı (merkeze uzaklık ≤ r−18) · joystick aşağı → **180° dönüş**, süre simülasyon saatiyle ölçülüyor
  · POV'da / pano açıkken gizleniyor, çıkınca geri geliyor · reduced-motion'da topuzun merkeze dönüş geçişi kapanıyor, **kontrol çalışmaya devam ediyor**
  · **`aria-hidden`** (karar 2026-09-18, kullanıcı — spec 7.1'deki `role="application"` + `tabindex` önerisinin yerine): klavye zaten WASD/ok ile global çalışıyor, ekran okuyucuya ikinci kontrol sunulmuyor. Odaklanabilir olmadığı için güvenli
  · **Yığın sırası düzeltildi:** sitenin sepet düğmesi `fixed z-60` ve tam aynı köşede; joystick `z-40` iken onun altında kalıyordu (topuz ve "SÜRÜKLE" görünmüyordu). Joystick z-70, `FrameBoard` z-75. Kontrol eklendi: joystick merkezinde `elementFromPoint` joystick'i dönmeli
  · Ekranlar: `docs/screens/faz-5.5.7-joystick-{1440,390}.png` (sürükleme hâlinde)
- **Zone durumu (5.5.6 sonu):** tabloya girilince kamera `POV_LERP` (.055) ile karşısına süzülüyor, prompt/halka nabzı duruyor, ortada **`FrameBoard`** kartı açılıyor (min(92vw,720px), 14px ink kenarlık, sticky berry şerit, ← GERİ; kenarlarda 3D sahne görünmeye devam ediyor). İçerik panoları 5.5.7 ve 5.5.9'da; şu an kabuk künye + başlık + görsel gösteriyor. Sahne **21 doku** (değişmedi).
  · `zone-camera-check` → **62/62**, üç ardışık temiz koşu
  · **Odak (spec 10)**: dört tabloda da GİR → odak panoda, GERİ → odak GİR butonunda. `focus({preventScroll:true})` şart: odak vermek sayfayı kaydırıp kartın üstünü kadrajdan çıkarıyordu (`scrollY` 0→123, kart üstü −32)
  · **Yarım geçişte Esc** temiz (iki dal da kameranın o anki konumundan lerp ediyor, mutlak atama yok) · **E–Esc dört kez hızlı**: durum makinesi kilitlenmiyor, hedef karışmıyor
  · **Kural 55-A sabotajla doğrulandı:** `Zone` namespace'i kaldırılınca **4220 `MISSING_MESSAGE`** ve ekranda ham anahtarlar ("ZONE.KİCKERS.MENU") — 5.5.8'de sessizce kırılması imkânsız
  · Ekranlar: `docs/screens/faz-5.5.6-{pov-gecis-ortasi,dort-pano}-{1440,390}.png` (kartlardaki alttaki beyaz şerit lab sayfasının **çerez bandı**, Zone'a ait değil)
- **Zone durumu (5.5.5 sonu):** dört tablo duvarda (ink kutu + krem paspartu + **gerçek fotoğraf**, üstünde hardal spot bandı), önlerinde dönen zemin halkası + nabız, yaklaşınca `drei/<Html>` prompt (başlık + GİR). `E` ile girilir, `Esc` ile çıkılır; POV'da hareket kapalı, prompt gizli. Sahne **56 mesh · 21 doku**.
  · `zone-camera-check` → **54/54** · `zone-leak-check` → 6 tur, **doku 21 sabit**, kapalıyken 0, konsol 0
  · `zone-bundle-check` → three ana bundle'da yok, `/tr` **215.5 kB gz**
  · Kabul kriteri doğrulandı: **halkanın üstündeki 8 noktanın hepsi tetikliyor** (görünür yarıçap 2.3 < tetikleme 2.6), 2.8'de kapanıyor
  · Görseller gerçek dosyalardan yükleniyor (4 çerçeve, 404 yok); `artPlaceholderTexture` yalnızca yüklenemezse devrede kalır
  · **Bozuk görsel yolu sabotajla denendi** (Kural 60): `crew` yolu geçersiz yapıldı → yalnız o çerçeve `placeholder`'a düştü, diğer üçü `image`, doku sayısı değişmedi, konsol temiz, çökme yok. **Normal işleyişte 4xx yok**; bozuk yolda tarayıcının 404 isteği kaçınılmaz (`TextureLoader` denemeden bilemez), Kural 53'ün istediği "kasıtsız 4xx yok" şartı sağlanıyor
  · **Prompt metni i18n'den geliyor** — `drei/<Html>` DOM'a portal ediliyor ama next-intl context'i sınırı geçiyor; `zone-camera-check` metni denetliyor (Kural 55-A: 5.5.8'de ana sayfanın sağlayıcısına `Zone` namespace'i eklenmeli)
  · **Prompt çapası revize (ONAYLANDI 2026-09-18):** `promptAnchor()` — duvardan **0.9 birim önde** (`side*(HALF_W−0.12−0.9)` = ±6.18), `PROMPT_HEIGHT` 1.35 değişmedi. Kutu **aşağı sarkıyor** (`translate(-50%, 0)`, onaylandı — sapma değil iyileşme: promptu halkaya yaklaştırıyor): 0.9'luk kaydırma tek başına yetmedi, tablonun altında ekranda ~35 px boşluk varken kutu ~58 px — masaüstü 22.6 px / portre 36.4 px örtüşüyordu. Şimdi **dört tabloda da duvara dayalı hâlde sıfır örtüşme** (masaüstü 52 px, portre 33 px boşluk), `zone-camera-check` denetliyor
  · **Çerçeve görsel materyali `transparent`** — `misu-lockup.png` alfalı; şeffaflık okunmayınca tablo düz bordo blok çıkıyordu (Kural 59 gözle bakmada yakalandı)
  · Ekranlar: `docs/screens/faz-5.5.5-prompt-duvarda-{dort-tablo,390}.png` (dört tablo, duvara dayalı) · `faz-5.5.5-{yaklasirken,halkanin-ustunde}.png` (istenen iki kare) · `faz-5.5.5-zone-1440-{salon,halka,tablo}.png`, `faz-5.5.5-zone-390-halka.png`
- **Zone durumu (5.5.4 sonu):** salonda iki maskot var — oyuncu yürüyor, **seçilmeyen maskot** salonun dibinde (x −3.2, z −12) `front` görünümüyle idle duruyor; ikisi de billboard yapıyor. Arkada **18'lik ayak izi havuzu** (0.26 sn, sağ/sol dönüşümlü, saniyede 0.28 sönme, **dönüş ve konum hareket yönünden**). Tavan ışık bantları prototip ölçüsünde (0.5 × 36, y 5.96). Sahne 32 mesh · 15 doku.
  · `scripts/zone-camera-check.mjs` → **44/44**, üç ardışık koşu temiz (oynaklık giderildi — Kural 60)
  · `zone-leak-check` → 6 tur: bağlam 1 · canvas 1 · **canlı doku 15 sabit** · ölü bağ 0 · **kapalıyken 0** · konsol 0. Tur içinde kısa yürüyüş var: ayak izi dokusu ilk adımda üretildiği için, yürümeden ölçmek o dokuyu kapsam dışında bırakıyordu
  · `zone-bundle-check` → three ana bundle'da yok, `/tr` **215.0 kB gz** (değişmedi)
  · **Ayak izi görünürlüğü ölçüldü:** yürürken 8–11 iz canlı ama kamera karakterin ÖNÜNE baktığı için **aynı anda yalnızca 1–2'si kadrajda** (portrede 2–3). İzler doğru basılıyor, dönüyor ve sönüyor; mesele kamera geometrisi (CAM_DIST 5.4 arkada, LOOK_AHEAD 3.0 önde) — prototipte de aynı. Daha görünür istenirse iz ölçüsü/opaklığı büyütülür (karar planlayıcıda)
  · Ekranlar: `docs/screens/faz-5.5.4-zone-1440-{baslangic,izler,npc,donusta}.png`, `faz-5.5.4-zone-390-{portre,izler}.png`
- **İçecek fiyatları kararı (2026-09-18, kullanıcı): uydurma rakamlar kaldırıldı.** Limonata 120 / soft drink 90 / ayran 80 bizim uydurduğumuz değerlerdi ve arayüzde gerçek fiyatlardan ayırt edilemiyordu; disclaimer bunu kurtarmıyor. Üçü de `price: null` → **"YAKINDA" rozeti, `+` devre dışı (`aria-disabled` + `title`), toplama girmiyor, sepete eklenemiyor.** Koşul **veriden** türüyor (`price == null`), koda slug listesi gömülmedi: gerçek fiyat `menu.ts`'e girildiği an satır kendiliğinden normale döner. Burger fiyatları menüden geldiği için kalıyor.
- **Kapanan kararlar (2026-09-18, kullanıcı):** ① `CHAR_TURN_BASE = 0.002` **onaylandı** — 0.005 denendi, tepe sapma 65.1°, `side` eşiği 67.5°'nin altında kaldığı için reddedildi (spec 3.1'e işlendi). ② **Ayak izleri: değişiklik yok** — 0.22 × 0.3 ve 0.85 opaklık kalır; az görünmeleri kamera geometrisinin sonucu, kusur değil, dekoratif öğe için izi büyütmek karakterle ölçek ilişkisini bozar. **İki madde de kapandı.**
- **Revizyonlar (2026-09-18, planlayıcı):** **A · FOV portrede uyarlanıyor** — `fovForAspect()` yatay 46°'yi hedefler, dikeyi orandan türetir, `clamp(48, 72)`. Masaüstü **48.0°** (değişmedi, alt sınıra takılıyor) · portre **72.0°**, yatay 23° → **37.1°**. **B · `CHAR_TURN_BASE` 0.02 → 0.002** (0.005 DEĞİL, aşağıdaki günlüğe bak): `side` kovası artık tetikleniyor. **C ·** billboard kararı spec'e işlendi.
- **Serbest gezinmede tetiklenen sprite kovaları (ölçüldü, iki kırılımda da aynı):** 180° dönüş → `back`, `back34`, **`side`** (tepe ayrışma **74.2°**) · 90° dönüşler → `back`, `back34` (37°) · düz yürüyüş → `back`. **`front` serbest gezinmede ulaşılamaz** (tavan %44.5 → 80°, eşik 112.5°) — o görünüm NPC'de ve 5.5.10'daki `CharacterSelect`'te kullanılıyor, yani 8 çizimin hiçbiri ölü değil.
- **Zone durumu (5.5.3 sonu):** `/lab/zone` gezilebilir — 12 mesh (10 salon + karakter sprite'ı + gölge). **Kamera yürünen yöne dönüyor**, karakter (Misu/Miyu) WASD/ok tuşlarıyla yürüyor, sprite açıya göre 4 görünüm arasında geçiyor ve karşı taraf `scale.x=-1` ile aynalanıyor.
  · `node scripts/zone-bundle-check.mjs` → three ana bundle'da **yok** (`/tr` **215.0** kB gz — 5.5.2'den değişmedi, 5.5.3 ana bundle'a hiçbir şey eklemedi)
  · `CHROME=… node scripts/zone-leak-check.mjs` → 6 tur aç-kapa: `alive` 1 · canvas 1 · **canlı doku 10 sabit** · **ölü doku bağı 0** · **kapalıyken doku 0** · konsol 0
  · `CHROME=… node scripts/zone-camera-check.mjs` → **32/32** (üç açı tuzağı + dört yön + 180° + billboard + aynalama + reduced-motion)
  · **Zemin moiré'si YOK** (TODO kapandı): anizotropi cihaz maksimumuna (16) çekildi, `repeat(10,26)` **değişmedi**. A/B: `aniso 4` uzakta kontrastı erken kaybediyor, 16'da dama fogа kadar temiz çözülüyor.
  · **Karakter çizimleri hâlâ yok** — `drawCapy()` geçici sprite üretiyor. PNG yolu (`TextureLoader`) yazıldı **ve uçtan uca denendi** (8 geçici PNG ile: `spriteSource` → `png`, doku sayısı sabit, ölü bağ 0). Çizimler gelince `character.ts`'teki `MASCOT_SPRITE_BASE` sabiti `"/images/mascots"` yapılır — **başka hiçbir şey değişmez**. Otomatik yoklama bilerek yapılmıyor: olmayan PNG'ye istek 404 üretip Kural 53'e takılır. Dev'de `?sprites=<yol>` ile aynı yol denenebilir.
  · Ekranlar: `docs/screens/faz-5.5.3-zone-1440-{baslangic,sag,sol,180,donusta,miyu}.png`, `faz-5.5.3-zone-375{,-180}.png`
  · 5.5.2 ekranları: `docs/screens/faz-5.5.2-zone-1440.png`, `faz-5.5.2-zone-375.png`
- Son başarılı build: 2026-09-18 **5.5.11 kapanış** (`pnpm lint` + `pnpm build` temiz, 0 uyarı; 21 rota + `ƒ Proxy`). 5.5.10 kapanış (`pnpm lint` + `pnpm build` temiz, 0 uyarı; 21 rota + `ƒ Proxy`). Faz 8 kapanış (`pnpm build` + `pnpm lint` temiz, 0 uyarı; 20 rota + `ƒ Proxy`; `scripts/lab-check.mjs` **93/93 chromium + 93/93 webkit**; Lighthouse A11y 100 / SEO 100)
- **AÇIK PERFORMANS BORCU (Faz 8'den devreden):** ① `/tr/menu` mobil LCP **3465 ms** ve `/tr/contact` **2888 ms** (hedef < 2500) — perf ikisinde de ≥ 90. ② First Load JS **214.6 kB gz** (hedef ≤ 200). İkisinin de kökü aynı: simüle yavaş 4G'de ~215 kB JS, font ve görselle bant genişliği paylaşıyor. Kalan yük React+Next+next-intl çatısı (en büyük üç chunk 71.4 / 45.6 / 39.4 kB gz) — daha fazlası çatı seviyesi müdahale ister.
- **Demo sunumu için:** eksik bilgiler arayüzde `SoonBadge` ile gösteriliyor (Kural 54-A), yapılandırılmış veride hiç yazılmıyor (Kural 54-B). Footer'daki dev MANCH wordmark **kasıtlı dekoratif filigran** — kontrast 1.3:1 ama `aria-hidden="true"`, metin değil, marka adı nav logosunun erişilebilir adında var; axe/Lighthouse temiz (karar 2026-09-18). `/menu`'deki `<h1>` metin içeriği boş, adı SVG `aria-label`'ından geliyor → axe **100** veriyor, sorun değil.
- **priority kararı (/menu, ölçüldü 2026-09-18):** filtresiz ilk kartta `priority` **AÇIK** kalıyor — ilk boyama her zaman filtresizdir (filtre hydrate sonrası uygulanır), dolayısıyla sunucunun yaydığı preload ilk boyamada doğru karta işaret eder. Ölçüm: AÇIK mobil 2536 / masaüstü 476 ms · KAPALI 2752 / 524 ms. `/about`'ta `team-counter` LCP adayı → priority eklendi (1552 → 1092 ms).
- Sayfa LCP'leri (prod, throttled, 3 koşu medyanı): `/` **796/228 ms** · `/menu` **2348/488** · `/about` **1092/252** · `/contact` **752/224** (mobil/masaüstü)
- Ana sayfa LCP (prod build, throttled, `?nopreload=1`): **mobil 792 ms** (`hero-cook` 750w 20 KB avif) · **masaüstü 212 ms** (`team-kitchen` 1920w 32 KB avif); ikisinde de LCP elementi statik H1, CLS ≤ 0.0004
- Dal: **`faz-1-yeniden`** — proje bu dalda sıfırdan kuruldu. Eski tam proje `main` + `yedek/faz-1-9` dalı + `yedek-faz-9` etiketinde.
- **Canlı: https://manch-eight.vercel.app — `origin/main` = `e05f994`, 2026-09-18'de push edildi, deploy yeşil, `scripts/smoke.mjs` 10/10 ✓ 0 uyarı.** Vercel `NEXT_PUBLIC_SITE_URL` ayarlı.
- **Devralınanlar (main → faz-1-yeniden):** `public/` (32 dosya: 7 burger kesiti PNG+WebP, 6 malzeme ikonu, 3 fotoğraf JPG+WebP, maskot, 4 logo) · `src/data/menu.ts` (6 kategori, **25 ürün, 24'ünde gerçek fiyat 35–790 TL**) · `src/lib/site.ts` (**telefon, WhatsApp, e-posta, Facebook dolu**; `hours` + `orderUrl` hâlâ null) · `src/messages/{tr,en}.json` (19 namespace, 216 anahtar, simetrik) · `src/assets/fonts/Modak-Regular.ttf` (OG için, Kural 39) · **KURALLAR 49 madde + HATA GÜNLÜĞÜ 39 satır**.
- **Devralınmayanlar (Faz 2+ kodu, yeniden yazılacak):** `src/components/**`, `src/styles/{fonts,tokens}.ts`, `src/lib/{seo,gsap,*-store}.ts`, `src/i18n/client-messages.ts`, `src/app/{icon,apple-icon,manifest,robots,sitemap}`, `[locale]/opengraph-image.tsx`, `scripts/**` (lab-check, lighthouse, bundle-report, smoke, content pipeline) — hepsi `main`'de duruyor, ilgili fazda oradan referans alınabilir.
- **RENK TEYİDİ (2026-09-18) — 9 tokendan yalnızca 3'ü doğrulanabildi:**
  - `public/logo/*.svg` **renk taşımıyor** (`fill="currentColor"`, potrace izi — Kural 42). `public/logo/logo-manch.png` ise `photos_logo.py` içinde `BERRY = (0x7A,0x1F,0x4B)` ile boyanarak üretilmiş → **döngüsel kanıt, teyit sayılmaz**.
  - Tek bağımsız kaynak **`docs/source/menu-print.png`** (düz renkli tasarım dosyası, fotoğraf değil).
  - `berry` → **#7A1F4B'den #6A1F3B'ye güncellendi (karar 2026-09-18, kullanıcı)**; kaynak menü baskısındaki wordmark (%45.9). Kontrast Kural 40 açısından **iyileşti**: berry/cream 8.57→9.73 · berry/pink 4.89→5.55 · berry/tile 5.15→5.85 · mustard/berry 6.03→6.84 — hiçbir çift gerilemedi.
  - `sky #c4e4f3` → mavi burger filigranı **~#C7E0F2**. Fark ihmal edilebilir ✓
  - `cream #f4eee6` → **değişmiyor (karar 2026-09-18)**; ölçülen #FEF8F3 kağıt zemini, marka rengi değil.
  - `tile #8fc3d6` → yalnızca fotoğrafta var (~#84A8BA, ışık bağımlı) — **teyit edilemez**.
  - `berry-dk` · `paper` · `pink` · `mustard` · `ink` → **hiçbir kaynakta yok, teyit edilemez.**
  - Kalan 7 token (`berry-dk` `sky` `tile` `paper` `pink` `mustard` `ink`) **değişmiyor** — teyit için orijinal vektör logo / marka kılavuzu gerekli.
- **GERÇEK VERİ (2026-09-18, kullanıcı):** İşletme **zaten açık** — Google kaydında 150 yorum / 4,5 puan, aylardır çalışıyor. Brief'teki "2026 yazı açılış" ve "çok yakında Fethiye'de" ifadeleri **yanlıştı**; açılış vaadi veren tüm metinler tarandı ve düzeltildi. `site.openingLabel` (kullanılmıyordu) ve `Common.todo` · `Home.location.hoursSoon` (öksüz) silindi; "EST. 2026" kuruluş rozeti olarak **bilerek bırakıldı**.
- **Çalışma saatleri geldi (2026-09-18):** Pzt–Per 08:30–23:30 · Cum–Cmt 08:30–00:00 · Paz 08:30–23:30. `site.hours` dolu, arayüzdeki saat rozetleri kalktı, JSON-LD'ye `openingHoursSpecification` **eklendi**, `addressRegion: "Muğla"` eklendi. Kural 54-B artık saatler için geçerli değil — veri var.
- **Sipariş linki hâlâ YOK:** Google'daki buton Google'ın ara sayfasına gidiyor, gerçek sağlayıcı belli değil → `site.orderUrl` `null`, `SoonBadge` orada duruyor, sipariş akışı WhatsApp'ta.
- **Kararlar (2026-09-18, kullanıcı):** ① ~~Smash Anatomy (R15)~~ **iptal** → yerine **R15b BuildSequence** (6 kare yapım sırası, pin yok; gerekçe: gerçek katman fotoğrafı yok + eski pinned hatası). ② Instagram grid **6 gerçek 1:1 fotoğrafla** dolduruldu; kesit/metin kartı karıştırılmaz. ③ 25 ürün açıklaması TR+EN girildi (taslak, onay bekliyor).
- Açık TODO'lar: **Misu & Miyu'nun 4 açılık çizimleri** (8 dosya, `public/images/mascots/`; gelene kadar `drawCapy()` geçici sprite üretiyor — geldiğinde tek satır: `character.ts` `MASCOT_SPRITE_BASE = "/images/mascots"`) · **`@react-three/fiber@9.7.0` prod konsoluna `THREE.Clock` deprecation uyarısı basıyor** (kütüphane kaynaklı, 9.7.0 son kararlı sürüm — **kalıcı kabul edildi**, belgeli istisna) · **içecek fiyatları teyit bekliyor** — uydurma değerler KALDIRILDI, üçü de `price: null`; tahtada YAKINDA rozeti, sipariş edilemiyor (karar 2026-09-18) · **`hero-cook.jpg` ve `team-kitchen.jpg` aynı fotoğrafın iki kopyası** — tek kaynağa indirmek değerlendirilecek (şu an mobilde biri, masaüstünde diğeri yükleniyor) · **menü metinleri taslak — müşteri onayı bekliyor** (25 ürün TR+EN, 2026-09-18'de girildi; `Menu.disclaimer` bunu sitede de duyurur) · **orijinal vektör logo + marka renk kılavuzu isteniyor** (kalan 8 renk tokeninin teyidi buna bağlı) · **çalışma saatleri** (`site.hours` null) · **sipariş linki** (`site.orderUrl` null) · domain (Cloudflare adımları aşağıda) · Crispy Triangle fiyatı yok (`price: null`) · **16 üründe fotoğraf yok** — 8 burgerden tek görselsiz olan **Guacamole Burger** (Placeholder ile çalışıyor); ayrıca ( 6 sos, 4 extra, 2 fries, corn ribs, tenders, arancini) · orijinal fotoğraflar (kaynaklar ekran görüntüsü 749–1222 px) · maskot vektörü (`misu-miyu.png` 472×270) · logo orijinal vektörü (şimdiki SVG'ler potrace izi) · renk kodlarının logodan teyidi · Webber Digital URL · Google Place ID · **5 üründe açıklama aynı** (jenerik metin — ADIM 5 bulgusu)
- **Cloudflare DNS adımları (domain gelince):** 0) `NEXT_PUBLIC_SITE_URL`'i yeni domaine güncelle (Kural 57) · 1) Vercel → `manch-v2` → Settings → Domains → alan adını ekle · 2) Cloudflare DNS → `CNAME` `@`/`www` → `cname.vercel-dns.com` (proxy **kapalı**, DNS only) · 3) Vercel doğrulaması yeşil · 4) `NEXT_PUBLIC_SITE_URL` güncelle · 5) redeploy · 6) `node scripts/smoke.mjs https://<domain>`

---

## 📏 KURALLAR

1. Paket yöneticisi **pnpm**. npm/yarn kullanma.
2. Push'tan önce **hem `pnpm lint` hem tam `pnpm build`** *(revize: 2026-09-18)*. İkisi **farklı
   sınıf** hata yakalar; build'in temiz geçmesi lint'i gereksiz kılmaz — tersi de doğru değildir.
   Kanıt: JSX içinde `{/* */}` yerine düz `/* */` yazılan yorum **build'den geçer** (geçerli bir
   metin düğümüdür) ve kullanıcıya **görünür metin olarak render edilir**; yalnız
   `react/jsx-no-comment-textnodes` yakalar. Tersi yönde: tsc/lint temizken de build düşebilir
   (Suspense sınırı, `images.qualities`, statik render). **Zincirlerde kapı `lint && build`.**
3. GSAP / Lenis / cursor / DOM ölçen her şey `"use client"` component'te; `useGSAP` + cleanup (`ctx.revert()`).
4. `prefers-reduced-motion` açıkken ağır animasyonları kapat.
5. Tüm kullanıcıya görünen metinler `messages/tr.json` + `messages/en.json` üzerinden. Koda sabit metin yazma.
6. Marka sabitleri sadece `src/lib/site.ts` içinde; menü sadece `src/data/menu.ts` içinde.
7. Görsel yoksa kırık görsel yok: berry/sky renkli placeholder blok.
8. Ölçüler vw tabanlı + her birinin `max-md:` karşılığı.
9. Hover ile kopyalanan metinlerde ikinci kopya `aria-hidden="true"`.
10. Bir fazın kapsamı dışına çıkma; eksik gördüğün şeyi DURUM > TODO'ya yaz.
11. pnpm yoksa `corepack enable --install-directory ~/.local/bin pnpm` ile aktifleştir ve `~/.local/bin`'i PATH'e ekle; `/usr/local/bin` sudo ister, npm ile global kurulum yapma.
12. Proje **Next.js 16** üzerinde. Next 16 API'leri 15'ten farklı: kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili rehberi oku, eğitim verisindeki 15 alışkanlıklarına güvenme.
13. Kökteki `AGENTS.md` dosyasını silme; `next dev` her çalıştığında yeniden yazıyor. Commit'e dahil et.
14. Route-level kod `src/proxy.ts` içinde (Next 16). `middleware.ts` oluşturma; next-intl `createMiddleware` proxy olarak export edilir.
15. Sayfa içi linklerde `next/link` değil `@/i18n/navigation`'daki `Link` / `useRouter` / `redirect` kullan — locale prefix'i otomatik.
16. `[locale]` altındaki her server component'te `setRequestLocale(locale)` çağır; aksi halde statik render bozulur.
17. Menü ürün modeli: `name` ve `desc` `Localized` (`{tr,en}`), `ingredients` `Record<Locale,string[]>`. Teyit edilmemiş ürünlerde `unconfirmed: true`.
18. `font-pixel` = **Press Start 2P** (karar 2026-09-17, çelişki 2026-09-18'de kapatıldı). Gerekçe: Silkscreen'in latin-ext dilimi `ğ ş ı Ğ Ş İ` içermiyor (hata günlüğü, Faz 2), Press Start 2P 12/12 TR karakteri veriyor → pixel font **TR metinlerde de** güvenle kullanılır. Silkscreen yalnızca `font-pixel-alt` olarak `/lab`'da karşılaştırma amaçlı kalır (`preload: false`).
19. Modak / Mouse Memoirs'ta eksik TR karakter varsa fallback zinciri `@theme` font token'ında tanımlanır (`--font-display: var(--font-modak), <fallback>, ...`); `/lab` sayfasında eksik karakterler görünür şekilde işaretlenir.
20. Git kimliği repo-local: `Webber Digital <saygingemici25800@gmail.com>` (karar 2026-09-17).
21. Yeni bir font eklerken TR kapsamını `latin-ext` etiketine güvenmeden doğrula: build sonrası `.next/static/media/*.woff2` dosyalarında cmap union'ı (fontTools) **ve** `/lab` GlyphCheck. Fontlar tek dosyada: `src/styles/fonts.ts`; token listesi `src/styles/tokens.ts` `globals.css` ile senkron tutulur.
22. Tailwind v4: renkler `@theme`, next/font değişkenlerini tüketen font tokenları `@theme inline`. Özel sınıflar `@utility` ile; `max-md:` karşılığı utility içinde `@media (width < 48rem)`.
23. `/[locale]/lab` sadece development: sayfa başında `if (process.env.NODE_ENV === "production") notFound()`. Production build'de lab 404 döner; lab doğrulaması `next dev` ile yapılır.
24. Smooth scroll: **Lenis çekirdeği lazy** (revize 2026-09-18). `lenis/react` provider'ı KULLANILMIYOR — ilk yükleme JS'ine 21.6 kB gz ekliyordu (Kural 46). Yerine: `SmoothScroll` effect içinde `import("lenis")` eder, örneği `src/lib/lenis-store.ts` (zustand) içine yazar; tüketiciler `useLenis()` ile oradan okur, callback formu için `useLenisScroll(cb)`. Ağaç sarmalanmadığı için `children` normal SSR edilir. Ticker: `lenis.raf()` sonrası **`ScrollTrigger.update()`** de çağrılır (Lenis scroll event köprüsü tek başına güvenilmez); `lagSmoothing(0)`. `lenis` mount anında `null`dır — her tüketici `lenis?.` ile korunur. Sistem reduced-motion'ı Lenis kendisi izler; lab override'ı için `lerp` modül-seviyesi `applyLerp()` ile 1 yapılır (Kural 25).

25. React Compiler lint kuralları aktif (`react-hooks/refs`, `react-hooks/immutability`, `react-hooks/set-state-in-effect`): effect içinde **senkron `setState` yok** (türetilmiş değer kullan ya da `setTimeout(fn, 0)` ile ertele, cleanup'ta temizle); closure'larda `ref.current` **okumak da yazmak da** yasak — closure'larda `document.title =` gibi global mutasyon ve modül-seviyesi `let` ataması da yasak → hepsi ayrı modülde plain fonksiyon (`src/lib/transition-title.ts`), closure sadece çağırır; `ref.current`'i render'da **ve render'da çağrılan closure'larda** (`contextSafe(...)` dahil) okuma → GSAP hedefini `useGSAP({ scope })` selector'ıyla ver (`".wrap"`, `"path"`); dinamik element için `createElement(as, { ref })` değil `const Tag = as; <Tag ref={ref}>`; kütüphane nesnesi mutasyonunu (`lenis.options.x = …`) modül-seviyesi helper fonksiyona taşı.
26. Her motion primitive `useReducedMotion()` okur (`src/lib/hooks/useReducedMotion.ts` = sistem tercihi ∨ `useMotionStore.forceReduced`), `true` ise GSAP kurmadan statik render eder. GSAP eklentileri sadece `src/lib/gsap.ts` üzerinden import edilir (tek `registerPlugin`).
27. CursorTrail: `data-cursor-hide` **sadece açıkça işaretlenen** elementlerde (BlobButton, hap butonlar, nav). Otomatik `button, a` selector'ı yok — her yeni etkileşimli bileşen kendi karar verir (karar 2026-09-17).
28. Marquee metinleri iki dilde de İngilizce (`Motion.marqueeItems` / `Home.marquee*` tr.json'da da EN). **Not (2026-09-18):** bu Kural 18'in eski (Silkscreen) halinin sonucuydu; Press Start 2P TR karakterleri desteklediği için artık teknik zorunluluk değil, marka sesi tercihi — istenirse TR marquee metni yazılabilir.
29. PageTransition: React `<ViewTransition>` / View Transitions API **kullanılmıyor** — snapshot crossfade'i canlı GSAP path morph'u ve "eski sayfayı perde kapanana kadar tut" akışını veremez. Yol: `TransitionLink` (next-intl `Link` + `onNavigate` → `preventDefault`) → `useTransitionStore.trigger(href)` → perde kapanır → `router.push` → `usePathname` değişince perde açılır; 4 s fallback. Reduced motion / hash / aynı sayfa: normal navigasyon. Tüm iç linkler `TransitionLink`.
30. `persist` (localStorage) store'ları SSR'da boş; badge/sayaç gibi çıktılar `useHydrated()` sonrası render edilir (hydration uyuşmazlığı yok). Preloader `sessionStorage`, cookie `localStorage` sadece effect'te okunur.
31. Koşullu `null` render eden client component'te `useGSAP({ scope })` kullanma: ref effect içinde okunur, yoksa erken çıkılır, hedefler element olarak verilir. Aksi halde bağımlılık değişince "Invalid scope" uyarısı.
32. Pinned section'lar (R15): Lenis `root` modu native scroll kullanır (body'de transform yok) → `ScrollTrigger` `pin: true` **varsayılan `pinType` ("fixed") ile** çalışır; `pinType: "transform"` gerekmez (izole test `/lab#pin`, 1440 + 375, 2026-09-17). Pin edilen element `overflow-hidden` + `h-[100svh]`; ScrollTrigger `scrub` ile timeline. `ScrollTrigger.normalizeScroll` kullanma (Lenis ile çakışır). Pin'li elemanın kendisine `scrollIntoView` yapma (ST onu spacer sonuna taşımış olabilir) — hash/anchor hedefleri her zaman section'dır. Hash navigasyonu (`/#zone`): pin spacer mount'tan sonra eklendiği için Next'in hash scroll'u kısa düşer → `LenisTicker` pathname değişince 60 ms sonra `ScrollTrigger.refresh()` + `scrollIntoView` yapar.
33. Ana sayfa kart girişleri tek `ScrollTrigger.batch` ile (`ProductGrid`), kart içinde SplitText yok; SplitText sadece section başlıklarında. Section id'leri: `#hits` `#zone` `#location` (`scroll-mt-[6vw]`).
34. `useSearchParams` (Next 16, `use-search-params.md`): statik/prerender edilen sayfada bunu çağıran client component **`<Suspense>` içinde** olmalı — dev'de çalışır gibi görünür, `next build` "Missing Suspense boundary with useSearchParams" ile düşer. Kalıp: `page.tsx` (server) → `<Suspense fallback={…}><MenuClient/></Suspense>`. URL state tek kaynak: `?p=slug` → modal açık; `router.replace(pathname, { scroll: false })` ile kapanır.
35. 404: `app/[locale]/not-found.tsx` + `app/[locale]/[...rest]/page.tsx` (`notFound()` atar) — next-intl kalıbı; nav/footer/messages korunur, statik sayfada status 404. `global-not-found.js` (experimental, layout'u atlar) kullanılmıyor. `not-found.tsx` `params` almaz; locale `getLocale()` ile okunur, `setRequestLocale` gerekmez.
36. `useGSAP` `dependencies` yalnızca primitive / kararlı değerler (`reduced`, slug anahtarı). Prop olarak gelen türetilmiş diziler/nesneler üst component'te `useMemo` ile sabitlenir; store'a bağlı sık render'lar (scroll → `navHidden`) `revertOnUpdate`'i tetiklememeli.
37. UI component'lerinde `className` prop'u base sınıfları **ezemez** (Tailwind çıktı sırası alfabetik/katman bazlı, `relative` > `absolute`). Konum/boyut gibi override edilebilecek base sınıflar koşullu eklenir (`!className?.includes("absolute") && "relative"`) ya da `!` important varyantı istenir.
38. SEO dosya kuralları (Next 16 `file-conventions/metadata`): `app/sitemap.ts` + `app/robots.ts` + `app/manifest.ts` **kök `app/`'ta** (layout gerektirmez); `alternates.languages` sitemap'te de metadata'da da `{ tr, en, "x-default" }`. Sayfa metadata'sı `src/lib/seo.ts#pageMetadata` ile (canonical `/${locale}${path}`, hreflang, OG, Twitter); `metadataBase` = `site.url` (`NEXT_PUBLIC_SITE_URL`, TODO domain). Title şablonu layout'ta `%s | MANCH`, sayfalar kısa başlık verir, ana sayfa `absolute`.
39. `next/og` (`ImageResponse`): `app/[locale]/opengraph-image.tsx` Node runtime'da, `params.locale` alır; font **TTF/OTF/WOFF** (woff2 yok) → `src/assets/fonts/Modak-Regular.ttf` (OFL) `readFile(join(process.cwd(), …))` ile. İkonlar `app/icon.tsx` (`generateImageMetadata` → `/icon/32`, `/icon/512`) + `app/apple-icon.tsx` (180); logo gelince PNG/SVG ile değişir.
40. Erişilebilirlik: metin renginde opaklık yok (`text-berry-dk/70`, `opacity-60` yasak) — tam palet rengi; ölçülen tüm çiftler ≥ 4.5:1 (berry/cream 8.6, berry/pink 4.9, berry/tile 5.2, ink/mustard 10.5, mustard/berry 6.0). `:focus-visible` global hardal halka (mustard zeminde berry-dk); skip link `#main` (her sayfada `<main id="main">`). Dialog'lar `role=dialog aria-modal` + `aria-label`/`aria-labelledby`.
41. Görsel pipeline (`scripts/content/`, **`scripts/content/.venv`** — Python 3.9.6, rembg 2.0.61, onnxruntime 1.19; `.gitignore`'da): kaynaklar `docs/source/` (commit'te, asla yazılmaz). Kesit üretimi `cutouts.py --model isnet-general-use --matting --preclean` — matris kararı 2026-09-17 (`docs/screens/cutouts-compare/`, 4 kombinasyon gözle: matting olmadan ok kancaları, preclean olmadan kağıt yamaları kalıyor; ikisi birlikte temiz). Adımlar: kaynak KOPYASINDA ön-temizlik (kağıt ton 288°–11° & açık ∨ katı magenta; beyaz/mavimsi ok/derz → karo rengi) → rembg isnet + alpha matting (fg 240 / bg 15 / erode 8) → en büyük bağlı bileşen → `trim_cold_bottom` → %6 pad, kare 1200 PNG + 600 WebP `public/burgers/<slug>.png`. **`new_session(..., providers=["CPUExecutionProvider"])` zorunlu** (CoreML sağlayıcısı askıda kalıyor). birefnet-general: 973 MB, tek fotoğraf > 240 s → kullanılmaz. Fotoğraflar uzun kenar 1600 jpg+webp `public/images/`. Kontak tablosu `docs/screens/icerik-burgers.png` + `cutouts-before-after.png` ile göz kontrolü zorunlu. Toplu döngüler bash (`compare.sh`); zsh'de tırnaksız `$flags` bölünmez. Kesitler onaylandı (2026-09-17); **orijinal fotoğraflar gelince aynı komutla yeniden üretilir**, script'e dokunulmaz.
42. Logo: `public/logo/logo-manch.svg` / `logo-menu.svg` / `logo-m.svg` basılı menüden potrace izi (`fill="currentColor"`); React'te `ui/logo-manch.tsx`, `ui/logo-menu.tsx`, `ui/logo-m.ts` **otomatik üretilir** (script), elle düzenlenmez; `ui/Logo.tsx` sarmalar. OG/ikonlar bu path'leri Satori `<svg>` ile çizer; OG'deki burger `readFile` → data URI (ağ yok). Orijinal vektör logo gelince yalnızca SVG dosyaları + üretilen component'ler değişir.
43. Performans ölçümü (`scripts/lighthouse.mjs`): Performance + A11y + SEO, **desktop ve mobile**, her sayfa **iki kez** — preloader'sız (`?nopreload=1`) ve preloader'lı. **Her iki varyant prod build'de**: ölçüm build'i `NEXT_PUBLIC_ALLOW_NOPRELOAD=1 NEXT_PUBLIC_SITE_URL=http://localhost:3100 pnpm build` (parametre dev'de her zaman, prod'da sadece bu env ile çalışır; yayın build'inde etkisiz). Dev sunucuda ölçüm YAPILMAZ (minify'sız, TBT 3–5× şişer — ilk baseline bu yüzden çöpe gitti). **Hedef = preloader'sız mobile: Performance ≥ 90, LCP < 2.5 s, CLS < 0.1**; preloader'lı LCP **olduğu gibi** raporlanır (toplama/ekleme yok), hedef değildir (1.8 s zemin bilinçli; LCP elementi çoğu zaman preloader'ın kendisidir). Throttling `simulate`, mobile 412×823 @1.75. Baseline `docs/screens/faz-8-baseline.json`, final `faz-8-final.json`.
44. Client'a giden mesajlar daraltılır: `[locale]/layout.tsx` `NextIntlClientProvider messages={clientMessages(await getMessages())}` → yalnızca `Nav, Cart, Modal, Transition, Preloader, Common, Product`. Sayfaya özel client namespace'leri (Home, Menu, Contact, Lab/Motion/LayoutLab) sayfanın kendi nested `NextIntlClientProvider`'ında `clientMessages(all, ["Home"])` ile (temel + ek, birleşik). Yeni client component yeni namespace kullanıyorsa ilgili sayfaya eklenir; eksikse `MISSING_MESSAGE` konsol hatası verir → lab-check yakalar.
45. Safari/WebKit: Playwright `webkit-2359` kurulu; `BROWSER=webkit node scripts/lab-check.mjs` chromium koşusuna ek olarak çalıştırılır (backdrop-blur, svh/dvh, Lenis wheel, sticky sekme, PNG şeffaflık). Bulgular (2026-09-17): (1) WebKit'te `Tab` yalnızca form kontrollerini dolaşır, linkler **Option+Tab** — skip link testi webkit'te `Alt+Tab`; ürün hatası değil, Safari davranışı. (2) `next/image` `priority` **ve `loading="eager"`** ikisi de `<link rel=preload as=image>` üretir; WebKit preload adayı ile seçilen kaynağı eşleştiremeyince "preloaded but not used" uyarısı veriyor → `priority` yalnızca gerçek LCP adaylarında (hero fotoğrafı, `/menu` **filtresiz** ilk kart — filtreyle sıra değişince preload boşa düşer), diğer fold-üstü görseller varsayılan (lazy) kalır; `eager` kullanılmaz. (3) Next dev araçları catch-all 404 navigasyonunda `performance.measure('CatchAll')` negatif zaman damgası hatası atıyor (dev-only, uygulama kodu değil) → lab-check filtreler. Diğer 94 kontrol (backdrop-blur overlay, svh hero, Lenis wheel scroll, sticky sekme, PNG şeffaflık) chromium ile aynı.
46. GSAP ilk yükleme JS'inde **yoktur**: `@/lib/gsap` (tek `registerPlugin` noktası) yalnızca `useLazyGsap` / `useGsapModule` (`src/lib/hooks/useLazyGsap.ts`) ile effect içinde `import()` edilir; hiçbir component `@/lib/gsap` veya `@gsap/react`'i statik import etmez (grep ile denetlenir). SSR içeriği olan primitive'ler (SplitReveal, Float, Parallax, Marquee, JellyWave, Juggle, SmashAnatomy, ProductGrid) normal render eder, animasyon modül gelince başlar. SSR'a gerek olmayan layout parçaları (CursorTrail, MenuOverlay, PageTransition) `LayoutDeferred` içinde `next/dynamic` `ssr:false`. Preloader GSAP kullanmaz (CSS keyframe + timer). `TransitionLink` `gsapReady` (motion-store) false iken perdesiz normal navigasyon yapar; PageTransition `api.current` yoksa doğrudan `router.push`. **First Load JS hedefi: ana sayfa ≤ 200 kB gzip** (karar 2026-09-17; Next'in kendi metriği de gzip'tir; React+Next çatısı tek başına ~112 kB gz). Ölçüm `scripts/bundle-report.mjs` (gerçek yükleme, `nomodule` polyfill hariç, gz sütunu esas).
47. LCP: `/tr` mobil LCP elementi **hero H1**'dir (fotoğraf değil — `hero-cook.jpg` 750w WebP ≈ 36 KB, `priority` + `fetchPriority="high"` + `quality 70`). H1 **SplitText ile animasyonlanmaz** (statik `<h1>`): split → char span'ları → yeniden boyama LCP adayını animasyon sonuna (3.2 s) kaydırıyordu. Hero hareketi dekoratif elemanlarda (rozet spin, kesit Float). Karar (a) uygulandı (sizes/kalite/AVIF/fetchpriority); (b) (mobilde fotoğrafsız hero) gerekmedi. `next.config` `images.formats: ["image/avif","image/webp"]`, **`images.qualities: [70, 75]`** (kullanılan her `quality` listede olmalı, yoksa 400); `next/image` çıktıları prod'da `curl -H "Accept: image/avif"` ile doğrulanır (hero 640w, kesit 384/750w). Genel kural: LCP adayı olan başlık/görsel ilk boyamadan sonra DOM'u değişen bir animasyona sokulmaz.
48. Deploy duman testi `scripts/smoke.mjs <url>`: sayfalar/sitemap/robots/OG 200, bilinmeyen yol 404, head'de canonical + hreflang + og:image + Restaurant JSON-LD. HTML attribute'larını **case-insensitive** ara (Next 16 `hrefLang` yazar). `canonical` host ölçülen host'tan farklıysa **uyarı** (env eksik), hata değil. Vercel'de `NEXT_PUBLIC_SITE_URL` ayarlanınca yeniden koşulur.
49. CLAUDE.md'yi script ile düzenlerken başlık aramaları **satır başına çapalı regex** olmalı (`re.search(r"^## 📍 DURUM$", s, re.M)`) — düz `str.index("## …")` dosyanın başındaki HATA PROTOKOLÜ maddelerinde geçen **başlık alıntılarını** yakalar. İki sınırla dilim alırken `assert a < b` şart: sınırlar ters dönerse `s[:a] + s[b:]` aradaki metni **ikizler** (sessiz bozulma). Yazımdan sonra `- [x]` / `- [ ]` ve başlık sayıları grep ile doğrulanır (karar 2026-09-18).
50. **Fold kuralı.** Girişte animasyon uygulayan her primitive (SplitReveal, ScrollTrigger.batch, scrub) ilk boyamada **viewport içinde olan öğeye hiç dokunmaz** — gizlemez, ScrollTrigger kurmaz, öğe animasyonsuz görünür başlar. Animasyon yalnızca fold altındaki öğelere kurulur. Ölçüt: `el.getBoundingClientRect().top < window.innerHeight`. Gerekçe: eski sitede batch tetiklenmeyince öğeler `opacity:0`'da kalıyordu (`/tr/menu` açılışında 8 karttan 1'i görünüyordu; Faz 6 hata günlüğü). Kural 47 (LCP adayı animasyona sokulmaz) bunun özel hâlidir. `/lab#d-fold` bunu test eder (karar 2026-09-18). **Ön-gizleme yasağı (2026-09-18, Faz 5):** fold altındaki öğe de `gsap.set(opacity:0)` ile **ön-gizlenmez** — tetikleyici hiç çalışmazsa öğe kalıcı kaybolur (eski hatanın ta kendisi). Animasyon `gsap.from(...)` ile kurulur: öğe görünür durumdan başlar, tetiklenince gizliden görünüre oynar; `ScrollTrigger.batch` `start: "top 92%"` ile göz hizasından önce çalışır, sıçrama görünmez. Doğrulama: `lab-check` **sabotaj testi** — tüm ScrollTrigger'lar öldürülür, grid'e kaydırılır, 6/6 kart hâlâ görünür olmalı. **İstisna (2026-09-18):** talep üzerine mount edilen içerik (MenuOverlay, modal) `SplitReveal trigger="mount"` kullanır — animasyon scroll'a değil mount'a bağlıdır, tetikleyici kaçırma riski yoktur, bu yüzden fold kuralı uygulanmaz.
51. Eğik (`rotate`) tam genişlik bant: bandı **%115 genişlikte** yapıp yatayda taşır, dış kırpma kutusuna **`paddingBlock ≈ |tilt| vw`** verilir. Aksi hâlde `overflow-hidden` döndürülmüş bandı çapraz keser ve bant kama şekline döner (2026-09-18, Marquee).
52. Kırılıma göre **farklı dosya** gösterilecekse iki `<Image>` + CSS gizleme (`md:hidden` / `hidden md:block`) KULLANILMAZ — CSS gizleme isteği durdurmaz, her iki dosya da iner (ölçüm 2026-09-18: mobilde 20+15 KB, masaüstünde 16+32 KB). Doğru kalıp: `<picture>` + `<source media>`; `src`/`srcSet` next/image uç noktasından elle kurulur (`/_next/image?url=…&w=…&q=70`) → AVIF/WebP pazarlığı ve `images.qualities` denetimi korunur, her kırılımda **tek dosya** iner. `fetchPriority="high"` yeterlidir; `priority`nin ürettiği preload zaten WebKit'te uyarı veriyordu (Kural 45).
53. Otomatik testte "konsol temiz" kontrolü **ağ denetimiyle** tamamlanır: kasıtlı 404 sayfası açıldığında tarayıcı `Failed to load resource` konsol hatası üretir; bunu filtrelemek gerçek eksik varlıkları da gizler. Doğru kalıp: `page.on("response")` ile tüm 4xx/5xx istekleri **URL'siyle** topla, kasıtlı olan dışında hiçbiri olmamalı. Ayrıca Next dev'in "detected as the Largest Contentful Paint … add loading=eager" uyarısı dev-only sezgidir, `eager` KULLANILMAZ (Kural 45) — filtre metni birebir eşleşmeli (2026-09-18).
54. **Eksik bilgi iki ayrı kurala tabi — karıştırma (karar 2026-09-18).**
    **A · Görünen arayüz:** eksik alan boş bırakılmaz, `ui/SoonBadge` ile gösterilir (`Common.soon` → "YAKINDA" / "COMING SOON"; küçük, hardal zemin, pixel font). Rozet kasıtlı durur — eksik veri gibi değil, tasarımın parçası gibi. Kullanıldığı yerler: çalışma saatleri, fiyatı olmayan ürün, devre dışı kanallar.
    **B · Yapılandırılmış veri (JSON-LD):** bilinmeyen alan **tamamen çıkarılır**. "Yakında", boş string, tahmin **YASAK** — Google yapılandırılmış veriyi kelime kelime okur, uydurma değer işletme kartını bozar ve düzeltmesi aylar alır. `restaurantJsonLd` yalnızca bilinen alanı yazar; `openingHours*` ve `priceRange` **hiç yazılmaz**. Telefon yapılandırılmış veride boşluksuz E.164 (`+905054970748`), arayüzde okunur biçim. `lab-check` bunu üç ayrı kontrolle denetler.
55-A. **Zone 5.5.8'de ana sayfaya bağlanınca `Zone` namespace'i o sayfanın sağlayıcısına
    eklenmeli.** `drei/<Html>` içeriği (şu an `FramePrompt`, sonra `FrameBoard`/`OrderBoard`)
    normal DOM'dur ve `useTranslations` kullanır; next-intl context'i `<Canvas>` sınırını
    geçiyor (doğrulandı — `zone-camera-check` prompt metnini i18n'den okuyor), ama namespace
    sayfanın `clientMessages(...)` listesinde yoksa `MISSING_MESSAGE` gelir. `/lab/zone`
    bunu `["Zone", "Lab", "Menu"]` ile veriyor; **ana sayfa da `Zone` + `Menu` vermeli**
    (`OrderBoard` menü feragatnamesini `Menu.disclaimer`'dan okuyor). `Order` namespace'i
    `BASE_CLIENT_NAMESPACES`'te, ayrıca eklemeye gerek yok (2026-09-18).
55. Kural 44 daraltması yeni bir layout client component'i eklendiğinde **sessizce kırılır**: namespace `BASE_CLIENT_NAMESPACES`'te yoksa `MISSING_MESSAGE` konsol hatası gelir (2026-09-18'de `CookieBanner` → `Cookie` ile yaşandı, 56 hata). Layout'a client component eklerken `useTranslations("X")` namespace'i listeye eklenir; `client-messages.ts` içindeki denetim yorumu güncel tutulur.
56. Her lazy `import()` **`.catch()` ile kapatılır**. Hızlı gezinmede uçuştaki chunk isteği iptal olur ve yakalanmamış promise reddine (`ChunkLoadError`) dönüşür — WebKit'te 2026-09-18'de yakalandı. Animasyon/smooth-scroll isteğe bağlı olduğu için sessizce vazgeçilir; sayfa native scroll ile çalışmaya devam eder.
57. `NEXT_PUBLIC_SITE_URL` **zorunlu**: `src/lib/site.ts#siteUrl()` değer yoksa production build'i `throw` ile kırar; development'ta `http://localhost:3000`a düşer ama konsola gürültülü uyarı basar. Sessizce tahmini bir domaine düşmek en kötü hata sınıfı — site yanlış canonical ile yayına çıkar, Google onu indeksler, düzeltmesi haftalar alır. canonical · hreflang · sitemap · robots · Restaurant JSON-LD · OG hepsi bu tek değerden okur (2026-09-18).
58. **Bir repoyu iki Vercel projesine bağlarken `vercel.json` ORTAKTIR.** `git.deploymentEnabled` gibi bir ayar her iki projeyi birden etkiler — yeni projeyi korumak için eklenen kısıt eski projenin auto-deploy'unu kırar. Proje bazlı ayar (production branch, ignored build step) yalnızca pano/proje ayarlarından yapılır; `PATCH /v9/projects/:id` bu alanları kabul etmiyor (denendi 2026-09-18).
59. **Gözle bakma zorunlu.** Otomatik kontroller (lab-check, Lighthouse, smoke) yapıyı, durum kodlarını, erişilebilirlik ağacını ve metrikleri doğrular; **görselin içeriğini doğrulamaz**. Fotoğrafın üstündeki silinmemiş yazı, yanlış kadraj, bozuk kesit — hiçbiri teste takılmaz. Her faz sonunda **canlı/preview sayfalara gözle bakılır** (en az mobil + masaüstü hero ve değişen bölümler); ekran görüntüsü `docs/screens/` altına konur (2026-09-18).
60. **Testin kendisini test et.** Bir kontrol yazdıktan sonra onu **kasıtlı olarak bozup yakaladığını doğrula**;
    yakalamıyorsa o kontrol olmamasından kötüdür — yeşil rapor verir, koruduğunu sandığın şey korunmaz.
    Bu oturumda üç kez yaşandı (2026-09-18): ① deploy bekleme döngüsü başarısız deploy'u başarılıdan
    ayırt edemiyordu · ② three.js sızıntı kontrolü ilk sabotajı yakalamadı (yanlış yere konmuştu) ·
    ③ Zone sızıntı testi sayfa navigasyonuyla ölçtüğü için sayaçları sıfırlıyor, sızıntı olsa da geçiyordu.
    Kural 59 (gözle bak) bunun görsel tarafı; bu madde otomatik tarafı.
    **Oynak kontrol de güvenilmez kontroldür** (2026-09-18, 5.5.3/5.5.4): aynı kod bir koşuda
    geçip ötekinde kalıyorsa hata üründe değil, ölçümdedir — ve düzeltilene kadar hiçbir
    yeşil rapor bir şey kanıtlamaz. Üç kaynak yaşandı: ① **kare içindeki tepe değeri**
    `page.evaluate` ile örneklemek (gidiş-dönüş 70–90 ms, tepe 0.3 sn sürüyor → 74° yerine 67°
    okunuyordu) → değeri **döngünün kendisi biriktirir**, test sıfırlayıp okur.
    ② **"örnek sayısı × adım" ile süre hesaplamak** (evaluate gecikmesi sayılmıyor, 1.4 sn
    dönüş 585 ms görünüyordu) → gerçek zaman damgası. ③ **Testin yön/başlangıç varsayması**
    ("aşağı+sağ negatif yönde döner") → yön, ölçülen açıdan türetilir; ya da varsayım yerine
    **kuralın kendisi** her örnekte denetlenir. Düzeltme sonrası **üç ardışık temiz koşu** şart.

    **"Ölçtüğün şey ürün mü, ölçüm aracı mı?" (2026-09-18, 5.5.6).** Oynak kontrollerin en sinsi
    sınıfı: test doğru çalışıyor ama **yanlış özneyi** ölçüyor. İki yüzü yaşandı —
    ① **Duvar saati / simülasyon saati karışması.** Sahne ağırlaştıkça kare hızı düşüyor; `dt`
    50 ms'te kırpıldığı için dünya gerçek zamandan yavaş ilerliyor. Spec'teki "180° dönüş
    ~1.2 sn" **simülasyon** saniyesi, test ise **duvar saati** ölçüyordu → aynı kod 1.4 sn
    yerine 3.0 sn "sürdü" ve kontrol kırmızı yandı. Ürün değişmemişti, ortam değişmişti.
    Çözüm: süre `debug.simTime` ile kare döngüsünde birikir; tutuşlar süreye değil **koşula**
    bağlanır (`holdUntil`).
    ② **Sürücünün yan etkisi ürünün davranışı sanıldı.** Playwright `locator.click()` elemanı
    görünür kılmak için **sayfayı kendisi kaydırıyor**; "pano açılınca sayfa kaymıyor"
    kontrolü bir koşuda `scrollY 607` gördü. Gerçek kullanıcı tıklaması sayfayı kaydırmaz —
    ölçülen şey üründe olmayan bir davranıştı. Çözüm: kontrol ürünün gerçek yolundan
    (klavye) açar.
    **Kural:** bir kontrol kırmızı yandığında önce "bu değer neyin fonksiyonu?" diye sor.
    Cevapta **ortam** (kare hızı, sunucu yükü) ya da **sürücü** (otomasyon aracının kendi
    davranışı) varsa, ölçüm yanlış öznededir; ürünü düzeltmeden önce ölçümü düzelt.
61. **İstemci bundle'ına yalnızca client component'ten sızılır.** Ağır bir kütüphaneyi (three, vb.) bir
    **Server Component**'te statik import etmek onu istemci paketine SOKMAZ — server bundle'da kalır.
    Sızıntı kontrolü bu yüzden client component üzerinden test edilir; server component'te test edilirse
    "temiz" der ve hiçbir şey kanıtlamaz (2026-09-18).
61-A. **Sızıntı, ağır kütüphaneyi DOĞRUDAN kullanmayan bir bileşenin bağımlılık zincirinden de
    gelir (2026-09-18, 5.5.9).** `ZoneGate` sahneyi `next/dynamic` ile yüklüyordu — doğru. Ama
    `CharacterSelect`'i **statik** import ediyordu; o `drawCapy`'yi `character.ts`'ten alıyordu;
    `character.ts` ise `three` import ediyordu. Sonuç: `/tr` ilk yüklemesi 215.5 → **318.8 kB gz**.
    Sahne değil, **seçim ekranı** sızdırdı. Ders: "ağır olan şey dynamic import'ta mı?" yetmez;
    **statik import edilen her modülün zincirini** izle. Çözüm kalıbı: ağır bağımlılığı olmayan
    saf kısmı ayrı modüle çıkar (`lib/zone/capy.ts` — three'siz çizim), ağır modül ondan tüketip
    yeniden yaysın. Bekçi: `zone-bundle-check`.

62. **Mount/unmount ölçümü navigasyonla yapılmaz.** Tam sayfa yüklemesi modül seviyesi sayaçları sıfırlar.
    Aç-kapa-aç testi aynı sayfada bir aç/kapa düğmesiyle kurulur — zaten ürünün gerçek davranışı da budur
    (Zone ana sayfada açılıp kapanıyor, navigasyonla değil). `scripts/zone-leak-check.mjs` (2026-09-18).
63. **R3F/Three notları:** ① `useMemo` bağımlılığı **dizi literali** olmalı (React Compiler) → `useTexture(make, deps)`
    gibi jenerik doku hook'u yazılamaz, her çağrı yerinde açık `useMemo([...])` kullanılır. ② Aşağı bakan yüzey
    (tavan) `meshStandardMaterial` ile yalnızca ambient alır ve **gri** görünür; düz marka rengi isteniyorsa
    `meshBasicMaterial`. ③ R3F, JSX ile tanımlanan geometry/material'ı unmount'ta bırakır; **elle üretilen
    dokuları bırakmaz** — sahneyi dolaşan bir disposer şart. ④ `/lab` sayfalarında sahne üstü test düğmeleri
    nav'ın (z-80) altında kalırsa tıklama engellenir; z-90 ve nav'dan uzak köşe (2026-09-18).
    ⑤ **Karakter/sprite düzlemi her karede kameraya döndürülür (billboard).** `PlaneGeometry`'nin normali
    +z, `MeshBasicMaterial` varsayılanı `FrontSide`: kamera düzlemin öbür yanına geçtiği anda arka yüz
    kırpılır ve sprite **kaybolur**. Yön takipli kamerada bu her 180° dönüşte oluyor. Yalnız Y ekseninde
    döndürülür (karakter dik kalır); Euler sırası XYZ olduğu için `rotation.z` (lean) önce yerel düzlemde
    uygulanır, billboard açısı sonra gelir. Prototipte bu adım yazılmamıştı — `rotation.y` hep 0 (2026-09-18).
    ⑥ **Kare-başına durum prop / `useState` / `useRef` içinde TUTULMAZ.** React Compiler kuralları bunların
    mutasyonunu yasaklıyor (Kural 25) ve `useFrame` saniyede 60 kez yazıyor. Doğru yer: ayrı bir modülde
    tek bir nesne + onu değiştiren plain fonksiyonlar (`lib/zone/runtime.ts`); bileşen yalnızca çağırır,
    React hiç render etmez. Sahne tekil olduğu için modül seviyesi doğru modeldir; sahne kurulurken
    `resetRuntime()` alanları **yerinde** sıfırlar (nesne kimliği korunur, bayat referans kalmaz).

64. **Tempo — derinlemesine doğrulama ucuz değil (karar 2026-09-18, kullanıcı).**
    Haftalık kota sınırlı. **Bir davranış doğru çalışıyorsa daha derin ölçme.** Varsayılan akış:
    otomatik kontroller yeşil + gözle bakınca doğru görünüyor → **geç**. Piksel farkı, çoklu
    örnekleme, A/B ekran karşılaştırması gibi ağır doğrulamalar yalnızca **bir kontrol
    DÜŞTÜĞÜNDE** açılır; hata ayıklama aracıdır, rutin değil.
    Gerekçe: ayak izi adımında (5.5.4) 28 dakika ve 18 bin token harcandı — iş kaliteliydi ama
    **süs bir özellik** için ağırdı. Maliyet, özelliğin ağırlığıyla orantılı olmalı.
    Kural 59 ve 60 geçerliliğini korur: gözle bakmak ve testi sabote etmek ucuzdur, bırakılmaz.
    Bırakılan şey, zaten geçmiş bir şeyi ikinci/üçüncü yöntemle tekrar kanıtlamaktır.

65. **`pnpm dev` açıkken build almak çıktıyı bozar** — ikisi de varsayılan olarak `.next`
    klasörünü kullanır. Ölçüm build'leri ayrı klasöre alınır:
    `NEXT_DIST_DIR=.next-build pnpm build` (+ `pnpm start` aynı env ile). `next.config.ts`
    `distDir`'i bu değişkenden okur; `.next-build/` `.gitignore`'da.
    **Ayrıca: ölçümden önce portun boş olduğunu doğrula.** `pkill -f "next start"` her zaman
    işe yaramıyor; arkada kalan eski sunucu **eski build'i servis etmeye devam ediyor** ve
    ölçüm sessizce yanlış çıkıyor. 2026-09-18'de bu yaşandı: `/tr` ilk yüklemesi 215 yerine
    **141 kB** ölçüldü ve %34'lük sahte bir "iyileşme" gibi göründü; gerçekte zombi sunucu
    bozuk bir build'i servis ediyordu (chunk'lar 500 dönüyordu). Doğru kalıp:
    `lsof -ti tcp:<port> | xargs kill -9` → portun boşluğunu doğrula → sunucuyu başlat →
    `Ready` satırını gör → ölç. **Beklenmedik İYİLEŞME de beklenmedik kötüleşme kadar
    şüphelidir** — açıklanamayan bir kazanç, çoğu zaman ölçümün kendisinin bozulduğunu söyler.

66. **Sipariş gönderme tek bir adaptörün arkasında: `lib/order/submit.ts` (karar 2026-09-18,
    kullanıcı).** Dışa açık tek fonksiyon `submitOrder(lines, locale, t)`; yanında
    `orderChannel()` (kanal uygun mu + **düğmenin metin anahtarı**) ve `orderTotal()`.
    Bugünkü gerçeklemesi WhatsApp bağlantısıdır.
    **Hiçbir tüketici kanalı bilmez** — ne `OrderBoard` ne site sepeti. Düğme metni bile
    bileşene gömülmez, adaptörden `channel.labelKey` ile gelir ("WHATSAPP'TAN GÖNDER" yarın
    "SİPARİŞİ GÖNDER" olacak). Mesajın biçimi ve kullandığı i18n anahtarları da adaptörde.
    **İki ayrı gönderme yolu bırakılmaz.**
    Gerekçe: işletme sahibiyle gerçek bir sipariş sistemi (veritabanı + panel + kurye
    bildirimi) konuşuluyor. O geldiğinde **değişmesi gereken tek dosya bu adaptör olmalı**;
    tahta ve sepet dokunulmadan kalmalı. Doğrulandı: adaptör boş bir gerçeklemeyle
    değiştirildiğinde ikisi de derleniyor ve `wa.me` yalnızca adaptörde geçiyor.
    (`ContactClient`'taki WhatsApp bağlantısı **iletişim** kanalıdır, sipariş değil — kapsam dışı.)

67. **Global stil/DOM durumu tek modülden, SAYAÇLA yönetilir (karar 2026-09-18).**
    `html.style.overflow`, `body.style.position`, `document.title` gibi **paylaşılan** durumu
    "eski değeri kaydet → geri yükle" kalıbıyla yöneten birden fazla yer varsa, üst üste
    bindiklerinde birbirlerini ezerler ve sıra bozulur.
    Yaşanan (5.5.9): Preloader ve `useDialog` ikisi de `html.style.overflow`'u kaydet/geri-yükle
    ile yönetiyordu. Ölçülen sıra: preloader kilitli → Zone perdesi açılıp önceki değeri
    **"hidden"** olarak saklıyor → preloader bitip `""` yazıyor ve **perdenin kilidini açıyor** →
    perde kapanırken sakladığı "hidden"ı geri yazıyor ve **site kaydırılamaz kalıyor.**
    Doğru kalıp: `lib/scroll-lock.ts` — kilit **ilk** `lock()`'ta konur, **son** `unlock()`'ta
    kalkar; arada kim gelirse gelsin sıra bozulamaz. Yeni bir kilitleyici eklenirken kendi
    kaydet/geri-yükle mantığını YAZMAZ, sayacı kullanır. Kontroller derinliği
    `__SCROLL_LOCK__()` ile okur (inline stili okumak iki kilitleyici arasında yanıltıcıdır).

---

## 1. PROJE ÖZETİ

Fethiye'deki smash burger markası **MANCH** için animasyon ağırlıklı, iki dilli (TR varsayılan / EN) web sitesi. Hareket dili ve etkileşim kalitesi referans **cravburgers.shop** (Anyflow Agency) seviyesinde olacak, görsel kimlik tamamen MANCH'e ait olacak. Referansı kopyalamıyoruz, aynı hissi yakalıyoruz.

**Stack:** Next.js 16 (App Router, TS, `src/`) *(revize: 2026-09-17 — brief'te 15 yazıyordu, `create-next-app@latest` 16.3.5 kurdu)* · Tailwind CSS v4 · GSAP 3 (ScrollTrigger, SplitText, CustomEase) + `@gsap/react` · Lenis · next/font · next-intl · Zustand · Vercel (GitHub auto-deploy)

---

## 2. MARKA

| Alan | Değer |
|---|---|
| İsim | MANCH |
| Kategori | Smash Burger / Fast Food |
| Slogan | **United Chill Burger Zone** · **Handmade Hits Different** |
| Adres | Çarşı Cd. 21/b, Fethiye 48300 (Paspatur) |
| Instagram | https://www.instagram.com/manch.tr/ |
| Maskotlar | **Misu & Miyu**, "MANCH'in yüzleri" (burger tutan sevimli line-art karakterler) |
| Duvar yazısı | "THE BURGER YOU'LL CRAVE AGAIN" (mavi karo üzerinde bordo) |
| Durum | **Açık — Fethiye Paspatur** (Google kaydı: 150 yorum / 4,5 puan). "EST. 2026" kuruluş yılı rozetidir, açılış vaadi değil |
| Telefon | +90 505 497 07 48 |
| Saatler | Pzt–Per 08:30–23:30 · Cum–Cmt 08:30–00:00 · Paz 08:30–23:30 |
| Sipariş linki | TODO — sağlayıcı belli değil, sipariş WhatsApp'ta |

**Ses:** Kısa, esprili, cool, 😏. Her metin TR + EN.
- Smash sesi mutfaktan, ilk ısırık masadan. / Smash from the kitchen, first bite from the table.
- Aç değiliz. Sadece takıntılıyız. / Not hungry. Just obsessed.
- Hazır soslara biraz uzağız. / We like our sauces handmade.
- Yer çekimi onaylı cheese pull. / Gravity approved cheese pull.
- Lezzet seviyesi biraz kontrolden çıkmış olabilir. / Flavor levels may have gotten a little out of control.
- MANCH alışkanlığı yükleniyor… / MANCH habit: loading…
- Smash'inin katmanlarıyla tanış. Hepsi el yapımı. / Meet the layers of your smash. Handmade in every layer.
- Tiramisu konusunda biraz iddialıyız. / We take tiramisu seriously.
- Tarzına yakışan smash! (Classic Manch Burger)
- Juicy Center · Crispy Edges · Perfect Melt · Just Another Chill Lunch

**Menü** (fiyatlar TODO). Kategoriler: Smash Burgers · Chicken · Sides · Tatlılar · İçecekler
1. **Classic Manch Burger:** double smash, cheddar, turşu, soğan, marul, Manch sos, brioche
2. **Berry Manch:** el yapımı tereyağlı brioche · 120 gr köfte · Roquefort aioli · yaban mersini reçeli · berry sos · kuzu kulağı · 2 cheddar. *"Yoğun, dengeli ve özgün bir lezzet."*
3. **Köz Biberli Smash:** ev yapımı köz biber sosu
4. **Truffle Smash** *(isim teyit)*
5. **Crispy Chicken Tenders:** otlu dip sos
6. **Chicken Sandwich** *(teyit)*
7. **Patates Kızartması**
8. **Tiramisu:** gerçek mascarpone
9. Ev yapımı içecekler / soft drinks *(teyit)*

Ürün modeli: `slug, name, desc{tr,en}, ingredients[], price, tags[], image, quick{time, bun, patty, spice}`

---

## 3. TASARIM SİSTEMİ

**Renkler** (`berry` 2026-09-18'de basılı menüden teyit edildi; kalan 8 token teyit bekliyor — DURUM):
```
berry #6A1F3B · berry-dk #4E1030 · sky #C4E4F3 · tile #8FC3D6
cream #F4EEE6 · paper #E9DCC6 · pink #E9A3B8 · mustard #F6C343 · ink #1B1B1B
```
**Fontlar:** Modak (`font-display`) · Mouse Memoirs (`font-ui`, uppercase, tracking-wide) · **Press Start 2P** (`font-pixel`, tape/aksan — Kural 18). TR karakterleri test et (Kural 21).
**Utility'ler:** `heading180`, `text40`, `text-stroke-small`
**Desenler:** bordo-beyaz dama · pembe dama kağıt · mavi karo duvar · kraft menü kartı · Misu&Miyu line-art tepsi deseni · grain (.06)

**Referans etkileşimleri (cravburgers.shop'tan):**
| # | Bileşen | Detay |
|---|---|---|
| R1 | Preloader | Tam ekran berry zemin, dönen mesajlar: "BRIOCHE KIZARIYOR… / KÖFTE SMASH'LENİYOR… / CHEDDAR ERİYOR…" + progress |
| R2 | PageTransition | 3 SVG perde (berry → pink → mustard), `Q` eğrili path morph alttan yukarı, ortada Modak "MANCHING…", stagger .08, `power4.inOut`, ~1.1s |
| R3 | Dinamik title | Geçişte "Menü \| Smash'leniyor" → "Menü \| Servis" |
| R4 | Nav | fixed, sol Modak logo, sağda dolu hap "BURGERS" + çerçeveli hap "MENU" (3 çizgi → X). `data-nav-dark` ile renk invert, scroll-down'da gizlen |
| R5 | MenuOverlay | `bg-berry/30 backdrop-blur-md`, büyük Modak linkler, SplitText satır maskesi |
| R6 | RollText | overflow-hidden, 2 kopya metin, hover'da biri yukarı biri alttan gelir, 300ms. Buton hover:scale-105 → bg-ink |
| R7 | BlobButton | Organik SVG blob (`viewBox -10 -10 602 475`), beyaz 10px stroke, berry fill, hover'da wobble |
| R8 | CursorTrail | Desktop: beyaz 2px iz path + buzlu cam dairede dönen malzeme ikonu; `data-cursor-hide` |
| R9 | Hero + JellyWave | Tam ekran foto, hardal Modak "HANDMADE HITS DIFFERENT" char reveal, dönen Misu&Miyu rozeti, altta scroll hızına göre `scaleY 1→1.08` esneyen dalga |
| R10 | SectionHeader | küçük Modak üst başlık + büyük berry başlık + "N ÜRÜN" sayacı |
| R11 | ProductCard | 3 kolon, `h-[35vw] rounded-[2vw]`, giriş `y64→0` stagger, ortada 2×12 dama bandı hover'da `cubic-bezier(.4,1.6,.7,.95)` .44s esner, burger döner, "Quick details", hardal + butonu |
| R12 | Cart | "SEPETE EKLENDİ" toast, sağ altta berry sepet + hardal sayaç rozeti, kraft drawer, checkout → WhatsApp mesajı |
| R13 | ZoneBlock | `pt-[18vw]`, dalgalı üst kenar, karo duvar zemin, parallax burger, blob CTA |
| R14 | Marquee | Pixel font bordo bantlar, -4°, zıt yönler, scroll hızıyla hızlanır |
| ~~R15~~ | ~~SmashAnatomy~~ | **İPTAL (karar 2026-09-18)** — gerçek katman fotoğrafı yok; eski sitedeki pinned + `scrollIntoView` hatası da buradan çıkmıştı |
| R15b | BuildSequence | 6 karelik yapım sırası (`/images/process/01-06`). **Dikey akış, pin YOK** — ScrollTrigger `scrub` ile çapraz geçiş (opacity + hafif scale); yanında adım numarası 01-06 + iki dilli adım metni. Kural 50 geçerli: fold üstündeki ilk kare animasyonsuz görünür. Başlık: "Smash'inin katmanlarıyla tanış." |
| R16 | CookieBanner | alt orta kart, LATER / OKAY! |
| R17 | InfoModal | iletişim/rezervasyon, "ANLADIM & KAPAT" |
| R18 | Footer | Modak linkler + line-mask + RollText, dev MANCH wordmark, zıplayan (juggle) malzeme ikonları, "Designed & developed by Webber Digital" |
| R19 | SmoothScroll | Lenis + GSAP ticker, reduced-motion desteği |

---

## 4. FAZLAR

### Faz 1 — Kurulum & Altyapı
- [x] Proje klasörü içinde (`~/Projects/manch`, içinde sadece `docs/` var): `pnpm create next-app@latest . --ts --tailwind --app --src-dir --eslint --import-alias "@/*" --use-pnpm` *(revize: 2026-09-17 — `--no-turbopack --skip-install` eklendi; scaffold Next 16.3.5 kuruyor; `--no-turbopack` sadece script'e bayrak eklemiyor, Next 16'da build zaten Turbopack)*
- [x] `docs/CLAUDE.md` dosyasını köke taşı; scaffold'un ürettiği `CLAUDE.md` (`@AGENTS.md`) önce silinir, `AGENTS.md` yerinde bırakılır. **Scaffold boş olmayan klasöre kurulmaz** — kökteki `CLAUDE.md` scaffold öncesi `docs/` içine alınır, sonra köke geri taşınır *(revize: 2026-09-17, 2026-09-18)*
- [x] Bağımlılıklar: `gsap @gsap/react lenis next-intl zustand clsx`
- [x] Klasörler: `src/{app/[locale],components/{layout,sections,motion,ui},data,lib,messages,styles,i18n}`, `public/{images,burgers,icons}` *(revize: 2026-09-17 — `src/i18n/` eklendi: next-intl `routing.ts` / `navigation.ts` / `request.ts`)*
- [x] next-intl: `tr` (varsayılan) + `en`, **`src/proxy.ts`** (Next 16'da `middleware.ts` deprecated), `[locale]` layout *(revize: 2026-09-17)*
- [x] `src/lib/site.ts`, `src/data/menu.ts` (bölüm 2), `messages/tr.json` + `en.json` iskeleti
- [x] Git init, `.gitignore`, ilk commit
- [x] ✅ Kabul: `pnpm build` temiz, `/tr` ve `/en` açılıyor

### Faz 2 — Tasarım Sistemi
- [x] Tailwind v4 `@theme`: renk tokenları, font değişkenleri (`src/styles/globals.css`, JS aynası `src/styles/tokens.ts`)
- [x] next/font: Modak, Mouse Memoirs, **Press Start 2P** (`font-pixel`, 12/12 TR ✓) — Silkscreen ğşıĞŞİ içermediği için `font-pixel-alt` olarak sadece `/lab`'da, `preload: false` (Kural 18) *(revize: 2026-09-17, 2026-09-18)*
- [x] Utility'ler: `heading180`, `text40`, `text-stroke-small`, grain overlay
- [x] Desen component'leri: `CheckerBand`, `TileWall`, `KraftCard`, `Placeholder` (`src/components/ui/`) + `GlyphCheck` (client, canvas TR glyph testi) *(revize: 2026-09-17)*
- [x] `/[locale]/lab` sayfası: tüm token/font/desen önizlemesi, TR karakter testi; production'da 404 (Kural 23), ekran görüntüsü `docs/screens/faz-2-lab.png`
- [x] ✅ Kabul: `pnpm build` + `pnpm lint` temiz; `/tr/lab` + `/en/lab` dev'de 200, **prod'da 404** (Kural 23 doğrulandı); TR kapsamı **iki bağımsız yöntemle** ✓ — fontTools cmap union (Modak 442 glyph, Mouse Memoirs 354, Press Start 2P 616; üçü de 12/12) **ve** `/lab` GlyphCheck canvas ölçümü (üçü de 12/12); konsol 0 hata; 1440 ve 375'te yatay taşma yok. `docs/screens/faz-2-lab.png`, `faz-2-lab-mobile.png` *(revize: 2026-09-18)*

### Faz 3 — Motion Primitive'leri
- [x] R19 SmoothScroll provider (`lenis/react` + GSAP ticker, Kural 24; `[locale]/layout.tsx`'te)
- [x] R6 RollText · R7 BlobButton · R14 Marquee (scroll hızıyla `timeScale`) · SplitReveal (chars / lines `mask`, `autoSplit`) — `src/components/motion/`
- [x] R9 JellyWave (Lenis `velocity` → `quickTo scaleY`) · R8 CursorTrail (hover+fine pointer, `data-cursor-hide`) · R18 Juggle (`--juggle-scale`)
- [x] Hepsi `/lab` "Motion" bölümünde demo; `useReducedMotion` hook + Zustand override ile emülasyon toggle'ı; `ScrollTrigger.getAll().length` göstergesi *(revize: 2026-09-17)*
- [x] ✅ Kabul: `scripts/lab-check.mjs` **16/16 ✓, konsol 0 hata/uyarı** — Lenis root sınıfı + GSAP ticker ilerliyor · Kural 50 fold testi (fold üstünde split kurulmuyor, öğe opacity 1; fold altında kuruluyor ve geliyor) · CursorTrail masaüstünde render + `data-cursor-hide` üstünde opacity 0 · reduced-motion AÇIK→KAPALI gidiş-dönüş (CursorTrail null, RollText tek kopya) · **sızıntı yok: lab↔ana sayfa 6 gezinmede ScrollTrigger [3,3,3,3,3,3]** · 11 demo bloğu. `docs/screens/faz-3-lab.png`, `faz-3-lab-mobile.png`, `faz-3-motion.webm` *(revize: 2026-09-18)*

### Faz 4 — Global Layout
- [x] R1 Preloader (`src/components/layout/Preloader.tsx`: ilk render "yükleniyor", sessionStorage effect'te, 3 mesaj + progress, Lenis + overflow kilidi)
- [x] R2 PageTransition + R3 dinamik title (`PageTransition.tsx` + `motion/TransitionLink.tsx` + `lib/transition-store.ts` + `lib/transition-title.ts`; Kural 29) *(revize: 2026-09-17 — View Transitions API yerine TransitionLink)*
- [x] R4 Nav (Lenis direction, IO `[data-nav-dark]`, `text-stroke-fill` logo) + R5 MenuOverlay (SplitReveal lines, `useDialog`: ESC / focus trap / scroll kilidi)
- [x] R12 Cart (`lib/cart-store.ts` persist localStorage, toast, kraft drawer, `wa.me` checkout; numara null → disabled + "yakında")
- [x] R16 CookieBanner (localStorage OKAY / sessionStorage LATER) · R17 InfoModal (KraftCard, `useDialog`)
- [x] R18 Footer (SplitReveal + RollText linkler, dev wordmark, Juggle, tape, telif, kredi; `data-nav-dark`)
- [x] CursorTrail layout'a taşındı; `/lab` "Layout" bölümü (perde tetikle, perde ile ana sayfa, sepete ekle, sepeti aç, InfoModal, preloader sıfırla) *(revize: 2026-09-17)*
- [x] ✅ Kabul: `scripts/lab-check.mjs` **38/38 ✓, konsol 0 hata/uyarı** — preloader ilk ziyarette çıkar / süre sonunda kalkar / **ikinci ziyarette çıkmaz** (sessionStorage `manch-preloaded=1`) · nav gizlen/göster · overlay aç + scroll kilidi + ESC · **sepet akışı uçtan uca** (ekle → toast → rozet 3 → drawer 2 satır → toplam 1500 TL → `wa.me/905054970748` mesajı ürün+adet+tutar içeriyor → yeniden yüklemede persist) · cookie · InfoModal ESC · footer · perde kapan/aç + R3 title · 1440 ve 375'te yatay taşma yok. `docs/screens/faz-4-{desktop,mobile,overlay-mobile,cart-mobile}.png`, `faz-4-transition.webm` *(revize: 2026-09-18)*

### Faz 5 — Ana Sayfa
- [x] ~~R15 pinned izole test~~ — **gerekmiyor**: R15b pin kullanmıyor (karar 2026-09-18). Kural 32 ileride pin gerekirse geçerli kalır
- [x] Hero (R9) — `sections/Hero.tsx`: SplitReveal chars, dönen rozet (SVG textPath, CSS spin), JellyWave, tam ekran Placeholder, `data-nav-dark`
- [x] Marquee (R14) — `sections/MarqueeBand.tsx` (2 bant, EN)
- [x] The Hits: 6 imza ürün (R10 + R11) — `ui/SectionHeader.tsx`, `sections/TheHits.tsx` `#hits`, `ProductGrid.tsx` (tek `ScrollTrigger.batch`), `ProductCard.tsx` (2×12 dama hover jelly, quick details, + → cart); `menu.ts` `featured`
- [x] **BuildSequence (R15b)** — `sections/BuildSequence.tsx`: 6 kare yapım sırası, dikey akış, **pin yok**, ScrollTrigger scrub çapraz geçiş, adım no + TR/EN metin *(revize: 2026-09-18 — R15 pinned anatomi iptal)*
- [x] Handmade hikayesi — `sections/Handmade.tsx` (SplitReveal + KraftCard)
- [x] United Chill Burger Zone (R13) — `sections/Zone.tsx` `#zone`: dalgalı üst kenar, TileWall, duvar yazısı, `OrderCta` (blob → sepet), `motion/Parallax.tsx`
- [x] Misu & Miyu — `sections/MisuMiyu.tsx` + `motion/Float.tsx` (idle)
- [x] Instagram grid — `sections/InstagramGrid.tsx`: **6 gerçek 1:1 fotoğraf** (`/images/social/01-06`) + @manch.tr CTA. Şeffaf kesit veya metin kartı **karıştırılmaz** (eski sitedeki hata) *(revize: 2026-09-18)*
- [x] Konum — `sections/Location.tsx` `#location`: adres, saatler "Yakında", yol tarifi, tıkla-yükle Google Maps iframe (lazy), `data-nav-dark`
- [x] ✅ Kabul: `scripts/lab-check.mjs` **58/58 ✓, konsol 0 hata/uyarı** — 8 bölüm, anchor'lar (`#hits #build #zone #location`), kırık görsel 0, yatay taşma yok (1440 + 375) · **Kural 50: ProductGrid ilk boyamada 6/6 kart görünür** + **SABOTAJ testi** (tüm ScrollTrigger'lar öldürülüp grid'e kaydırılınca da 6/6) · R15b 6 kare, ilk kare animasyonsuz görünür, **pin-spacer 0** · Instagram 6 gerçek 1:1 foto, kesit/PNG yok · kart + → sepet · quick details · harita tıkla-yükle · reduced-motion'da R15b dikey liste (6 figure) + kartlar 6/6. **LCP (prod build, throttled): mobil 792 ms · masaüstü 212 ms**, ikisinde de LCP elementi statik H1 (Kural 47); CLS ≤ 0.0004. `docs/screens/faz-5-desktop-full.png`, `faz-5-mobile-full.png`, `faz-5-scroll.webm` *(revize: 2026-09-18)*

### Faz 6 — İç Sayfalar
- [x] Dokümanlar okundu → Kural 34 (`useSearchParams` + Suspense) ve Kural 35 (`[locale]/not-found` + `[...rest]` catch-all) *(revize: 2026-09-17)*
- [x] `/menu` (`app/[locale]/menu/`): sticky sekme bandı (`navHidden` store → top geçişli), spicy/new/signature filtre (client, `ScrollTrigger.refresh`), kategori blokları `ProductGrid`, `ProductModal` (useDialog + KraftCard malzeme + quick details + sepet), `?p=slug` URL tek kaynak (derin link)
- [x] `/about`: hikaye (genişletilmiş), Misu & Miyu (Float), zone galerisi ×4, "Est. 2026" timeline
- [x] `/contact`: kraft kart adres/telefon/saat/e-posta, WhatsApp (null → disabled + Yakında), Rezervasyon → InfoModal, yol tarifi, Instagram/Facebook, tıkla-yükle harita
- [x] `[locale]/not-found.tsx` + `[locale]/[...rest]/page.tsx`: Misu & Miyu + "Bu sayfa smash'lenmiş" + TransitionLink; prod'da status 404 (tarayıcıda doğrulandı)
- [x] Nav BURGERS → `/menu`; her sayfada `generateMetadata` (messages `*.metaTitle/metaDescription`)
- [x] ✅ Kabul: `scripts/lab-check.mjs` **78/78 ✓, konsol 0 hata/uyarı** — 6 rota (3 sayfa × 2 dil) 200, her sayfada tek h1 · `/menu` filtresiz **25 kart, ilk boyamada 25/25 görünür** + **SABOTAJ testi** (ScrollTrigger'lar öldürülüp kaydırılınca da 25/25) · filtreler spicy 1 / new 1 / signature 4, kapatınca 25 · modal aç + `?p=` URL + ESC + URL temizleme + derin link · `Menu.disclaimer` iki yerde · 404 status 404 + bizim UI + nav · **Nav/Footer/Overlay'deki tüm iç linkler 200** · kasıtlı 404 dışında 4xx/5xx istek yok (Kural 53). **LCP (prod, throttled, 3 koşu medyanı):** `/menu` mobil **2348 ms** / masaüstü 488 · `/about` mobil **1092 ms** / masaüstü 252 · `/contact` mobil **752 ms** / masaüstü 224; CLS ≤ 0.007. `docs/screens/faz-6-{menu,about,contact,404,menu-modal-mobile}.png` *(revize: 2026-09-18)*

### Faz 7 — İçerik, SEO & Erişilebilirlik
- [x] Dokümanlar → Kural 38 (sitemap/robots/manifest kök `app/`, `alternates.languages`, title şablonu), Kural 39 (`next/og` Node runtime + Modak TTF `src/assets/fonts`, `generateImageMetadata` ikonlar) *(revize: 2026-09-17)*
- [x] Metin geçişi: tr/en 209 anahtar simetrik; US yazım (Favorites, gravity-approved), kısa sayfa başlıkları, placeholder metinler `[TODO]` önekli (Common.todo, hoursSoon, priceTodo, checkoutSoon, Modal.reservation, görsel alt'ları), marka sesi cümleleri brief ile eşleşiyor
- [x] SEO: `src/lib/seo.ts#pageMetadata` (canonical + hreflang tr/en/x-default + OG/Twitter, `%s | MANCH`), `[locale]/opengraph-image.tsx` (1200×630, berry + Modak), `Restaurant` JSON-LD (telefon/saat null → yazılmaz), `app/sitemap.ts` (8 URL + hreflang), `app/robots.ts` (lab disallow), proxy matcher metadata rotalarını hariç tutar
- [x] Favicon/app icon: `app/icon.tsx` (`/icon/32`, `/icon/512`), `app/apple-icon.tsx` (180), `app/manifest.ts` — logo gelince değişir (TODO)
- [x] Erişilebilirlik: global `:focus-visible` hardal halka, skip link `#main`, metinlerde opaklık kaldırıldı (tüm çiftler ≥ 4.5:1, Kural 40), erişilebilir ad düzeltmeleri (logo, harita butonu, ProductModal kapalıyken), dekoratif wordmark SVG; reduced-motion'da preloader atlanır (Faz 4'ten)
- [x] Malzeme ikonları `public/icons/{lettuce,tomato,cheddar,patty,pickle,brioche}.svg` (24×24, 1.5px, currentColor) + `ui/IngredientIcon` (CSS mask) — CursorTrail, Footer/MotionLab Juggle
- [x] `/menu` aktif sekme (IntersectionObserver, nav yüksekliğine göre rootMargin, `aria-current`)
- [x] `scripts/lighthouse.mjs` (playwright-core Chromium CDP + lighthouse 13) → `docs/screens/faz-7-lighthouse.json`
- [x] ✅ Kabul: Lighthouse (mobil, prod build) **A11y 100 / SEO 100** — `/tr`, `/tr/menu`, `/tr/contact`, ayrıca `/tr/about` ve `/en` de 100/100 · düşen denetim yok. `scripts/lab-check.mjs` **90/90 ✓, konsol 0** — 9 metadata rotası 200 · üç sayfada canonical + hreflang(tr/en/x-default) + og:image + twitter · **JSON-LD 11 bilinen alan, `openingHours`/`priceRange` YOK, boş string yok, telefon E.164** (Kural 54-B) · 'Yakında' rozeti 4 sayfada 7 yerde (Kural 54-A) · focus ring 14/14 · RollText aria-hidden 12/12 · footer wordmark dekoratif. `docs/screens/faz-7-og.png`, `faz-7-icons.png`, `faz-7-lighthouse.json` *(revize: 2026-09-18)*

### İçerik commit'i (Faz 7.5) — `docs/prompts/icerik-commit.md`
- [ ] Kaynaklar `docs/source/` (11 ekran görüntüsü, 749–1222 px; commit'te), `docs/_in/` silindi
- [ ] `public/burgers/*.png|webp` ×7 (rembg isnet + kaynak ön-temizlik + soğuk alt kesim, Kural 41), `public/images/{hero-cook,crispy-triangle,tiramisu}.{jpg,webp}`, `misu-miyu.png`; kontak `docs/screens/icerik-burgers.png`
- [ ] Logo: `public/logo/logo-manch|menu|m.svg` (potrace) + üretilen `ui/logo-*.tsx` (Kural 42); Nav, Footer, Preloader, PageTransition, OG, ikonlar, `/menu` başlığı
- [ ] `src/data/menu.ts` basılı menüden: 6 kategori, 25 ürün, fiyatlar; eski tahmini ürünler silindi; `featured` 6
- [ ] `site.ts`: telefon, WhatsApp, e-posta, Facebook, menü alt başlığı; JSON-LD telephone/email/sameAs; messages'ta `[TODO]` kalmadı
- [ ] Sepet: satır + genel toplam, WhatsApp mesajında tutar, checkout aktif; Contact/Location tel:/mailto: linkleri
- [ ] Görseller `next/image` (hero cook + classic kesit, Instagram 6, kartlar/modal, kategori kapakları, maskot)
- [ ] ✅ Kabul: build + lint temiz; lab-check 96/96, console 0; Lighthouse A11y 100 / SEO 100 ×3; `[TODO]` grep boş; `docs/screens/icerik-{burgers,home,menu,og}.png`

### Faz 8 — Performans & QA
- [x] Ölçüm stratejisi Kural 43 (`scripts/lighthouse.mjs`: perf/a11y/seo × mobile/desktop × preloader'lı/sız, prod build, `?nopreload=1` yalnızca `NEXT_PUBLIC_ALLOW_NOPRELOAD=1` ile); baseline `docs/screens/faz-8-baseline.json` *(revize: 2026-09-17)*
- [x] Bundle: `scripts/bundle-report.mjs` (sunucu HTML script'leri, gz, noModule hariç), `@next/bundle-analyzer` (ANALYZE=1); GSAP lazy (Kural 46: `useLazyGsap`, `LayoutDeferred` ssr:false, Preloader CSS) → `/tr` First Load **249.7 → 187.5 kB gz** (≤ 200), lazy gsap 48.9 gz sonradan
- [x] NextIntlClientProvider daraltma (Kural 44: layout 7 namespace + sayfa sağlayıcıları)
- [x] next/image: AVIF+WebP (`images.formats`), `images.qualities [70,75]`, hero `priority`+`fetchPriority`+`quality 70`, kartlarda ilk kart `priority` / 2–3 `eager`, `sizes` denetimi; AVIF çıktıları doğrulandı (hero 640w 16.5 KB, kesit 384w 9.9 KB)
- [x] LCP: Kural 47 — `/tr` mobil LCP elementi hero H1, SplitText'ten çıkarıldı; 3122 → **1672 ms**
- [x] CLS: 0 (desktop `/tr/menu` footer 0.006 — karar: kalır)
- [x] Safari/WebKit: Playwright `webkit-2359`, `BROWSER=webkit lab-check` (Kural 45: Option+Tab, `priority` preload uyarısı → `eager`)
- [x] Görsel kontrol 375/768/1440/1920 (`scripts/screens.mjs`, `docs/screens/faz-8-{w}[-menu].png`): yatay taşma yok
- [x] Final `docs/screens/faz-8-final.json` + `faz-8-table.md` (baseline → final)
- [x] ⚠️ Kabul (kısmi): preloader'sız mobile **perf 98 / 91 / 95** (`/tr`, `/tr/menu`, `/tr/contact`) — **perf ≥ 90 üçünde de sağlandı**; CLS 0–0.001 ✓; A11y/SEO 100 ✓. **LCP hedefi (< 2500 ms) yalnızca `/tr`'de tuttu: 4691 → 2310 ms.** `/tr/menu` 3465, `/tr/contact` 2888 ms. First Load JS 225.9 → **214.6 kB gz** (Kural 46 hedefi ≤ 200 — **tutmadı**). lab-check chromium **93/93** + webkit **93/93**, konsol temiz; 375/768/1440/1920'de yatay taşma yok. Ayrıntı ve geri alınan denemeler: `docs/screens/faz-8-table.md` *(revize: 2026-09-18)*

### Faz 9 — Deploy
- [x] GitHub repo `saygingemici25800-pixel/manch` (origin main) + push
- [x] Vercel'e bağlı (auto-deploy); env **`NEXT_PUBLIC_SITE_URL=https://manch-eight.vercel.app`** eklendi ve redeploy edildi → canonical/hreflang/sitemap canlı host'u gösteriyor *(revize: 2026-09-17 — faz tanımındaki "env yok" yanlıştı)*
- [x] Vercel koşulu yerelde simüle edildi: `git clone . /tmp/manch-clone && pnpm install --frozen-lockfile && NEXT_PUBLIC_SITE_URL=… pnpm build` → temiz (install 0, build 0, 20 rota)
- [x] `sharp` **dependency** (devDependency değil — Vercel prod install'ında `next/image` optimizasyonu için); `vercel.json` gerekmedi (Next preset yeterli)
- [x] `.env.example` + README ortam değişkenleri tablosu (`NEXT_PUBLIC_ALLOW_NOPRELOAD` prod'da tanımlanmaz)
- [x] `scripts/smoke.mjs` (Kural 48) — canlıda **10/10 ✓, 0 uyarı** (canonical `https://manch-eight.vercel.app`, hreflang `en,tr,x-default`, og:image, Restaurant JSON-LD)
- [x] Preview/canlı URL DURUM'da
- [x] Domain (Cloudflare DNS) — TODO'daki adım listesi
- [x] ✅ Kabul: Vercel build **yeşil (1 dk)** · `scripts/smoke.mjs` canlıda **31/31 ✓, 0 uyarı** · dört sayfa × iki dil 200 · JSON-LD 12 alan, `priceRange` yok, saatler 7 gün · **sepet → WhatsApp canlıda çalışıyor** (25/25 kart görünür, toast, rozet 3, drawer 2 satır, 1500 TL, `wa.me/905054970748` doğru mesajla; konsol 0 hata). `docs/screens/faz-9-cart-live.png` *(revize: 2026-09-18)*

---

### Faz 5.5 — MANCH Zone (3D galeri)

> Tam spesifikasyon: **`docs/manch-zone-3d.md`** · görsel/davranış referansı: `docs/reference/manch-zone-prototype.html`
> Dal: **`zone/3d-galeri`**. `faz-1-yeniden` (production) ancak kabul kriterleri geçince birleşir.
> Ölçüler prototipten, **renkler `tokens.ts`'ten** (prototip eski `berry #7A1F4B` kullanıyor).

- [x] **5.5.1** Bağımlılıklar (three 0.186 · fiber 9.7 · drei 10.7) + `store/zone.ts` + `lib/zone/frames.ts` + `lib/zone/textures.ts` + `menu.ts` içecek kategorisi (28 ürün) + `Zone` namespace (37 anahtar)
- [x] **5.5.2** `ZoneCanvas` + `Hall` (10 mesh, ön duvar z=+20 dahil, künye metni i18n'den, `document.fonts.ready` yeniden çizimi) + `/lab/zone`
- [x] **5.5.3** `Character` (4 açılık sprite, **billboard**) + `useZoneControls` + `useFollowCamera` + `lib/zone/{angles,character,runtime}.ts` + `scripts/zone-camera-check.mjs` (32/32)
- [x] **5.5.4** `Footprints` (18'lik havuz, hareket yönüne göre) + `Npc` (billboard'lu, idle) + ışık bantları prototip ölçüsünde
- [x] **5.5.5** `Frame` × 4 + `FloorMarker` + `FramePrompt` + yakınlık (52/52)
- [x] **5.5.6** POV geçişi + `FrameBoard` kabuğu — odak gidiş-dönüşü, yarım geçişte Esc, hızlı E–Esc (62/62)  *(eski 5.5.7)*
- [x] **5.5.7** `Joystick` — window dinleyicileri, 8 yön klavyeyle birebir, POV'da gizli, `aria-hidden` (73/73)  *(öne alındı)*
- [x] **5.5.8** `OrderBoard` (15 satır, `useCartStore`, `submitOrder` adaptörü, scroll korunması) — 84/84
- [x] **5.5.9** `ZoneGate` + `CharacterSelect` + `ZoneLoader` — ana sayfaya bağlandı (96/96)
- [x] **5.5.10** `StoryBoard` × 3 — `crew` · `mascot` · `visit` (100/100)
- [x] **5.5.11** Performans + Kural 59 gözle bakma — 5 script yeşil, 96 ekran görüntüsü, 3 kusur bulundu ve düzeltildi

> **Sıra bir kez daha değişti (2026-09-18, kullanıcı): `Joystick` öne alındı (5.5.7),
> `OrderBoard` 5.5.8'e kaydı.** Gerekçe: **kullanıcı üç turdur kontrolün görünmediğini
> fark ediyor** — klavye çalışıyor ama ekranda karşılığı yok. Zone'un gezilebilir olduğu
> ancak görünür bir kontrol varsa anlaşılıyor.
>
> **Sıra değişti (2026-09-18, kullanıcı — kota kısıtı).** Gerekçe: **ilk dördü bitince Zone
> gösterilebilir hale geliyor** — girilebiliyor, gezilebiliyor, tabloya girilip sipariş
> verilebiliyor. `Joystick` ve `StoryBoard` bu eşikten sonraya kaldı: ikisi de Zone'un
> gösterilebilmesi için şart değil (klavye zaten çalışıyor, hikâye panoları içerik).
- [x] ✅ Kabul: `docs/manch-zone-3d.md` bölüm 11 — geçildi (birleştirme kullanıcı onayı bekliyor)

**Her adımda koşulacak script'ler:**
`node scripts/zone-bundle-check.mjs` (three ana bundle'a sızmadı mı) ·
`CHROME=… node scripts/zone-leak-check.mjs` (aç-kapa'da `alive` sabit mi) ·
`BASE=… PROD=… CHROME=… node scripts/zone-perf-check.mjs` (5.5.11: POV donması + kare hızı) ·
`CHROME=… node scripts/zone-camera-check.mjs` (5.5.3'ten itibaren: üç açı tuzağı + dört yön +
billboard + aynalama + reduced-motion; `ONLY=math|scene|reduced` ile tek bölüm koşar) ·
`pnpm lint && pnpm build`

68. **Satır içi `style` sınıfı EZER — kırılıma bağlı ölçü `style` ile verilmez (2026-09-18, 5.5.11).**
    `style={{ width: 220 }}` + `className="max-md:w-[36vw]"` yazıldığında mobil kural **hiç çalışmaz**:
    satır içi stilin önceliği her zaman daha yüksektir. `CharacterSelect`'te tam bu oldu — seçim ekranı
    390 px viewport'ta 526 px genişliğindeydi, ikinci maskot ve başlık kadraj dışındaydı; kusur
    5.5.9'dan beri duruyordu ve hiçbir otomatik kontrol bakmadığı için görünmedi.
    Kural 37'nin (sınıf sırası base sınıfı ezemez) kardeşi: **ölçü ya tamamen sınıfla ya tamamen
    `style` ile verilir, ikisi karıştırılmaz.** Canvas gibi piksel tamponu olan öğelerde tampon JS'te
    (`c.width = W * dpr`), ekran ölçüsü sınıfta (`aspect-[11/14] w-[220px] max-md:w-[36vw]`) kalır.
    Bekçi: `zone-camera-check` portre kırılımında seçim bloğunu ölçer — dar viewport olmadan kusur
    görünmez, bu yüzden kontrol gerçek portre boyutunda koşar.

69. **Ekran görüntüsü: faz başına EN FAZLA 2 commit (karar 2026-09-18, kullanıcı).**
    Commit edilen kareler yalnızca **kabul edilmiş bir kararı belgeleyenler** olur — "şuna
    baktım" kareleri değil. Gerekçe: 5.5.11'de gözle bakma turu 96 kare üretti (71 MB);
    `docs/screens/` zaten 178 MB ve `.git` 271 MB. **Geçmişten silmek depo boyutunu
    küçültmez** (bu yüzden budama yapılmaz, karar 2026-09-18), git-lfs bu ölçekte gereksiz
    karmaşa — tek işe yarayan önlem **yenisini eklememek.**
    Tur kareleri yerelde üretilir, bakılır, commit edilmez; script'i commit etmek yeter
    (`zone-walkthrough.mjs` aynı kareleri tek komutla yeniden üretir). Faz sonu raporunda
    kareler **sayıyla** anlatılır, dosyayla değil.

---

## 🧠 HATA GÜNLÜĞÜ

| Tarih | Faz | Hata | Kök neden | Çözüm |
|---|---|---|---|---|
| 2026-09-17 | 1 | `pnpm: command not found` | Sistemde pnpm kurulu değil; sadece node 24 + corepack + npm var | `corepack enable pnpm` denendi → `/usr/local/bin` için EACCES. Çözüm: `corepack enable --install-directory ~/.local/bin pnpm` (pnpm 11.25.0), PATH'e `~/.local/bin` eklenir (Kural 11) |
| 2026-09-17 | 1 | Dokümanlar Next.js 15 diyor, `create-next-app@latest` **Next.js 16.3.5** kurdu | Brief yazıldığında 15 güncel sürümdü; bu arada 16 stable oldu | Next 16'da kalındı. next-intl 4.14.5 peer aralığı `^16.0.0` içeriyor, Tailwind v4 ve React 19.2 uyumlu. Stack notları 16 olarak revize edildi (Kural 12) |
| 2026-09-17 | 1 | `create-next-app` kökte kendi `CLAUDE.md` dosyasını oluşturdu (içeriği `@AGENTS.md`) ve taşınacak dosyayla çakıştı | Next 16 scaffold'u agent yönergesi için `AGENTS.md` + ona işaret eden `CLAUDE.md` üretiyor | Scaffold'un `CLAUDE.md` dosyası silindi, proje dokümanı köke taşındı; `AGENTS.md` içeriği `CLAUDE.md` sonuna referans olarak eklendi (Kural 13) |
| 2026-09-17 | 1 | Faz tanımı `middleware` diyor; Next 16'da `middleware.ts` **deprecated** (`node_modules/next/dist/docs/.../proxy.md`) | Sürüm farkı (15 → 16) | `src/proxy.ts` yazıldı, next-intl `createMiddleware` default export olarak verildi. Build çıktısında `ƒ Proxy (Middleware)` görünüyor (Kural 14) |
| 2026-09-17 | 1 | `pnpm add` sonrası `ERR_PNPM_IGNORED_BUILDS` (@swc/core, @parcel/watcher) | pnpm 11 postinstall script'lerini varsayılan olarak engelliyor; scaffold `pnpm-workspace.yaml`'a placeholder yazmış | Her ikisi de `false` yapıldı (Next kendi SWC binary'sini getiriyor). Build etkilenmedi |
| 2026-09-17 | 2 | Silkscreen TR karakter desteği zayıf: `ğ ş ı Ğ Ş İ` yok (fontTools ile `.next/static/media/*.woff2` cmap union'ı; latin-ext dilimi sadece 18 glyph) | Google Fonts "latin-ext" etiketi tam kapsama garantisi vermiyor | Kural 18 uygulandı: `font-pixel` = **Press Start 2P** (12/12 TR ✓). Silkscreen `font-pixel-alt` olarak sadece `/lab`'da, `preload: false`. Modak ve Mouse Memoirs 12/12 ✓ — fallback zinciri yine de tanımlı (Kural 19) |
| 2026-09-17 | 2 | Sistemde fontTools yok; glyph kapsamı doğrulanamıyordu | macOS python3'te fontTools/brotli yok | Scratchpad'e `pip --target` ile kuruldu; `/lab`'daki `GlyphCheck` (canvas ölçümü) tarayıcı tarafında aynı testi yapar (Kural 21) |
| 2026-09-17 | 3 | `pnpm lint` 4 hata: `react-hooks/refs` (BlobButton `contextSafe` closure'ları + SplitReveal `createElement(as,{ref})`), `react-hooks/immutability` (SmoothScroll `lenis.options.lerp =`) | `eslint-config-next@16` React Compiler kurallarını açıyor; `ref.current`'i render sırasında çağrılan fonksiyonlara vermek ve dış nesne mutasyonu yasak | Kural 25: GSAP hedefleri `scope` selector'ı (`.wrap`, `path`) ile; dinamik tag `createElement` değil JSX `<Tag ref>`; Lenis mutasyonu modül-seviyesi `applyLerp()` helper'ına taşındı |
| 2026-09-17 | 4 | `pnpm lint` 6 hata: `react-hooks/set-state-in-effect` (Cart toast, Nav `setDark(false)`), `react-hooks/refs` + `immutability` (PageTransition `contextSafe` closure'larında `root.current` okuma ve `ref.current =` yazma) | Kural 25 eksikti: closure'da ref *yazmak* da yasak; effect'te senkron `setState` de ayrı kural | Kural 25 genişletildi: state türet ya da `setTimeout(…,0)`; closure'lar sadece selector + store + helper fonksiyon çağrısı kullanır (`src/lib/transition-title.ts`) |
| 2026-09-17 | 4 | Wheel ile scroll çalışmıyor (`lenis-scrolling` sınıfı geliyor ama `scrollY` 0); nav gizlenme testi düşüyor | `ReactLenis` instance'ı effect'te `setLenis` ile state'e yazıyor, `ref.current.lenis` ancak sonraki render'da doluyor; SmoothScroll'un `[]` bağımlılıklı effect'i o anda `undefined` görüp ticker'ı hiç bağlamıyordu (Faz 3'te StrictMode ikinci koşusuyla şans eseri çalışmış) | Ticker bağlama `useLenis()` ile **çocuk** component'e (`LenisTicker`) taşındı; `lenis` var olunca effect koşuyor (Kural 24 güncellendi) |
| 2026-09-17 | 4 | Console: `Invalid scope` + `GSAP target .bar not found` | `CursorTrail` reduced/coarse'ta `null` render edince `root.current` null; `useGSAP({ scope })` bağımlılık değişince null scope ile yeniden koşuyor | Koşullu null render eden component'lerde `scope` yok; ref effect içinde okunur, element yoksa erken çıkılır; hedefler `querySelector` ile element olarak verilir (Kural 31) |
| 2026-09-17 | 6 | Prod'da `/tr/yok` curl ile `data-testid="not-found"` içermiyor (status 404 doğru) | Dinamik `[...rest]` → `notFound()` yanıtı **stream shell**: `<body>` boş + RSC payload, UI client'ta render ediliyor; curl markup görmez | Playwright ile prod doğrulandı: 404 status + bizim UI + nav ✓. Karar 2026-09-17: stream shell yeterli, `global-not-found` denenmeyecek |
| 2026-09-17 | 6 | lab-check "anatomy pinned" ~%50 düşüyordu (top -160…-952) | Diagnostik: `scrollY 5201, progress 1`. Sayfa sonundan (`#location`) gelince ST henüz `scrollTo(0,0)`'ı işlemeden `.pin` elemanına `scrollIntoView` yapılıyordu; ST pin elemanını spacer **sonuna** (start+1800) taşımış olduğundan ona kaydırmak `end`'in ötesine iniyor → hiç pin'lenmiyor (kendi kendini besleyen tuzak). Ürün hatası değil, test akışı | Test: `.pin` yerine **section**'a scrollIntoView, önce `scrollY===0` bekle. Kural 32'ye not |
| 2026-09-17 | 6 | Pin ve batch tetiklenmiyor (trigger aralıkta ama `active:false`; menü kartları fold altında gizli kalıyor) | Lenis `scroll` event → `ScrollTrigger.update` köprüsü dev StrictMode instance takasından sonra bazı yüklemelerde çalışmıyor (kök neden tam izole edilemedi; ticker 60 fps'ti) | `LenisTicker` ticker'ında `lenis.raf()` sonrası `ScrollTrigger.update()` çağrılıyor (deterministik). Kural 24'e eklendi |
| 2026-09-17 | 6 | `/menu`'de scroll ederken kartlar tekrar gizleniyor | `MenuClient` her render'da yeni `blocks` dizileri üretiyor; `navHidden` store her scroll'da render → `ProductGrid` `useGSAP` deps `[products]` + `revertOnUpdate` → sürekli revert + `gsap.set(opacity:0)` | `blocks` `useMemo`, grid deps kararlı slug anahtarı (Kural 36) |
| 2026-09-17 | 6 | Harita kapağındaki sky `Placeholder` kutuyu doldurmuyor (contact + ana sayfa Location) | `Placeholder` base sınıfı `relative`; Tailwind `relative`'i `absolute`'tan sonra üretir → `className="absolute inset-0"` override'ı eziliyor | `Placeholder` className'de `absolute` varsa `relative` eklemiyor. Genel kural: base sınıfla çakışan prop sınıfları için koşullu ekleme (Kural 37) |
| 2026-09-17 | 7 | `/icon/32`, `/icon/512`, `/apple-icon` 404 | next-intl proxy matcher uzantısız yolları locale'e yönlendiriyor (`/icon/32` → `/tr/icon/32`) | Matcher'a `icon|apple-icon` hariç tutma eklendi (Kural 38) |
| 2026-09-17 | 7 | `/tr/menu` head'inde `og:image` yok; title şablonu uygulanmıyor ("Menü") | Sayfa `openGraph` nesnesi üst segmentinkini bütünüyle ezer (dosya-kural görseli dahil); layout'ta `title.template` `pageMetadata` spread'inden önce yazılıp `absolute` ile eziliyordu | `pageMetadata` `openGraph.images` açıkça verir; layout'ta şablon en sonda (Kural 38) |
| 2026-09-17 | 7 | Lighthouse: canonical "invalid" (SEO 92), footer wordmark kontrast (berry/berry-dk), nav logo + harita butonu `label-content-name-mismatch`, ProductModal kapalıyken `aria-dialog-name` (A11y 93–96) | canonical `manch.tr` iken ölçüm `localhost`; dekoratif dev yazı aria-hidden olsa da axe kontrast sayıyor; `aria-label` görünen metni içermiyordu; `aria-labelledby` hedefi kapalıyken DOM'da yok | LH build'i `NEXT_PUBLIC_SITE_URL=http://localhost:3100` ile; wordmark transparent fill + stroke; logo `aria-label="MANCH — Ana Sayfa"`, harita butonlarında `aria-label` yok (içerik adı verir); modal kapalıyken `aria-label` (Kural 40) |
| 2026-09-17 | 7 | `chrome-launcher` import edilemiyor (`ERR_MODULE_NOT_FOUND`) | pnpm strict: lighthouse'un bağımlılığı hoist edilmiyor | Playwright Chromium `--remote-debugging-port` ile açılıp Lighthouse'a `port` verildi (`scripts/lighthouse.mjs`) |
| 2026-09-17 | 7.5 | Sistemde `rembg`/`PIL`/`numpy`/`onnxruntime`/`potrace` yok (sadece Python 3.9.6) | Homebrew Python yok; sistem pip 21 | Scratchpad'e `pip --target` (rembg 2.0.50 py3.9 uyumlu, model `~/.u2net/isnet-general-use.onnx` mevcuttu). Kural 41 |
| 2026-09-17 | 7.5 | Kesitlerde bordo kağıt artıkları (fig-jam, morel, chicken) ve beyaz ok kalıntısı (truffle) | Alpha matting artıkları burgere bağladı; global renk filtresi gölgeli kağıdı (RGB ≈ 55/23/12) patty kahvesinden ayıramıyor | Bölgesel `FIXES` (G/R < 0.47 koyu kırmızı, dış bölgelerde) + en büyük bileşen; kontak tablosuyla göz kontrolü |
| 2026-09-17 | 7.5 | Maskot kesiti "Tiramisu … 360 TL" satırını aldı | Bölge üst sınırı yüksek | Bölge `0.755H`'den başlatıldı |
| 2026-09-17 | 7.5 | `apple-icon.tsx` `SIZE` tanımsız, `InstagramGrid` `as const` union'da `cutout` yok, Footer `site` kullanılmıyor | Regex tabanlı toplu düzenleme async fonksiyonu kaçırdı; literal union tipi | Tek tek düzeltildi; toplu regex düzenlemelerinden sonra `pnpm build` şart (Kural 2) |
| 2026-09-17 | 7.5 | OG görseli burger'ı `site.url` üzerinden `<img>` ile çekecekti | `manch.tr` build/preview'da erişilemez | `readFile` → base64 data URI (Kural 42) |
| 2026-09-17 | 7.5 | Bölgesel koyu-kırmızı filtresi ekmek/köfte gölgesini de yedi (chicken, morel) | Çıktı üzerinde renk filtresi: gölgeli kağıt ile patty kahvesi ayrılamıyor | Pipeline v2: filtre **kaynakta**, matting'den önce (kağıt/ok → karo rengi) + en geniş satırın altındaki "soğuk" satırları kes (`trim_cold_bottom`). Kural 41 güncellendi |
| 2026-09-17 | 7.5 | Dev console: "Image … detected as LCP, add loading=eager" ×7 | Test akışı sayfayı anında sona kaydırıyor → Next dev heuristiği rastgele görseli LCP sayıyor | Fold-üstü görseller `priority` (hero, ilk 3 kart, modal, kapaklar); lab-check bu dev uyarısını filtreler (prod'da yok). Gerçek LCP ölçümü Faz 8 Lighthouse Performance'ta |
| 2026-09-17 | 7.5 | Kesit matrisi 3 kez askıda kaldı (süreçler 0 % CPU); birefnet-general tek fotoğrafta > 242 s | venv'de onnxruntime 1.19 sağlayıcı listesi `CoreMLExecutionProvider` ile başlıyor, rembg oturumu onunla açıyor → ANE derlemesi dakikalarca (`new_session` 196 s ölçüldü). birefnet (973 MB) CPU'da da çok yavaş | `new_session(model, providers=["CPUExecutionProvider"])` (Kural 41); birefnet kural gereği bırakıldı (>90 s) |
| 2026-09-17 | 7.5 | Matrisin 3 kombinasyonu "unrecognized arguments: --preclean" ile düştü | Satır içi döngü **zsh**'de koştu: tırnaksız `$flags` sözcüklere bölünmez (bash'ten farklı) | Döngüler `bash -c` ile / `compare.sh` (bash) kullanılır; Kural 41 notu |
| 2026-09-17 | 8 | `bundle-report.mjs` "/usr/local/bin/node" sayfasını ölçtü | Sayfa argümanı `process.argv.find(startsWith("/"))` → argv[0] node yolu | `argv.slice(2)`; ilk baseline bundle raporu geçersiz, yeniden alındı |
| 2026-09-17 | 8 | İlk baseline'da preloader'sız mobile perf 79/82/89, TBT 444–697 ms; desktop 54–76 | `?nopreload=1` yalnızca non-production çalışıyordu → ölçüm dev sunucuda (minify'sız bundle) | `NEXT_PUBLIC_ALLOW_NOPRELOAD=1` build-time izni; her iki varyant prod build'de (Kural 43 revize). Baseline yeniden alındı |
| 2026-09-17 | 8 | Lazy-gsap refaktörü: 2 parse hatası (regex ile kaldırılan eski `useGSAP` bloklarının kalıntısı), `useLazyGsap`'ta render'da ref yazımı (`react-hooks/refs`), zincir lint/build hatasına rağmen bundle/LH/lab-check'e devam etti | Toplu regex düzenleme + kapısız zincir | Blok bazlı düzeltme; "latest ref" kalıbı yerine effect kapanımı; zincirlerde `lint && build ||` kapısı (Kural 2) |
| 2026-09-17 | 8 | `/tr` mobil LCP 3.1–3.3 s (hedef < 2.5), FCP 0.9 s | LCP elementi hero H1; SplitText lazy gelince H1 char span'larına bölünüp yeniden boyanıyor → yeni LCP adayı animasyon sonunda | Hero H1 statik (Kural 47); LH 13'te element denetimi `lcp-breakdown-insight` (eski `largest-contentful-paint-element` yok) — `lighthouse.mjs` düzeltildi |
| 2026-09-17 | 8 | `next/image` hero isteği 44 B döndü (400) — hero fotoğrafı prod'da kırıktı; console "quality 70 not configured in images.qualities" | Next 16'da `quality` prop'u `images.qualities` listesinde olmak zorunda (varsayılan `[75]`) | `next.config` `images.qualities: [70, 75]` (Kural 47). lab-check console filtresi bunu yakaladı — görsel istek durumu da kabul kriteri oldu |
| 2026-09-17 | 8 | WebKit: `preloaded but not used` (fig-jam/classic 384w); Chromium: `Performance.measure('CatchAll') negative time stamp` pageerror | `loading="eager"` de preload üretiyor (WebKit aday uyuşmazlığı); ikincisi Next dev araçlarının 404 catch-all ölçümü | `eager` kaldırıldı, `priority` sadece LCP adaylarında; dev-only pageerror belgeli filtre (Kural 45) |
| 2026-09-17 | 9 | `smoke.mjs` canlıda "hreflang yok" dedi; oysa 3 alternate link doğru üretiliyor | Next 16 metadata çıktısı **`hrefLang`** (camelCase) yazıyor; regex `hreflang="` arıyordu (HTML'de attribute adı büyük/küçük harf duyarsız, regex değil) | Regex `/hrefLang="…"/i` (case-insensitive) — ürün hatası değil, test hatası (Kural 48) |
| 2026-09-18 | 1 | `pnpm create next-app` boş olmayan klasöre kurulmuyor (kökte `CLAUDE.md` varken hata) | scaffold'un `validFiles` listesinde `.git` ve `docs` var, `CLAUDE.md` yok | `CLAUDE.md` scaffold öncesi geçici olarak `docs/` içine alındı, sonra köke geri taşındı — orijinal Faz 1 başlangıç durumu zaten böyleydi (Faz 1, madde 2) |
| 2026-09-18 | 1 | CLAUDE.md'yi script ile güncellerken **dosya ikizlendi** ve protokol bölümü bozuldu (aynı kök neden iki kez) | `str.index("## 🧠 HATA GÜNLÜĞÜ")` protokolün 1. maddesindeki **alıntıyı** yakaladı → dilim sınırları ters döndü (`b < a`) → `s[:a] + s[b:]` aradaki metni iki kez yazdı; ilk denemede aynı şey `## 📍 DURUM` ile oldu | Satır başına çapalı regex + `assert a < b` + yazım sonrası grep doğrulaması (Kural 49); dosya `yedek/faz-1-9` dalından geri alınıp yeniden yazıldı |
| 2026-09-18 | 1 | `ERR_PNPM_IGNORED_BUILDS` tekrar (@parcel/watcher, @swc/core) | pnpm 11 postinstall script'lerini engelliyor; Next 16 scaffold'u `pnpm-workspace.yaml`'a bu kez `sharp: false` + `unrs-resolver: false` yazıyor | Dört paket de `allowBuilds`'te `false`; build etkilenmedi |
| 2026-09-18 | 2 | `/lab` GlyphCheck **üç fontta da "12/12 eksik"** dedi; oysa fontTools ve sayfanın kendisi karakterlerin var olduğunu gösteriyordu | Canvas `ctx.font` **CSS değişkeni çözmez** — `48px var(--font-modak), monospace` geçersiz shorthand, atama sessizce yok sayılıyor; iki çizim de varsayılan fontla yapılınca pikseller eşitleniyor ve her karakter "fallback'e düştü" sayılıyor | Aile adı `getComputedStyle(document.documentElement).getPropertyValue(cssVar)` ile çözülür; ayrıca next/font değişkeni `"X", "X Fallback"` şeklinde ve fallback (yerel Arial türevi) TR karakterleri **içerir** → yalnızca **ilk** aile kullanılır, yoksa ölçüm yanlış "var" derdi |
| 2026-09-18 | 2 | Düzeltmeden sonra Modak "ölçülemedi", diğer ikisi doğru | Kapı `ctx.font` geri okumasını ham karşılaştırıyordu; tarayıcı **tek kelimelik** aile adının tırnaklarını düşürüyor (`"Modak"` → `Modak`), çok kelimeliyi koruyor (`"Mouse Memoirs"`) | Karşılaştırma normalize edildi (tırnak sil + küçük harf). Genel kural: `ctx.font` geri okuması normalize edilmeden karşılaştırılmaz |
| 2026-09-18 | 3 | Eğik Marquee bantları kenarlarda zemini açıkta bırakıyor, sonra kama şekline döndü | (a) bant tam genişlikte olduğu için `rotate` sonrası köşeler viewport'a yetişmiyor; (b) genişletince dış `overflow-hidden` kutusu dikey dolgusuz kaldı → döndürülmüş bandı çapraz kesti | Bant %115 genişlik + `translateX(-6.5%)`, dış kutuya `paddingBlock = |tilt|·1.1 vw` (Kural 51) |
| 2026-09-18 | 3 | `lab-check` "data-cursor-hide üstünde iz gizlendi" testi düştü (opacity=1) | **Test hatası**: fold testi sayfayı kaydırmıştı, `#d-cursor` viewport dışındaydı; `boundingBox()` viewport dışı koordinat döndürünce `mouse.move` elemana isabet etmedi | Hover testinden önce `scrollIntoViewIfNeeded()`; ayrıca "iz normalde görünür" ön koşul testi eklendi (yanlış pozitifi ayırt etmek için) |
| 2026-09-18 | 3 | Playwright `waitUntil: "networkidle"` dev sunucuda hiç tetiklenmiyor (script 300 s'de asıldı) | `next dev` HMR websocket'ini açık tutar → ağ hiç boşa düşmez | `waitUntil: "domcontentloaded"` + `waitForSelector` + `document.fonts.ready`. Dev sunucuda networkidle kullanılmaz |
| 2026-09-18 | 4 | `main`'den alınan layout component'leri derlenmedi: `TS2613 no default export` (RollText, SplitReveal, Juggle, KraftCard, IngredientIcon) | Faz 3'te primitive'leri **named export** yazdım, `main` **default export** kullanıyor; ayrıca API farkı (`<RollText text={...} />` → children, `<SplitReveal mode/text>` → `type`/children, `<Juggle>{icons}</Juggle>` → `items` prop) | Çift export açmak yerine kopyalanan dosyaların import ve kullanımları named API'ye uyarlandı; her adımda `lint && build` |
| 2026-09-18 | 4 | MenuOverlay açıldığında SplitReveal hiç animasyon yapmıyordu | Kural 50 (fold kuralı) overlay içeriğini de kapsıyordu: overlay açıldığında içerik zaten viewport'ta → "fold üstü" sayılıp atlanıyordu | `SplitReveal trigger="mount"` modu: ScrollTrigger kurulmaz, mount anında oynar. Kural 50'ye istisna olarak yazıldı |
| 2026-09-18 | 4 | lab-check "Nav aşağı scroll'da gizlenir" düştü (top 0 → 0) | **Test hatası**: Faz 4'te ana sayfa hâlâ iskelet — yükseklik 918 px, viewport 900 px → kaydırılacak alan yok (`scrollY` 18) | Nav testi uzun sayfada (`/tr/lab`) koşuyor; Faz 5'te ana sayfa dolunca geri taşınabilir |
| 2026-09-18 | 4 | lab-check "CookieBanner görünür" düştü (adet=0) | **Test hatası**: banner 1.2 s gecikmeyle açılıyor, test tam 1200 ms bekliyordu (yarış) | Bekleme 2600 ms'e çıkarıldı |
| 2026-09-18 | 5 | Ana sayfa sunucuda `FORMATTING_ERROR: intl string context variable "count" was not provided` | `Common.products` mesajı `{count, plural, …}` kullanıyor, ben `{ n: … }` geçtim | `{ count: products.length }`. Mesaj değişken adları koddan varsayılmaz, `messages/*.json`'dan okunur |
| 2026-09-18 | 5 | Hero'da **her iki** fotoğraf da her kırılımda indi (mobil 20+15 KB, masaüstü 16+32 KB) | İki `<Image>` + `md:hidden` / `hidden md:block`: CSS gizleme isteği durdurmaz, ikisi de `priority` ile yüklendi | `<picture>` + `<source media>`, srcSet next/image uç noktasından elle (Kural 52) → kırılım başına tek dosya; LCP mobil 800→**792 ms**, masaüstü 200→**212 ms**, indirilen görsel 5→4 / 8→7 |
| 2026-09-18 | 5 | `lab-check` "ProductGrid ilk boyamada 6/6" testi **0/6** düştü | Kartlar fold altındaydı ve `gsap.set(opacity:0)` ile ön-gizlenmişti — batch hiç çalışmazsa **eski hata aynen geri gelirdi**. Test doğru davranışı yakaladı | Ön-gizleme kaldırıldı, `gsap.from(...)` ile animasyon (Kural 50 güncellendi). Ayrıca **sabotaj testi** eklendi: `__ST_KILL__()` ile tüm ScrollTrigger'lar öldürülüp grid'e kaydırılıyor → 6/6 hâlâ görünür |
| 2026-09-18 | 5 | `lab-check` Instagram testi "allSocial: false" dedi; oysa src'ler doğruydu | **Test hatası**: grid fold altındaydı, lazy görsellerde `currentSrc` yüklenene kadar **boş** | `getAttribute("src")` ile kontrol; ayrıca "kesit/PNG karıştırılmamış" testi eklendi |
| 2026-09-18 | 5 | `git checkout` `index.lock: File exists` ile düştü | Önceki git süreci kilidi bırakmış (çalışan git yok) | `rm -f .git/index.lock`; sonrasında `git status` ile ağaç doğrulandı |
| 2026-09-18 | 6 | `/menu` ve `/contact` sayfalarında **`<h1>` yoktu** | `/menu` başlığı `LogoMenu` SVG'si, `/contact` `SectionHeader` (h2 üretir) | `SectionHeader`'a `as?: "h1"|"h2"` prop'u; `/menu`'de wordmark `<h1 className="contents">` içine alındı (erişilebilir adı SVG `aria-label`'ı verir). lab-check "her sayfada tek h1" kontrolü eklendi |
| 2026-09-18 | 6 | `main`'den alınan `/about` derlenmedi: 5 ayrı prop uyuşmazlığı (`CheckerBand tone/rows`, `Float delay`, `SectionHeader tone`, `SplitReveal mode/text`) | Faz 2–5'te bu component'leri kendi API'mle yazdım; `main`'in Faz 6 kodu eski API'ye göreydi | `/about` **sıfırdan yazıldı** — zaten yeni görsellerle (team-counter, misu-lockup, social kareler + tile-wall) yeniden tasarlanacaktı. Genel kural: `main`'den alınan dosya 3'ten fazla API uyuşmazlığı gösteriyorsa uyarlamak yerine yeniden yaz |
| 2026-09-18 | 6 | JSX yorumu (`{/* … */}`) `<Image>` **attribute listesinin içine** yazılınca build düştü | JSX'te öznitelikler arasına yorum konmaz | Yorum elemanın üstüne alındı |
| 2026-09-18 | 6 | lab-check "İç sayfalar konsol temiz" iki kez düştü | (a) Filtre `detected as LCP` arıyordu, Next'in gerçek metni `detected as the Largest Contentful Paint`; (b) düzeltince kasıtlı 404 sayfasının ürettiği `Failed to load resource` hatası kaldı | Filtre metni düzeltildi + konsol filtresi yerine **ağ denetimi** (Kural 53): 4xx/5xx istekler URL'siyle toplanıyor, kasıtlı 404 dışında sıfır |
| 2026-09-18 | 6 | lab-check `TypeError: URL is not a constructor` | Script başındaki `const URL = …` global `URL`'i gölgeliyor | `new URL(...)` yerine string işlemi (`r.url().replace(BASE,"")`) |
| 2026-09-18 | 7 | `/icon/32`, `/icon/192`, `/icon/512`, `/apple-icon` 404 | next-intl proxy matcher **uzantısız** yolları locale'e yönlendiriyor (`/icon/32` → `/tr/icon/32`) | Matcher'a `icon|apple-icon` hariç tutması (Kural 38). 9 metadata rotası lab-check'te denetleniyor |
| 2026-09-18 | 7 | Lighthouse A11y `/tr` **93**: `aria-prohibited-attr` | GSAP SplitText varsayılanı (`aria: "auto"`) kök elemana `aria-label` yazıyor; `<p>` role'süz `aria-label` alamaz | `SplitReveal`'da satır modunda `aria: "none"` — satır bölmesi kelimeleri parçalamadığı için aria müdahalesi gereksiz. Harf modu `auto` kalır (yalnızca başlıklarda, başlık `aria-label` alabilir) |
| 2026-09-18 | 7 | Lighthouse A11y `color-contrast`: BuildSequence adım numarası **1.21:1** | `text-mustard` (#f6c343) `bg-paper` (#e9dcc6) üstünde | Numara `text-berry` (#6a1f3b) → **8.29:1** (Kural 40) |
| 2026-09-18 | 7 | Lighthouse A11y `/tr/contact` **96**: `target-size` | e-posta / Instagram / Facebook metin linkleri 18–21 px yüksekliğinde, eşik 24 px | Linklere `inline-flex min-h-[24px] items-center` (4 link) |
| 2026-09-18 | 7 | Kural 44 daraltması açılınca konsolda **56 × `MISSING_MESSAGE: Cookie`** | `CookieBanner` layout'ta mount ediliyor ve `Cookie` namespace'ini kullanıyor; `BASE_CLIENT_NAMESPACES`'te yoktu. Kural 44'ün öngördüğü hata, lab-check yakaladı | `Cookie` listeye eklendi + tüm layout client component'lerinin namespace denetimi `client-messages.ts`'e yorum olarak yazıldı (Kural 55) |
| 2026-09-18 | 8 | Taban: preloader'sız mobile `/tr` perf **83**, LCP **4691 ms** | (a) Ana sayfada `TheHits` kartına `priority` verilmişti ama kartlar fold ALTINDA — preload hero fontlarıyla yarıştı; (b) 3 font ailesi × 2 dilim = 6 woff2 preload; (c) LCP adayı H1, Modak `swap` ile geç inince yeniden boyanıp LCP'yi öteliyor | Ana sayfada `priority` kaldırıldı, Press Start 2P `preload: false` → perf 83→96, LCP 4691→2799 |
| 2026-09-18 | 8 | Hero görseline medya koşullu preload eklendi → **kötüleşti** (perf 96→93, LCP 2799→3230) | Preload edilen tam ekran görsel LCP adayı oluyor ve metinden geç boyanıyor | Geri alındı. Ders: LCP'de "daha fazla preload" her zaman iyi değil — ölçmeden ekleme |
| 2026-09-18 | 8 | Modak `display: "optional"` denendi → perf 96→92, TBT 34→124 | Fallback'e düşünce düzen/boyama işi artıyor; marka fontu da kayboluyordu | Geri alındı, `swap` kaldı |
| 2026-09-18 | 8 | Tek Lighthouse koşusuyla karar verilirken **gürültüye kanıldı** (aynı yapıda LCP [2194, 2799, 3529]) | Simüle throttling koşular arası ±10 puan / ±1 s oynuyor | `scripts/lighthouse.mjs` varsayılan **3 koşu medyanı** (`RUNS` ile değişir), ham örnekler de raporlanıyor |
| 2026-09-18 | 8 | **WebKit**: `ChunkLoadError: Failed to load chunk …/gsap` (pageerror) | Hızlı gezinmede uçuştaki lazy `import()` iptal oluyor, `.catch()` olmadığı için yakalanmamış redde dönüşüyor | `useLazyGsap`, `useGsapModule`, `SmoothScroll` ve `gsap.ts`'teki tüm lazy import'lara `.catch(() => {})` (Kural 56). Chromium'da hiç görünmemişti — Kural 45'in WebKit koşusu işe yaradı |
| 2026-09-18 | 8 | WebKit konsolunda `preloaded using link preload but not used` | Next'in **dev** Turbopack HMR chunk'ı — uygulama kodu değil, prod'da yok | lab-check filtresine belgeli istisna (Kural 45) |
| 2026-09-18 | 9 | Tahmin edilen preview URL 404 | Ekip slug'ı `saygingemici25800-pixels-projects` sanılmıştı, gerçeği `saygingemici25800-2823s-projects` | `vercel project ls` ile doğrulandı; URL tahmin edilmez, listelenir |
| 2026-09-18 | 9 | Dal push'u preview üretti ama **canonical yanlış olacaktı** | Mevcut `manch` projesinde `NEXT_PUBLIC_SITE_URL` Production **+ Preview** kapsamında `https://manch-eight.vercel.app` (eski site) — preview onu miras alıyor | **Ayrı Vercel projesi** (`manch-v2`) açıldı, kendi env'i ile. Eski site hiç etkilenmedi |
| 2026-09-18 | 9 | Deployment URL'i 302 döndü, smoke koşulamadı | Vercel Authentication deployment URL'lerinde varsayılan açık; **production alias** (`manch-v2.vercel.app`) herkese açık | Smoke alias'a koşulur, `manch-v2-<hash>` URL'ine değil |
| 2026-09-18 | 9 | `manch-v2`'nin production dalı `main` kaldı (API kabul etmedi) | `PATCH /v9/projects/:id` `gitRepository`/`productionBranch`/`link` alanlarını reddediyor; `POST /v4/projects/:id/link` çağrıyı kabul edip değeri yok sayıyor | **Panodan tek tıkla** değiştirilecek (Settings → Git → Production Branch → `faz-1-yeniden`). `vercel.json` ile engellenemez — dosya iki proje arasında ortak (Kural 58) |
| 2026-09-18 | 9 | İlk auto-deploy **hata verdi** (preview, 21 s) | `NEXT_PUBLIC_SITE_URL` yalnızca **Production** kapsamına eklenmişti; preview build'de yok → `siteUrl()` throw etti. **Kural 57 koruması tam istendiği gibi çalıştı** — sessizce yanlış canonical'la yayına çıkmak yerine build kırıldı | Env Preview kapsamına da eklendi; sonraki push Ready (~40 s). Ders: env kapsamları (Production/Preview/Development) ayrı ayrı ayarlanır, biri diğerini kapsamaz |
| 2026-09-18 | 9 | **90 otomatik kontrolün hepsi yeşilken** canlı sitede hero fotoğrafının üstünde silinmemiş overlay yazı ("Behind Every Great Burger") duruyordu; kullanıcı fark etti | Testler DOM yapısını, durum kodlarını, erişilebilirlik ağacını ve metrikleri doğruluyor — **piksellere bakmıyor**. Kırık görsel yok, alt metni var, boyutu doğru: hiçbir kontrolün tetiklenmesi için sebep yok | Fotoğraf değiştirildi. **Ders: otomatik testler yapıyı doğrular, görünüşü doğrulamaz — her faz sonunda canlı/preview sayfalara gözle bakılmalı** (Kural 59) |
| 2026-09-18 | 5.5.1 | Referans prototip (`manch-zone-prototype.html`) **hiç açılmıyordu** | Satır 644'te tanımsız `redrawChars()` çağrısı `ReferenceError` atıp sahneyi başlatmıyordu — eski sürümden kalma artık çağrı; sprite'lar zaten `buildSet()`/`SET[who]` ile atanıyor | Çağrı kaldırıldı, prototip çalışıyor ve gezildi |
| 2026-09-18 | 5.5.1 | Faz 9'daki deploy bekleme döngüsü **başarısız deploy'u başarılıdan ayırt edemiyordu** (sonunda sebepsiz `exit 1`) | `vercel ls` çıktısını awk/grep ile ayrıştırmak hangi satırın YENİ deployment olduğunu söylemiyor | `scripts/deploy-wait.mjs`: Vercel API'sinden **SHA eşleşmesi**; READY→0, ERROR→1, zaman aşımı→2. Üç yol da test edildi (Kural 60) |
| 2026-09-18 | 5.5.1 | three sızıntı kontrolü sabotajı **yakalamadı** | Geçici statik `three` importu `page.tsx`'e (Server Component) konmuştu → three server bundle'da kaldı, istemci paketine hiç girmedi | Sabotaj client component'e (`ProductCard.tsx`) taşındı: bundle 215 → **342.8 kB gz**, kontrol yakaladı (Kural 61) |
| 2026-09-18 | 5.5.2 | Zone sızıntı testi **sızıntı olsa da geçerdi** | `/lab/zone` ↔ `/lab` navigasyonuyla ölçüyordu; tam sayfa yüklemesi modül sayaçlarını sıfırlıyor, her tur `created=1 disposed=0` çıkıyordu | Sayfa içi aç/kapa düğmesiyle gerçek mount/unmount döngüsüne çevrildi; sabotajla doğrulandı: `alive` 2→3→4, exit 1 (Kural 60, 62) |
| 2026-09-18 | 5.5.2 | `pnpm lint`: "Expected the dependency list for useMemo to be an array literal" | React Compiler kuralı — jenerik `useTexture(make, deps)` hook'u bağımlılığı değişken olarak geçiyordu | Hook kaldırıldı, her doku çağrı yerinde açık `useMemo([...])` ile; yeniden çizim anahtarı `revision` parametresi olarak **gerçekten kullanılıyor** (sahte bağımlılık değil) — Kural 63 |
| 2026-09-18 | 5.5.2 | Tavan **gri** görünüyordu (spec: düz krem) | Aşağı bakan yüzey `meshStandardMaterial` ile yalnızca ambient alıyor | `meshBasicMaterial` + `toneMapped={false}` (ışık bantlarıyla aynı yaklaşım). **Kural 59 gözle bakma sayesinde yakalandı** |
| 2026-09-18 | 5.5.2 | Sızıntı testi tıklamada zaman aşımına düştü | `/lab/zone`'daki aç/kapa düğmesi sağ üstteydi, nav'ın MENÜ butonu (z-80) tıklamayı yakalıyordu | Düğme sol alta + z-90 (Kural 63) |
| 2026-09-18 | 5.5.3 | Prototipteki karakter düzlemi **hiç billboard yapmıyor** — yön takipli kamera gelince karakter 180° dönüşte kaybolacaktı | `PlaneGeometry` normali +z, `MeshBasicMaterial` varsayılanı `FrontSide`, `hero.rotation.y` hiç yazılmıyor. Prototipte ölçüldü: `rotation.y === 0`, `material.side === 0`. Kamera sabit bakarken hiç ortaya çıkmayan, dönüş eklenince kesin çıkan bir kusur | Sprite her karede Y ekseninde kameraya döndürülüyor (Kural 63 ⑤). `zone-camera-check` iki testle koruyor; sabotajla doğrulandı: billboard kaldırılınca sapma 180°, değişim 0° |
| 2026-09-18 | 5.5.3 | `pnpm lint` 7 hata: `react-hooks/immutability` + `set-state-in-effect` — kare-başına runtime nesnesi prop ve `useState` olarak taşınıyordu | React Compiler prop'un, hook argümanının ve `useState` çıktısının mutasyonunu yasaklıyor; `useFrame` bunları saniyede 60 kez yazıyor | Durum `lib/zone/runtime.ts`'e (modül seviyesi tek nesne + plain mutator fonksiyonlar) taşındı; sprite seti ve gölge dokusu da `acquire…`/`release…` tekilleri oldu. Kural 63 ⑥ |
| 2026-09-18 | 5.5.3 | **Test hatası:** "dönüş sırasında sprite `front`/`side` olmalı" kontrolü düştü | Beklenti yanlıştı. 0.02 ve 0.15 tabanlarının ürettiği en büyük karakter–kamera ayrışması `180·(0.15^t − 0.02^t)` → t≈0.36 sn'de **~47°**; bu `back34` kovası. `side` için 67.5° gerekir. Kod doğru, test uydurma bir eşik bekliyordu | Kontrol "sprite açıya göre değişiyor (back → back34)" + "ayrışma 25–70° bandında" oldu; kova eşlemesi ayrıca `viewFor` üzerinden saf fonksiyon olarak sınanıyor |
| 2026-09-18 | 5.5.3 | **Test hatası:** "kamera fırlamıyor" eşiği 2 birim, ölçülen 2.65 | Meşru orbit hızı zaten ~1.7 birim/örnek (2.6 rad/s × 5.4 yarıçap); yavaş örneklerde 2.65. Eşik gerçek kusurun ölçeğine göre değil, tahminle konmuştu | Eşik 4 birim (düz lerp ters yöne atsa 2·CAM_DIST ≈ 10.8 olurdu) + asıl ölçüt eklendi: dönüş boyunca açı **işaret değiştirmemeli** — tuzak (b)'nin sahnedeki doğrudan karşılığı |
| 2026-09-18 | 5.5.3 | **Test hatası:** aynalama kontrolü iki yönde de `false` verdi | 90°'lik dönüş yalnızca ~23° ayrışma üretiyor — `back34` kovasının (22.5°) tam sınırında, örnekleme anına göre oynak | Çapraz girdiyle 135°'lik dönüş (~35° ayrışma): aşağı+sağ aynalı, aşağı+sol değil |
| 2026-09-18 | 5.5.3 | Turbopack dev sunucusu ~20 hot reload sonra **HMR iç hatasına** düştü; testler 30 sn'de zaman aşımına uğradı | `TurbopackInternalError: Cell … no longer exists` — uzun oturumda HMR durumu bozuluyor; ürün kodu hatası değil | Dev sunucu `rm -rf .next` ile yeniden başlatıldı. Script'lere ısıtma isteği + `page.setDefaultTimeout(90000)` eklendi (ilk derleme 30 sn'yi aşabiliyor) |
| 2026-09-18 | rev-B | Planlayıcının verdiği `CHAR_TURN_BASE = 0.005` **hedefine ulaşmıyordu**: gerekçe "ayrışma ~102° → side çıkar" idi, gerçekte 65.2° çıkıyor ve `side` eşiği 67.5° | Üstel yumuşatmada tepe ayrışma `dönüş × max_t(camBase^t − charBase^t)`; 0.005/0.15 çifti için bu oran **%36.2**, %57 değil. 2.3° farkla kova ölü kalıyordu — üstelik istenen "180°'de side tetiklenir" kontrolü doğrudan kırmızı doğardı | Hedef uygulandı, değer **0.002** (%41.2 → 74.2°, 6.7° pay). Üç değer de ölçüldü: 0.02 → 46.6° · 0.005 → **65.1°** · 0.002 → 74.2° (model tahminiyle 0.3° içinde). Sabotajla doğrulandı: 0.005 ve 0.02'de `side` kontrolü düşüyor. Tek sabitlik geri alma |
| 2026-09-18 | 5.5.4 | Ayak izleri duvara dayanınca da basılıyordu — aynı noktada üst üste yığılıyordu | Adım sayacı **girdiye** bakıyordu; duvara dayalıyken girdi sürüyor ama karakter ilerlemiyor | Sayaç bu karede **gerçekten alınan yola** bakıyor (`moved`). Ölçüm: 2 sn yürüyüşte 11 iz → **8** (0.26 sn periyoduyla birebir) |
| 2026-09-18 | 5.5.4 | Ayak izi görünürlüğünü **piksel farkıyla** ölçmeye çalıştım, sonuç yanıltıcı çıktı | İki kare arasındaki farkın neredeyse tamamı **NPC'nin idle salınımıydı**; izler farkın içinde kayboluyordu. Maske görüntüsü bunu gösterdi: tek küçük küme, hem de kare ortasında (NPC'nin yeri) | Ölçüm doğrudan yapıldı: her izin dünya konumu kameraya **projelendirilip** kadrajda olup olmadığı sayılıyor (`footprints.onScreen`). Sonuç: 8–11 canlı izin yalnızca 1–2'si kadrajda |
| 2026-09-18 | 5.5.4 | `acquireCharacterSet` tekildi; NPC ikinci maskotu isteyince ikisi birbirinin dokusunu bırakacaktı | Tek yuva, iki tüketici: NPC her karede `acquire` çağırdıkça set sıfırdan üretilir, oyuncununki çöpe giderdi | Setler **karakter başına** `Map`'te; `releaseCharacterSets()` hepsini bırakır. Doku defteri 10 → 14 sabit (2 karakter × 4 + 5 salon + 1 gölge) |
| 2026-09-18 | 5.5.3/4 | `zone-camera-check` **koşular arası oynadı** — aynı kod bir koşuda 44/44, ötekinde 41/44 | Üçü de ölçüm hatası: ① kare içindeki tepe ayrışma `page.evaluate` ile örnekleniyordu (gidiş-dönüş 70–90 ms, tepe 0.3 sn) → 74° yerine 67° ② süre "örnek sayısı × adım" ile hesaplanıyordu (1.4 sn → 585 ms) ③ aynalama testi dönüş yönünü **varsayıyordu** | ① tepe ve kovalar **kare döngüsünde** birikiyor (`debug.peakSpread`, `seenViews`), test sıfırlayıp okuyor ② gerçek zaman damgası ③ yön ölçülen açıdan türetiliyor + **kuralın kendisi** her örnekte denetleniyor. Işınlanma ölçütü de mesafeden **hıza** çevrildi (sunucu takılınca örnek arası uzuyordu). **Üç ardışık temiz koşu** ile kapatıldı (Kural 60) |
| 2026-09-18 | 5.5.5 | POV'a girilip **bir daha çıkılamıyordu** (`Esc` çalışmıyordu) | `useZoneControls(!povOpen)` POV'da dinleyicinin TAMAMINI kaldırıyordu; hareket gerçekten duruyordu ama çıkış tuşu da duyulmuyordu. Kapatılacak olan hareket, çıkış değil | Dinleyici her zaman bağlı, durum **tuş tuş** süzülüyor: `Esc` her durumda, hareket yalnızca `state === "zone"` iken. Ayrıca POV'a geçerken basılı tuşlar bırakılıyor (store aboneliği) |
| 2026-09-18 | 5.5.5 | Lab'da prompt hiç görünmüyordu | `FramePrompt` `state === "zone"` şartına bakıyor (doğru), ama lab'da `ZoneGate` olmadığı için store `"closed"` kalıyordu | Lab sahneyi mount ederken store'u gezilebilir duruma alıyor (`select` + `ready`). Prompt'un üretim kapısı gevşetilmedi |
| 2026-09-18 | 5.5.5 | Bundle ölçümü `/tr` için **141 kB** dedi (gerçek 215.5) — %34'lük sahte "iyileşme" | 3101 portunda **eski bir `next start` süreci** kalmıştı; `pkill` onu öldürmemişti. Zombi sunucu, dev sunucusu açıkken alınmış BOZUK bir build'i servis ediyordu (chunk'lar 500). Ölçüm doğru çalıştı, yanlış sunucuyu ölçtü | `lsof -ti tcp:<port> | xargs kill -9` + port boşluğu doğrulaması; ölçüm build'leri `NEXT_DIST_DIR=.next-build` ile ayrı klasöre (Kural 65). Beklenmedik iyileşme de araştırıldı — sahte çıktı |
| 2026-09-18 | 5.5.5 | Dev sunucusu 500 dönmeye başladı (`/icon/32`, `/icon/192`), `zone-camera-check` 3 kontrolde düştü | Daha önce `pnpm build` **dev sunucusu açıkken** `.next`'e yazmıştı; dev o bozuk klasörü servis etmeye devam ediyordu. Kural 65'in tarif ettiği durumun ta kendisi — ama zarar zaten oluşmuştu | Dev durduruldu, `.next` silindi, yeniden başlatıldı → 53/53. Bundan sonra ölçüm build'leri **her zaman** `NEXT_DIST_DIR=.next-build` ile |
| 2026-09-18 | 5.5.5 | Prompt çapası 0.9 birim öne alındı ama **örtüşme sürdü** (masaüstü 22.6 px, portre 36.4 px) | Çapa yatayda düzeldi, ama kutu `translate(-50%,-100%)` ile YUKARI büyüyor. Tablonun alt kenarı y=1.55, çapa y=1.35 → duvara dayalı mesafede ekranda ~35 px boşluk; kutu ~58 px. Üç sabit (çapa formülü, 1.35 yükseklik, `-100%`) aynı anda sıfır örtüşmeyi geometrik olarak imkânsız kılıyor | Serbest kalan tek değişken kutunun büyüme yönü: `translate(-50%, 0)` — dünya çapası ve yükseklik AYNEN korunur, kutu tablonun altında kalır. Masaüstü 52 px / portre 33 px boşluk |
| 2026-09-18 | 5.5.5 | İlk örtüşme ölçümü **95.7 px** dedi (gerçek 22.6) | Ölçüm 720×405 viewport'ta yapıldı: 768'in altında `max-md` mobil CSS'i devreye giriyor, prompt ekran yüksekliğinin %23'ü oluyor ve lab HUD'ı tabloyu kaplıyor. **Test ortamı gerçekçi değildi** | Ölçüm gerçek kırılımlarda (1440×810 ve 390×844) tekrarlandı; lab okuma paneli ekran görüntüsünde gizlendi |
| 2026-09-18 | 5.5.5 | **"YÜKLENDİ ≠ DOĞRU GÖRÜNÜYOR"** — `mascot` tablosu düz **bordo blok** olarak çıkıyordu | `misu-lockup.png` alfalı (596×559, `isOpaque: false`) ama görsel materyali `transparent` değildi → alfa yok sayılıyor, şeffaf pikseller dolgu rengiyle doluyordu. Otomatik kontroller "art: image" diyordu, yani **kaynak doğru yüklenmişti** — kusur yalnızca gözle görülüyordu. **Kural 59'un varlık sebebinin en net örneği:** her otomatik kontrol yeşildi — doku üretildi, `art: image` raporlandı, 4xx yok, konsol temiz, doku sayısı doğru. Hiçbiri "ekranda ne göründüğünü" ölçmüyor. Bir varlığın **yüklenmiş olması**, **doğru görünmesini** garanti etmez | Materyale `transparent` eklendi; şeffaf görsel artık krem paspartunun üstüne bindiriliyor. Ders: yeni bir görsel türü (alfalı PNG, farklı en-boy, farklı renk uzayı) devreye girdiğinde otomatik kontroller değil **gözle bakma** karar verir |
| 2026-09-18 | 5.5.6 | Pano açılınca **sayfa kayıyordu**: kartın üstü kadrajın 32 px dışına çıkıyor, künye satırı kesiliyordu | `card.focus()` tarayıcıyı elemanı görünür kılmak için kaydırmaya itiyor (`scrollY` 0 → 123). Kart zaten kadrajın ortasında; kaydırmaya ihtiyaç yok | `focus({ preventScroll: true })` — hem panoda hem geri dönen GİR butonunda. Kontrol eklendi: pano açılınca `scrollY === 0` ve kart tamamen kadrajda |
| 2026-09-18 | 5.5.6 | POV kapanınca odak **GİR butonuna dönmüyordu** (`body`'de kalıyordu) | `drei/<Html>` içeriğini DOM'a portal ile SONRADAN basıyor; POV kapandıktan hemen sonraki effect'te buton henüz yok, `focus()` sessizce boşa gidiyor | Odak birkaç kare boyunca `requestAnimationFrame` ile deneniyor, başarınca bayrak temizleniyor |
| 2026-09-18 | 5.5.6 | `zone-camera-check` yine oynadı: 180° dönüş **3013 ms** ölçüldü (sınır 2600), billboard değişimi 16° | Sahne ağırlaştıkça dev sunucuda kare hızı düştü; `dt` 50 ms'te kırpıldığı için dünya gerçek zamandan yavaş ilerliyor. Test **duvar saati** ölçüyordu — spec'teki "1.2 sn" ise **simülasyon** saniyesi. Sabit süreli tutuşlar da 180°'yi tamamlamıyordu | `debug.simTime` (kare döngüsünde birikiyor) ile simülasyon süresi ölçülüyor; tutuşlar süreye değil **koşula** bağlandı (`holdUntil`). Üç ardışık temiz koşu |
| 2026-09-18 | 5.5.6 | "Pano açılınca sayfa kaymıyor" kontrolü bir koşuda `scrollY 607` dedi | **Test artefaktı:** Playwright `locator.click()` elemanı görünür kılmak için sayfayı KENDİ kaydırıyor; ürünün değil sürücünün davranışı ölçülüyordu. Gerçek kullanıcı tıklaması sayfayı kaydırmaz | Kontrol klavye yolundan (`E`) açıyor. Ekran görüntüsü script'i de aynı nedenle klavyeye çevrildi |
| 2026-09-18 | 5.5.7 | **"GÖRÜNMÜYOR ≠ YOK"** — Joystick ekranda görünmüyordu; topuz ve "SÜRÜKLE" etiketi kayıptı. **Kullanıcının üç turdur bildirdiği kusurun ta kendisiydi** | Sitenin sepet düğmesi `fixed z-60` ve tam olarak aynı köşede (sağ alt). Joystick `z-40` ve kapsayıcısı yığın bağlamı **oluşturmadığı** için doğrudan onunla yarışıp altında kalıyordu. Otomatik kontrollerin hepsi yeşildi: **DOM'da var, olaylar çalışıyor, sekiz yön doğru, sürükleme ped dışında yaşıyor** — ama ekranda yok. Bir bileşenin **var olması**, **görünür olmasını** garanti etmez; z-index çakışması hiçbir davranış testine yakalanmaz. **Kural 59'un dördüncü yakalayışı** (öncekiler: hero overlay yazısı, gri tavan, maskot alfası) | Zone'un DOM katmanı site kromunun üstüne alındı: joystick z-70, `FrameBoard` z-75 (nav z-80'in altında). Kalıcı kontrol: joystick merkezinde `elementFromPoint` joystick'i dönmeli. 5.5.9'daki tam ekran kapısı site kromunu zaten perdenin altında bırakacak |
| 2026-09-18 | 5.5.8 | Sipariş tahtasında −/+ düğmeleri **23 px**, işaretler silik | `1.6vw` masaüstünde 23 px ediyor — Kural 40'ın dokunma hedefi eşiği **24 px**'in altında; üstelik işaret dar bir yazı tipinde (Mouse Memoirs) ince kalıyordu. Glyph eksikliği sanıldı, ölçümle çürütüldü (U+2212 fontta var: 4.25 px, ASCII 4.19 px) | Düğmeler `2vw` + `min-h/min-w 26px`, işaretler `font-display`. Ders: "silik görünüyor" her zaman eksik glyph değil — önce ölç |
| 2026-09-18 | 5.5.8 | Mobilde lab okuma paneli, panonun **sticky alt şeridini** (TOPLAM + gönder) kapatıyordu | Lab aracı z-90, pano z-75. Ürünün birincil eylemi lab kromunun altında kalıyordu | Okuma paneli POV'da gizleniyor. Lab aracı ürünün eylemini örtmemeli |
| 2026-09-18 | 5.5.9 | **"DOLAYLI SIZINTI"** — three.js ana sayfaya sızdı, `/tr` 215.5 → **318.8 kB gz** | `ZoneGate` sahneyi `next/dynamic` ile yüklüyordu ama `CharacterSelect`'i **statik** import ediyor; o da `drawCapy`'yi `character.ts`'ten alıyor, `character.ts` ise `three` import ediyor. Sahne değil, **seçim ekranı** sızdırdı. Kural 61'in kardeşi: sızıntı ağır kütüphaneyi **dolaylı** çeken bir client component'ten de gelir | Çizim ve açı→görünüm eşlemesi three'siz `lib/zone/capy.ts`'e ayrıldı; `character.ts` oradan tüketip yeniden yayıyor. `/tr` **218.4 kB gz**'ye döndü. `zone-bundle-check` yakaladı — bekçi çalıştı |
| 2026-09-18 | 5.5.9 | **"TEK KAYNAKTAN YÖNETİLMEYEN GLOBAL DURUM"** — perde kapanınca site kaydırılamaz kalıyordu | `html.style.overflow`'u kaydet/geri-yükle kalıbıyla yöneten İKİ yer vardı: Preloader ve `useDialog`. Ölçülen sıra: preloader kilitli → perde açılıyor ve önceki değeri "hidden" olarak saklıyor → preloader bitip `""` yazıyor ve **perdenin kilidini açıyor** → perde kapanırken "hidden"ı geri yazıyor. İki kilitleyici birbirini eziyor | `lib/scroll-lock.ts`: **sayaçlı** kilit. İlk `lock()`'ta konur, **son** `unlock()`'ta kalkar; sıra bozulamaz. Preloader ve `useDialog` ikisi de onu kullanıyor. Kontrol sayaç derinliğini okuyor |
| 2026-09-18 | 5.5.9 | `pnpm lint` 8646 sorun bildirdi | ESLint ölçüm build klasörünü (`.next-build`) tarıyordu; `.next` yok sayılıyor, yenisi değil | `eslint.config.mjs` `globalIgnores`'a `.next-build/**` eklendi |
| 2026-09-18 | 5.5.10 | `visit` panosunun görseli ekran görüntüsünde **boş kutu** çıktı | Görsel aslında yüklenmişti (`complete: true`, 720×720, 4xx yok) — ekran görüntüsü **çözülmeden önce** alınmıştı. Ürün kusuru değil, ölçüm zamanlaması (Kural 60: "ölçtüğün şey ürün mü, ölçüm aracı mı?") | Ekran görüntüsü script'i `img.decode()` bekliyor. Önce ölçüldü, sonra karar verildi — "bozuk görsel" varsayımıyla koda dokunulmadı |
| 2026-09-18 | 5.5.11 | **Karakter seçimi mobil portrede TAŞIYORDU** — ikinci maskot ve "Kiminle gezelim?" başlığı kadraj dışında; 390'da blok 526 px (viewport 390), 360'ta 520 px | `<canvas style={{width:220,height:280}} className="max-md:w-[36vw]">` — **satır içi stil sınıfı ezer**, yani mobil genişlik kuralı 5.5.9'dan beri hiç çalışmamıştı. Niyet doğru, mekanizma yanlış. Hiçbir otomatik kontrol seçim ekranına portre kırılımında bakmıyordu; **yalnız gözle bakma yakaladı** (Kural 59'un yedinci yakalayışı) | Ölçü tamamen sınıfa taşındı: `aspect-[11/14] w-[220px] max-md:w-[36vw]`; `W/H` yalnız piksel tamponunu belirliyor. 526 → **380.9 px** (390'da), 520 → 352.3 (360'ta). Kural 68 yazıldı; `zone-camera-check`'e portre bekçisi eklendi ve **sabotajla doğrulandı** (eski satır içi stil geri konunca 101/103) |
| 2026-09-18 | 5.5.11 | Maskot panosundaki **"TAM SAYFAYA GİT" yanlış yere gidiyordu** — `/about#mascots` sayfanın BAŞINA düşüyordu | `/about` sayfasında `id="mascots"` **hiç yoktu**. Kırık link değil — 200 dönen, doğru sayfaya giden ama yanlış yerde duran link. Durum kodu kontrollerine takılmaz, `smoke`/`lab-check` de yakalamaz | Maskot bölümüne `id="mascots"` + `scroll-mt-[6vw]` (Kural 33 ile aynı çapa dili) |
| 2026-09-18 | 5.5.11 | Joystick'in **"SÜRÜKLE" etiketi bordo dama karelerin üstünde okunmuyordu** | `text-ink/70` — **Kural 40'ın doğrudan ihlali** (metin renginde opaklık yasak). Üstelik zemin sabit değil: altından bordo/krem dama geçiyor, koyu yazı koyu karede kayboluyor. 5.5.7'de eklenmiş, o turda fark edilmemişti | Etiket krem hapın içine alındı (`bg-cream` + `border-berry` + `text-berry-dk`), `FramePrompt`'un künye hapıyla aynı dil. Tüm `src` tarandı: metin renginde opaklık kalan tek yer `disabled:text-berry/30` — devre dışı kontrol, WCAG kontrast şartından muaf, bilerek bırakıldı |
| 2026-09-18 | 5.5.11 | `lab-check` 86/93'e düştü: sepet WhatsApp kontrolü + `/menu` sayı kontrolleri | İkisi de **testin bayatlaması**, üründe kusur yok: ① 5.5.8'de checkout `<a href>` olmaktan çıkıp `submitOrder()` adaptörünü çağıran `<button>` oldu (Kural 66), test hâlâ `getAttribute("href")` okuyordu ② 5.5.1'de içecek kategorisi eklendi (25 → 28 ürün, 6 → 7 kategori), test eski sayıları bekliyordu. **Testler kırmızı yanarak doğru davrandı** — sessizce geçselerdi asıl sorun o olurdu | Checkout kontrolü gerçek yoldan ölçüyor: `window.open` yakalanıp adaptörün açtığı URL denetleniyor. Sayılar 28/7'ye çekildi. **Sabotajla doğrulandı:** adaptörün gönderimi boşa çıkarılınca iki kontrol de düşüyor (91/93) → 93/93 |
| 2026-09-18 | 5.5.11 | Gözle bakma script'i **üç kez yanlış özneyi ölçtü** (Kural 60) | ① `img.decode()` tembel görsellerde ASLA çözülmüyor → script ilk koşuda asıldı ② ekran görüntüsü alınırken **tuşlar hâlâ basılıydı**: karakter PNG kodlama süresince yürüyor, yani konumu ÖLÇÜM ARACININ hızına bağlıydı (1920 dsf1 hızlı, 390 dsf3 yavaş) — kırılımlar farklı halkalara varıyordu ③ "halkadan çık" döngüsü 25 adım yürüyüp karakteri salonun dibine dayıyordu (1440'ta bütün halkalar kaçtı) | ① yalnız **kadrajdaki** görseller, her biri zaman aşımlı ② tuşlar ekran görüntüsünden ÖNCE bırakılıyor ③ çıkış **koşula bağlı ama sınırlı**: prompt sönene kadar, en çok 8 adım. Rota artık salonun bilinen geometrisine dayanıyor ve **açılan panoyu okuyor**, tahmin etmiyor → 4 kırılım × 12 kare × 2 mod, sıfır sorun |
| 2026-09-18 | 5.5.11 | Production konsolunda **uyarı var**: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` | Kaynak **bizim kodumuz değil**: `@react-three/fiber@9.7.0` kendi store'unda `new THREE.Clock()` kuruyor, three r183 `Clock`'u deprecate edip kurulumda uyarı basıyor. 9.7.0 son **kararlı** sürüm (sonrası 10.x canary). Zone her açılışta bir kez. `zone-camera-check` yalnız `error` topladığı, `lab-check` ise Zone'u hiç açmadığı için iki script de görmemişti | `zone-perf-check`'e **birebir metin eşleşen** tek istisna olarak yazıldı (Kural 53: geniş filtre yok, başka hiçbir uyarı gizlenmiyor) ve sayısı raporlanıyor. Kalıcı çözüm bağımlılık kararı — planlayıcıda |
| 2026-09-18 | 5.5.11 | CPU 4× yavaşlatma kare hızını **hiç değiştirmedi** — "throttle çalışmıyor" şüphesi | Şüphe haklıydı ama sonuç gerçekti: ayrı bir sonda throttle'ın uygulandığını kanıtladı (saf JS döngüsü 80 → 326 → 827 ms @ 1×/4×/10×). Sahne CPU'ya bağlı değil; kare başına iş çok küçük | 20× sondası eklendi → 33–36 fps, pay orada bitiyor. **"Beklenmedik sonuç" önce ölçüm aracına sorulur** (Kural 60/65); bu kez araç sağlamdı, ürün gerçekten hızlıydı |
| 2026-09-18 | 5.5.11 | Sipariş tahtasında adet ve TOPLAM **siyah bir leke** gibi görünüyor | `font-display` (Modak) — Modak'ın `0` karakteri dolu bir elips, counter'ı kapalı. 1–9 temiz, **yalnız sıfır**. 40 px'te bile böyle → boyut değil font tasarımı. Tahta açıldığında 15 satırın hepsi `0`, TOPLAM da `0` | **Değiştirilmedi — marka tipografisi kararı planlayıcıda.** Ölçüm yapıldı: `font-ui` ve `font-pixel` sıfırı temiz veriyor. Aynı durum site sepetinin TOPLAM'ında da var (Zone'a özgü değil) |
| 2026-09-18 | 5.5.11 | JSX yorumu `{/* */}` yerine düz `/* */` yazıldı — **`pnpm build` TEMİZ GEÇTİ**, `pnpm lint` yakaladı | `/* ... */` JSX içinde geçerli bir **metin düğümüdür**: derlenir ve ekranda **görünür metin olarak render edilir**. Sipariş tahtasının TOPLAM satırında beş satırlık yorum kullanıcıya gösterilecekti. Build hata vermez çünkü ortada sözdizimi hatası yok | `{/* ... */}` biçimine çevrildi. **Ders: Kural 2'nin "build yetmez" tarafı burada tersine işliyor — build geçiyor ama lint gerekli.** `react/jsx-no-comment-textnodes` tam bu kusur için var; lint'siz zincir kurulmaz. **Kural 2 bu bulguyla revize edildi (2026-09-18): kapı `lint && build`, ikisi farklı sınıf hata yakalar.** |
| 2026-09-18 | 5.5.11 | CPU 20× pay sondası ardışık iki koşuda **14.4** ve **32.8** fps verdi | Sonda 20×'te kare bütçesini zaten taşırıyor; makinedeki her başka yük (ikinci sunucu, paralel tarayıcı) doğrudan sonuca yansıyor. İlk koşu **"FOV 80 pahalıya mal oldu"** diye yorumlanacaktı ve `dpr` 1.5 kolunun "artık işe yaradığı" sonucu çıkarılacaktı — ikinci koşu ikisini de çürüttü | Sondanın oynaklığı hem script'e hem DURUM'a yazıldı: **tek koşusundan sonuç çıkarılmaz, en az üç koşu gerekir.** Hedef senaryolar (1× ve 4×) her koşuda 60 fps / en uzun kare 17.7 ms — kararlı ve anlamlı olan ölçüm odur. Kural 60'ın "oynak kontrol güvenilmez kontroldür" maddesinin sonda hâli |

---

## AGENTS.md

Kokteki `AGENTS.md` dosyasi Next.js tarafindan otomatik uretilir (`next dev` her calistiginda yeniden yazar). Next 16 API farklari icin `node_modules/next/dist/docs/` altindaki rehberleri okumayi hatirlatir. Silme, commite dahil et.
