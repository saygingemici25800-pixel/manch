# MANCH — Claude Code Build Prompt

> Aşağıdaki her şeyi Claude Code'a tek seferde yapıştır. Proje klasöründe (`~/Projects/manch`) çalıştır.

---

## 0. ROL & HEDEF

Sen kıdemli bir creative developer + marka editörüsün. Fethiye'deki smash burger markası **MANCH** için ödül-kalitesinde, animasyon ağırlıklı, iki dilli (TR varsayılan / EN) bir web sitesi kuracaksın. Hareket dili ve etkileşim kalitesi referans olarak **cravburgers.shop** (Anyflow Agency) ile birebir aynı seviyede olacak — ama görsel kimlik tamamen MANCH'e ait olacak (renk, maskot, dama deseni, karo duvar, el yapımı vurgusu). Kopya değil, aynı "his".

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · GSAP 3 (+ ScrollTrigger, SplitText, CustomEase) · Lenis (smooth scroll) · next/font (Google) · next-intl (tr/en) · Zustand (sepet/sipariş listesi) · pnpm · Vercel.

**Kural:** Push'tan önce her zaman `pnpm build` tam çalıştır; sadece tsc + lint yetmez.

---

## 1. MARKA BİLGİLERİ (Instagram @manch.tr'den derlendi)

| Alan | Değer |
|---|---|
| İsim | MANCH |
| Kategori | Fast Food Restoranı / Smash Burger |
| Slogan (ana) | **United Chill Burger Zone** |
| Slogan (ikinci) | **Handmade Hits Different** |
| Hashtag | #Manch #HandmadeHitsDifferent #Fethiye |
| Adres | Çarşı Cd. 21/b, Fethiye 48300 (Paspatur – Tarihi Çarşı) |
| Instagram | https://www.instagram.com/manch.tr/ |
| Facebook | "MANCH" sayfası (linki bio'dan al) |
| Maskotlar | **Misu & Miyu** — "MANCH'in yüzleri" (logodaki burger tutan kapibara-benzeri sevimli karakterler; ince bordo line-art) |
| Duvar yazısı | **"THE BURGER YOU'LL CRAVE AGAIN"** (açık mavi karo duvar üzerinde bordo büyük harf) |
| Açılış | Haziran 2026 ("çok yakında Fethiye'de" teaser'ları → Temmuz başı açık) |
| Telefon / saatler / sipariş linki | **PLACEHOLDER** — `lib/site.ts` içinde `TODO` olarak bırak |

### Marka sesi (caption'lardan)
Kısa, esprili, biraz "cool", 😏 tonunda. Her metin **TR + EN** çift. Örnek cümleler (sitede kullan):
- "Smash sesi mutfaktan, ilk ısırık masadan." / "Smash from the kitchen, first bite from the table."
- "Aç değiliz. Sadece takıntılıyız." / "Not hungry. Just obsessed."
- "Hazır soslara biraz uzağız." / "We like our sauces handmade."
- "Yer çekimi onaylı cheese pull." / "Gravity approved cheese pull."
- "Lezzet seviyesi biraz kontrolden çıkmış olabilir." / "Flavor levels may have gotten a little out of control."
- "MANCH alışkanlığı yükleniyor…" / "MANCH habit: loading…"
- "Smash'inin katmanlarıyla tanış. Hepsi el yapımı. Hepsi bir sebepten burada." / "Meet the layers of your smash. Handmade in every layer."
- "Tiramisu konusunda biraz iddialıyız." / "We take tiramisu seriously."
- "Bu yolculuğun en güzel yanı? Varış noktası." / "The best part of the journey? The destination."
- "Tarzına yakışan smash!" (Classic Manch Burger)
- Poster sloganları: "Juicy Center · Crispy Edges · Perfect Melt", "Just Another Chill Lunch", "The Sweetest Work in Progress"

### Menü (bilinen ürünler — fiyatlar PLACEHOLDER)
`data/menu.ts` içinde tip güvenli tut. Kategoriler: **Smash Burgers · Chicken · Sides · Tatlılar · İçecekler**

1. **Classic Manch Burger** — "Tarzına yakışan smash!" — double smash köfte, cheddar, turşu, soğan, marul, Manch sos, tereyağlı brioche.
2. **Berry Manch** — El yapımı tereyağlı brioche · 120 gr burger köftesi · Roquefort aioli · Yaban mersini reçeli · Berry sos (mor sos — markanın imza görseli) · Kuzu kulağı · 2 adet cheddar peyniri — *"Yoğun, dengeli ve özgün bir lezzet."*
3. **Köz Biberli Smash** — ev yapımı köz biber sosu ("Köz biberli sosumuzu MANCH mutfağında kendimiz hazırlıyoruz").
4. **Truffle Smash** (postta truffle görseli var — isim teyit edilecek).
5. **Crispy Chicken Tenders** — ranch/otlu dip sos ile.
6. **Chicken Sandwich** (teyit edilecek).
7. **Patates Kızartması** (tepside kağıt külahta).
8. **Tiramisu** — gerçek mascarpone, ipeksi krema. 🩵
9. **Çilekli tatlı / içecek** (teyit edilecek) · **Limonata / ev yapımı içecekler** · **Soft drinks**.

Her üründe: `name`, `slug`, `desc{tr,en}`, `ingredients[]`, `price` (TODO), `tags` (spicy/new/signature), `image`, ve CRAV'daki gibi **"Quick details"**: hazırlık süresi, ekmek (Brioche), köfte (Dana 120g), acılık (Mild/Hot).

---

## 2. GÖRSEL KİMLİK

### Renk tokenları (logodan pipetle birebir doğrula)
```css
--berry:    #7A1F4B;  /* MANCH bordo/mürdüm – logo, duvar yazısı, dama */
--berry-dk: #4E1030;  /* koyu varyasyon, footer bg */
--sky:      #C4E4F3;  /* logo zemini açık mavi */
--tile:     #8FC3D6;  /* karo duvar mavisi */
--cream:    #F4EEE6;  /* mermer masa / kağıt */
--paper:    #E9DCC6;  /* kraft menü kartı */
--pink:     #E9A3B8;  /* pembe dama kağıt */
--mustard:  #F6C343;  /* cheddar – CTA vurgu */
--ink:      #1B1B1B;
```
Referans CRAV paleti (sadece oran/his için): kırmızı #F91814, bej #F5E3CD, hardal #FFD750, turuncu #EF6F2E, amber #F4A804, bordo #4C0016. MANCH'te kırmızının yerini **berry**, bejin yerini **cream/sky** alıyor.

### Tipografi
Referans: **Modak** (şişkin display, logo/başlık) + **Mouse Memoirs** (dar, uppercase UI & gövde). Aynısını kullan:
- `font-display`: **Modak** — hero, section başlıkları, preloader "MANCHING…"
- `font-ui`: **Mouse Memoirs** — nav, buton, fiyat, gövde, uppercase + tracking-wide
- `font-pixel` (MANCH'e özel aksan): **Silkscreen** veya **Press Start 2P** — "Tarzına yakışan smash!" ve kayan bant (tape) yazıları için (MANCH postlarındaki köşeli pixel font)
- Türkçe karakterleri (ğ ş ı İ ç ö ü) her fontta test et; eksikse fallback tanımla.
- Tüm ölçüler CRAV gibi **vw tabanlı** (`text-[1.3vw] max-md:text-[4vw]`), `heading180`, `text40` gibi utility'ler yaz.

### Desen & doku
- **Bordo-beyaz dama (checkerboard)** şeritler — section ayırıcı.
- **Pembe dama kağıt** — ürün kartlarında tabak altı.
- **Açık mavi karo duvar** grid'i (CSS background ile) — About/Zone section zemini.
- **Kraft kağıt menü kartı** (hafif eğik, gölge) — ürün detay modalında malzeme listesi.
- **Tepsi kağıdında Misu & Miyu line-art** deseni — footer/sepet arka planı (SVG pattern).
- Hafif film grain overlay (opacity .06).

### Görseller
`public/images/` altına Instagram'dan kullanıcı tarafından indirilecek fotoğraflar için yer tut:
`hero-smash.jpg, berry-manch.jpg, classic-manch.jpg, tenders.jpg, fries.jpg, tiramisu.jpg, sauce-pour.jpg (mor sos sıkılan brioche), wall-crave.jpg, interior-1..3.jpg, misu-miyu.png, logo.svg`
Yoksa şık bordo/sky blok placeholder göster (kırık görsel asla). Burger kesitleri için arka planı temizlenmiş PNG'ler (`/burgers/*.png`).

---

## 3. REFERANSTAN ALINACAK ETKİLEŞİMLER (cravburgers.shop analizi — birebir uygula)

1. **Preloader** — tam ekran renk zemin + altta Mouse Memoirs ile dönen mesajlar ("TOASTING THE ARTISAN BUN…"). MANCH: `"BRIOCHE KIZARIYOR…" → "KÖFTE SMASH'LENİYOR…" → "CHEDDAR ERİYOR…"` (EN: "Toasting the brioche… / Smashing the patty… / Melting the cheddar…"). Altta ince ilerleme çubuğu.
2. **Sayfa geçişi (curtain)** — 3 katmanlı SVG perde, `path` morph ile alttan yukarı dalgalı (`Q` kontrol noktası) kapanır: katman renkleri CRAV'da `#F91814 → #EF6F2E → #F4A804`; MANCH'te `berry → pink → mustard`. Ortada Modak ile **"MANCHING…"** (CRAV: "Craving…"), stagger 0.08s, ease `power4.inOut`, ~1.1s. Sonra aynı sırayla yukarı açılır.
3. **Dinamik sekme başlığı** — sayfa geçişinde `document.title` sırayla değişir: "Menu | Flipping" → "Menu | Serving". MANCH: "Menü | Smash'leniyor" → "Menü | Servis".
4. **Nav** — fixed, `px-[2.5vw] py-[1vw]`; solda Modak logo (text-stroke, hover:scale-105); sağda dolu hap buton "BURGERS" + çerçeveli hap "MENU" (hamburger ikon 3 çizgi, ortadaki %70 genişlik → açılınca X'e morph). Koyu section üzerindeyken (`data-nav-dark`) renk invert. Aşağı scroll'da gizlen, yukarıda göster.
5. **Tam ekran menü overlay** — `bg-berry/30 backdrop-blur-md` + büyük Modak linkler (HOME / MENÜ / HAKKIMIZDA / ZONE / KONUM / İLETİŞİM), SplitText ile satır-mask reveal, altta "EST. 2026 — FETHİYE, TÜRKİYE".
6. **Hover text roll (her buton & link)** — `overflow-hidden` span içinde iki kopya metin; hover'da üstteki `-translate-y-full`, alttaki `translate-y-0`, 300ms. Buton `hover:scale-105`, renk bg-black'e geçer.
7. **Blob CTA butonu** — "ORDER NOW / SİPARİŞ VER": organik SVG blob path (`viewBox -10 -10 602 475`, beyaz 10px stroke, dolgu berry), hover'da fill değişir ve path hafif wobble (GSAP morph ya da scale jitter).
8. **Custom cursor (desktop)** — beyaz 2px stroke ile çizilen **iz (trail) path** + imlecin yanında buzlu cam daire içinde malzeme ikonu (marul, domates, peynir, köfte döngüsü). Butonların üzerinde `data-cursor-hide` ile gizlenir. Mobilde kapalı.
9. **Hero** — tam ekran burger fotoğrafı (object-cover), üstünde dev hardal Modak başlık **"HANDMADE HITS DIFFERENT"** SplitText char-by-char yukarı giriş; üzerinde sticker gibi dönen Misu&Miyu rozeti (CRAV'daki "smile" rozeti yerine). Alt kenarda **jelly SVG dalga** (`path` fill = sonraki section rengi, scroll hızına göre `scaleY 1→1.08` elastik esneme, transform-origin bottom).
10. **Section başlık kalıbı** — küçük Modak üst başlık ("THE HITS" / "EN SEVİLENLER") + büyük Mouse Memoirs başlık berry renkte + sağda "9 ÜRÜN" sayacı.
11. **Ürün kartları** — 3 kolon grid (`gap-[2vw]`, mobil 1 kolon), `h-[35vw] rounded-[2vw] bg-white`. ScrollTrigger ile `y:64 → 0, opacity 0→1` stagger. Kart ortasında **2 sıra 12'li dama bandı** (CRAV kırmızı/beyaz → MANCH berry/beyaz); hover'da bant `cubic-bezier(.4,1.6,.7,.95)` 0.44s ile esneyip kayar ve kareler renk değiştirir; burger PNG hafif döner + büyür. Altta isim (berry), fiyat, "QUICK DETAILS" açılır paneli (süre / ekmek / köfte / acılık) ve sağda yuvarlak hardal "+" sepete ekle butonu.
12. **Sepete ekle** — "ADDED TO CART / SEPETE EKLENDİ" toast (ortada, blur zemin); sağ altta sabit yuvarlak berry sepet butonu + hardal sayı rozeti (bounce). Sepet drawer'ı: kraft kağıt görünümü, "CHECKOUT" → WhatsApp'a sipariş mesajı oluştur (numara TODO).
13. **"FEEL THE CHANGE" bloğu → MANCH: "UNITED CHILL BURGER ZONE"** — `pt-[18vw]` üst boşluk, üst kenarı dalgalı, sol büyük başlık + paragraf + blob CTA, sağda kesit burger görseli parallax. Arka planda karo duvar.
14. **Marquee / tape** — pixel font ile "CRISPY CHICKEN TENDERS — HANDMADE HITS DIFFERENT — " bordo bant, -4° eğik, iki bant zıt yönde; scroll hızına göre hızlanır.
15. **Katman patlatma (Smash anatomisi)** — pinned section: burger katmanları (brioche üst, sos, cheddar, köfte x2, turşu, marul, brioche alt) scroll'la dikey açılır, her katmanın yanında etiket belirir. Başlık: "Smash'inin katmanlarıyla tanış."
16. **Cookie banner** — alt ortada `w-[32vw]` kart, hardal nokta ikon, "LATER / OKAY!" hap butonlar.
17. **Konsept/iletişim modal** — CRAV'daki "Checkout" modal kalıbı: iletişim & rezervasyon bilgisi, "ACKNOWLEDGE & CLOSE".
18. **Footer** — nav linkleri `text40` Modak, SplitText line-mask reveal + hover text roll; dev "MANCH" wordmark; malzeme ikonları (marul/domates/peynir/köfte) fizik benzeri **juggle** (`--juggle-scale`) animasyonu; "SMASHED PATTIES · TOASTED BRIOCHE · EST. 2026 · FETHİYE"; "© 2026 MANCH — TÜM HAKLARI SAKLIDIR"; "Designed & developed by Webber Digital".
19. **Lenis** smooth scroll (`html.lenis`), GSAP ticker'a bağlı; `prefers-reduced-motion` açıksa tüm ağır animasyonlar kapanır.

---

## 4. SAYFA YAPISI

```
/[locale]            Ana sayfa
  Hero (HANDMADE HITS DIFFERENT)
  Marquee tape
  The Hits (6 imza ürün kartı)
  Smash Anatomy (pinned katman)
  Handmade (el yapımı sos/brioche hikayesi — "Hazır soslara biraz uzağız")
  United Chill Burger Zone (karo duvar, iç mekan galerisi, "THE BURGER YOU'LL CRAVE AGAIN")
  Misu & Miyu (maskot tanıtım, hafif idle animasyon)
  Instagram grid (6 statik görsel + @manch.tr CTA)
  Konum (Çarşı Cd. 21/b — Google Maps embed, saatler TODO)
  Footer
/[locale]/menu       Tam menü (kategori sekmeleri sticky, filtre, kartlar, sepet)
/[locale]/about      Hikaye + maskotlar + zone
/[locale]/contact    İletişim, harita, WhatsApp
```

---

## 5. TEKNİK GEREKSİNİMLER

- `lib/site.ts` → tüm marka sabitleri (isim, adres, sosyal, telefon TODO, saatler TODO).
- `data/menu.ts` → tip güvenli menü; `messages/tr.json`, `messages/en.json`.
- `components/motion/` → `Preloader`, `PageTransition`, `SplitReveal`, `JellyWave`, `RollText`, `BlobButton`, `CursorTrail`, `Marquee`, `CheckerBand`, `Juggle`.
- SEO: metadata, OG görseli, `Restaurant` JSON-LD (adres, servesCuisine: "Burgers", menu URL), sitemap, robots.
- Performans: next/image, AVIF/WebP, fontlar `display: swap`, LCP < 2.5s, GSAP'i dinamik import et.
- Erişilebilirlik: kontrast, focus ring (hardal), aria-label'lar, tekrar eden hover kopyalarında `aria-hidden`.
- Responsive: tüm vw değerlerinin `max-md:` karşılığı; mobilde cursor kapalı, kartlar 1 kolon, nav tek hap + menü.

---

## 6. ÇALIŞMA SIRASI

1. `pnpm create next-app manch --ts --tailwind --app --src-dir` → bağımlılıklar (gsap, @gsap/react, lenis, next-intl, zustand).
2. Tokenlar, fontlar, utility class'lar (`heading180`, `text40`, `text-stroke-small`).
3. Motion primitive'leri (bölüm 3) → izole test sayfası `/lab`.
4. Layout: Preloader + PageTransition + Nav + MenuOverlay + Cursor + Cart + Cookie + Footer.
5. Ana sayfa section'ları → menü sayfası → about → contact.
6. i18n metinleri (bölüm 1'deki TR/EN cümleler).
7. `pnpm build` → hatasız olana kadar düzelt → Lighthouse kontrol.
8. `git init` → GitHub `webber-digital/manch` repo → Vercel'e bağla (auto-deploy) → preview URL'yi raporla.

Bitirdiğinde: yapılanlar, TODO listesi (fiyatlar, telefon, saatler, gerçek görseller, sipariş linki) ve preview linki.
