# İçerik Commit'i — Faz 8 öncesi

CLAUDE.md'yi oku, HATA PROTOKOLÜ ve KURALLAR'a uy. Bu iş bir faz değil, tek bir içerik commit'i; DURUM'a "İçerik commit'i (Faz 7.5)" olarak işle.

## 0. Kaynak dosyalar

Proje kökünde 11 adet `Ekran Resmi 2026-09-17 *.png` var. Önce `docs/source/` altına taşı ve adlandır (`git mv` değil, henüz commit'te değiller — `mv`):

| Dosya (saat) | Yeni ad | İçerik |
|---|---|---|
| 11.20.27 | `menu-print.png` | Basılı menü: MANCH wordmark, fiyatlar, maskot çizimi, MENU wordmark |
| 11.23.15 | `photo-cook.png` | Mutfakta aşçı, mavi tişört sırtında logo — "Behind Every Great Burger" |
| 11.26.39 | `photo-crispy-triangle.png` | Crispy Triangle tabak — "Good Things Come in Triangles" |
| 11.27.43 | `burger-truffle.png` | Truffle Manch (çıtır soğan, truffle aioli) |
| 11.28.23 | `burger-chicken.png` | Chicken Manch (çıtır tavuk, ranch aioli, iceberg) |
| 11.29.42 | `burger-classic.png` | Classic Manch (iceberg, turşu, Manch sos, cheddar) |
| 11.30.13 | `burger-chilli.png` | Chilli Manch (jalapeno turşusu, chili aioli) |
| 11.30.43 | `burger-morel.png` | Morel Burger (portobello, karamelize morel, Manch sos) |
| 11.31.19 | `burger-fig-jam.png` | Fig Jam Burger (kuzu kulağı, incir reçeli, roquefort aioli) |
| 11.31.48 | `burger-tiftik.png` | Manch Tiftik Burger (ağır ateşte pişmiş kaburga, Manch sos) |
| 11.33.40 | `photo-tiramisu.png` | Tiramisu servisi |

`docs/_in/` klasörünü sil (geçici önizleme). `docs/source/` `.gitignore`'a **eklenmez**, commit'e girer (kaynak arşivi).

Bunlar ekran görüntüsü, orijinal değil — çözünürlükleri ölç ve rapora yaz; 1500 px altındaysa TODO'ya "orijinal fotoğraflar istenecek" notu düş.

## 1. Burger fotoğraf düzenleme → `public/burgers/*.png`

Hedef: her burger fotoğrafında **sadece burger kalsın** — karo duvar, pixel-font etiketler, oklar, çizgiler ve burgerin altındaki buruşuk bordo kağıt gidecek. Çıktı: **şeffaf PNG kesit**, kart arka planı CSS'te berry (referans sitedeki kart mantığı: PNG burger + düz renkli kart).

Yöntem (sırayla dene, ilk çalışanı kullan, Kural olarak yaz):
1. `rembg` — makinede `~/.u2net` var, muhtemelen kurulu (`which rembg` / `python3 -m rembg`). Yoksa scratchpad'e `pip install --target` ile kur (proje bağımlılığı değil). Model `isnet-general-use` veya `u2net`; `alpha_matting` açık.
2. Sonuçta en büyük bağlı bileşeni tut (etiket/ok kalıntılarını temizler), kenardan %6 pad, kare kanvas, uzun kenar 1200 px, `public/burgers/<slug>.png`. Ayrıca 600 px `.webp` varyantı.
3. Her çıktıyı berry zemine bindirerek `docs/screens/icerik-burgers.png` kontak tablosu üret; kağıt/karo artığı kalan varsa maskeyi elle düzelt (PIL ile alt kenar temizliği).

7 burger: `classic-manch`, `truffle-manch`, `chilli-manch`, `fig-jam`, `manch-tiftik`, `morel`, `chicken-manch`. Guacamole Burger'ın fotoğrafı yok → Placeholder kalır.

Aynı yöntemle `photo-crispy-triangle` ve `photo-tiramisu` **kesilmez**, olduğu gibi `public/images/` altına `crispy-triangle.jpg`, `tiramisu.jpg` (WebP + uzun kenar 1600).

## 2. Logo → `public/logo/`

`menu-print.png` üstündeki **MANCH** wordmark'ını kırp, arka planı temizle, `potrace` (yoksa `pip install potracer` veya `vtracer`) ile vektörleştir → `logo-manch.svg` (tek path, `fill="currentColor"`). Aynı şekilde alttaki **MENU** wordmark'ı → `logo-menu.svg`. Bitmap yedek: `logo-manch.png` 1600 px şeffaf.

Kullanım yerleri (Modak "MANCH"/"M" metinlerinin yerine):
- Nav logosu (`text-stroke-fill` yerine SVG, `currentColor` ile invert davranışı korunur, hover:scale-105)
- Footer dev wordmark
- `opengraph-image.tsx`: berry zemin + beyaz SVG wordmark + slogan
- `icon.tsx` / `apple-icon.tsx`: berry zemin + wordmark'ın **"M"** harfi (SVG'den kırp)
- Preloader ve PageTransition ortası ("MANCHING…" metni kalır, üstüne küçük wordmark)
- `/menu` sayfa başlığında `logo-menu.svg`

Maskot: `menu-print.png` sağ alttaki capybara çizimini (ızgara başında Misu & Miyu) kırp, arka plan temizle → `public/images/misu-miyu.png` (şeffaf). MisuMiyu section ve 404 sayfası bunu kullanır. Not: çözünürlük düşük (menü ~750 px genişlik) — TODO'ya "maskot vektör/orijinal istenecek".

## 3. Menü verisi → `src/data/menu.ts` (basılı menüden, birebir)

Eski tahmini ürünleri (Berry Manch, Köz Biberli Smash, Truffle Smash, Chicken Sandwich, çilekli, `unconfirmed` olanlar) **sil**. Fiyatlar TL, `price: number`. Her burgerde `ingredients.tr` menü metninden, `ingredients.en` çeviri. Tüm burgerler: el yapımı brioche + el yapımı patates kızartması ile servis (desc'e).

**BURGERS**
| slug | Ad | Fiyat | Malzeme (TR) | Görsel | tags |
|---|---|---|---|---|---|
| classic-manch | Classic Manch Burger | 570 | 2×60 gr köfte, Manch sos, iceberg, salatalık turşusu, cheddar | ✓ | signature |
| truffle-manch | Truffle Manch Burger | 730 | 2×60 gr köfte, truffle aioli, çıtır soğan, cheddar | ✓ | signature |
| chilli-manch | Chilli Manch Burger | 590 | 2×60 gr köfte, chili aioli, jalapeno turşusu, cheddar | ✓ | spicy |
| fig-jam | Fig Jam Burger | 650 | 2×60 gr köfte, roquefort aioli, incir reçeli, kuzu kulağı, cheddar | ✓ | signature |
| manch-tiftik | Manch Tiftik Burger | 790 | 2×60 gr köfte, Manch sos, cheddar, ağır ateşte pişmiş tiftik kaburga | ✓ | new |
| guacamole | Guacamole Burger | 690 | 2×60 gr köfte, romesco aioli, guacamole, cheddar, çıtır kapari | ✗ | — |
| morel | Morel Burger | 790 | 2×60 gr köfte, Manch sos, karamelize morel ve portobello mantarı, cheddar | ✓ | signature |
| chicken-manch | Chicken Manch Burger | 430 | çıtır tavuk, ranch aioli, iceberg, salatalık turşusu | ✓ | — |

Quick details: süre 12–15 dk · ekmek Brioche · köfte 2×60 gr dana (chicken: çıtır tavuk) · acılık Mild (chilli: Hot).

**SOSLAR**: Ranch Sauce 40 · Sarımsaklı Aioli 40 · Manch Sos 40 · Trüf Aioli 45 · Chilli Aioli 45 · Rokfor Aioli 45
**EXTRAS**: Tiftik Kaburga 180 · Smash Et 180 · Truffle Parmesan 90 · Cheddar 35
**FRIES**: Classic Manch Fries 160 · Truffle Manch Fries 260
**ATIŞTIRMALIKLAR**: Corn Ribs 290 (garlic aioli ile) · Crispy Chicken Tenders 290 (ranch aioli ile) · 6 Mantarlı Arancini 360 (parmesan; kültür, shiitake, morel, portobello, istiridye ve trüf mantarı; porsiyonda 2 adet) · Crispy Triangle (fiyat menüde yok → `price: null`, görsel ✓)
**TATLI**: Tiramisu 360 (görsel ✓)

Kategori sırası ve `/menu` sekmeleri: Burgers · Soslar · Extras · Fries · Atıştırmalıklar · Tatlı. `featured` (ana sayfa 6): classic, truffle, chilli, fig-jam, manch-tiftik, morel.

Sepet: fiyat artık var → drawer'da satır toplamı + genel toplam, WhatsApp mesajında tutar. `Common.priceTodo` kullanılmıyorsa kaldır.

## 4. Marka sabitleri → `src/lib/site.ts` + messages

- Telefon: `+90 505 497 07 48` (görünen: `0505 497 07 48`, `tel:+905054970748`)
- WhatsApp: aynı numara → `https://wa.me/905054970748` — checkout ve Zone CTA artık aktif, `checkoutSoon` kaldır
- E-posta: `manch.burger.coffee@gmail.com`
- Facebook: `https://www.facebook.com/manch.tr/`
- Menü alt başlığı (basılı menüden): "BURGER . FRIES . ATIŞTIRMALIK . TATLI" — `/menu` hero'suna
- Çalışma saatleri hâlâ yok → "Yakında" kalır
- Tüm `[TODO] ` önekleri messages'tan kaldırılır; kalan placeholder'lar (saat, galeri) düz "Yakında"
- JSON-LD: `telephone`, `email`, `sameAs` (Instagram + Facebook) eklenir; `menu` URL zaten var

## 5. Fotoğrafların yerleşimi

- **Hero**: `photo-cook.png` → `public/images/hero-cook.jpg` (WebP), tam ekran, üstüne koyu berry gradient (%40), hardal başlık kalır; `HeroBurger` CSS burger kaldırılır, yerine `classic-manch.png` kesiti sağda Float ile (desktop), mobilde gizli. `BrandImage` (Faz 8'de gelecek) yoksa şimdilik `next/image` doğrudan, `priority`.
- **Handmade** section: `photo-cook` yerine sos/köfte fotoğrafı yok → kesit burger + KraftCard kalır.
- **InstagramGrid** (6): `photo-cook`, `photo-crispy-triangle`, `photo-tiramisu` + `burger-classic`, `burger-fig-jam`, `burger-truffle` kesitleri sky-blue zeminde. Her kare `@manch.tr`'ye link.
- **ProductCard / ProductModal**: `image` alanı → `public/burgers/<slug>.png`, `object-contain`, berry kart zemini; Guacamole ve fotoğrafsızlar Placeholder.
- **/menu** kategori başlıkları: Tatlı → `tiramisu.jpg`, Atıştırmalık → `crispy-triangle.jpg` küçük kapak görseli.
- **About / Zone galerisi**: Placeholder kalır (iç mekan fotoğrafı yok) — TODO.
- **OG**: wordmark + `burger-classic` kesiti sağda.

Tüm görseller `next/image`, `sizes` doğru, `alt` messages'tan. `Placeholder` yalnızca görseli olmayan yerlerde.

## 6. Kabul

- `pnpm build` + `pnpm lint` temiz; `scripts/lab-check.mjs` geçiyor (fiyatlı sepet ve WhatsApp link testleri güncellenir: `wa.me/905054970748` + mesajda toplam)
- Lighthouse A11y/SEO 100 korunuyor (`scripts/lighthouse.mjs`)
- `docs/screens/icerik-burgers.png` (7 kesit kontak), `icerik-home.png`, `icerik-menu.png`, `icerik-og.png`
- messages'ta hiç `[TODO]` kalmadı (`grep` ile doğrula)

Her hatada önce CLAUDE.md'yi revize et. Bitince checkbox/DURUM/TODO güncelle, commit: `content: menu, fotograflar, logo ve iletisim`. Sonra dur, aynı formatta rapor ver. Faz 8'e geçme.
