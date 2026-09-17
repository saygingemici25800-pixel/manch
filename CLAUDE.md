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

- Aktif faz: **Faz 4 tamamlandı** — Faz 5 için kullanıcı onayı bekleniyor
- Son başarılı build: 2026-09-17 Faz 4 (`pnpm build` + lint temiz; prod `/tr` 200 / `/lab` 404; `scripts/lab-check.mjs` 31/31)
- Preview URL: —
- Açık TODO'lar: fiyatlar · telefon · çalışma saatleri · WhatsApp/sipariş linki · gerçek görseller · logo SVG · renk kodlarının logodan teyidi · Truffle Smash / Chicken Sandwich / çilekli ürün isim teyidi · Facebook linki · Webber Digital URL · `NextIntlClientProvider` mesaj daraltma (namespace bazlı) → **Faz 8'e ertelendi** (karar 2026-09-17) · `not-found.tsx` `[locale]` altında yok (Faz 6) · Nav "BURGERS" hap butonu ve overlay/footer'daki `/menu` `/about` `/contact` linkleri Faz 6'ya kadar 404 (BURGERS geçici olarak `/`) · WhatsApp checkout `site.contact.whatsapp` null → disabled · InfoModal'da telefon/saat "Yakında" · Ana sayfa placeholder'ı hâlâ yeni fontları kullanmıyor (Faz 5'te yeniden yazılacak) · Malzeme ikonları (marul/domates/peynir/köfte) Faz 7'de **berry tek çizgi line-art SVG** olarak çizilecek; şimdilik renkli daire/kare (karar 2026-09-17)

---

## 📏 KURALLAR

1. Paket yöneticisi **pnpm**. npm/yarn kullanma.
2. Push'tan önce **mutlaka tam `pnpm build`**. tsc + lint tek başına yetmez.
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
18. `font-pixel` = **Silkscreen** (karar 2026-09-17). ğşıĞŞİ içermediği için **sadece İngilizce metinlerde** (tape/marquee) kullanılır; TR metne asla uygulanmaz, `font-ui`'ye de düşülmez. Press Start 2P projeden kaldırıldı.
19. Modak / Mouse Memoirs'ta eksik TR karakter varsa fallback zinciri `@theme` font token'ında tanımlanır (`--font-display: var(--font-modak), <fallback>, ...`); `/lab` sayfasında eksik karakterler görünür şekilde işaretlenir.
20. Git kimliği repo-local: `Webber Digital <saygingemici25800@gmail.com>` (karar 2026-09-17).
21. Yeni bir font eklerken TR kapsamını `latin-ext` etiketine güvenmeden doğrula: build sonrası `.next/static/media/*.woff2` dosyalarında cmap union'ı (fontTools) **ve** `/lab` GlyphCheck. Fontlar tek dosyada: `src/styles/fonts.ts`; token listesi `src/styles/tokens.ts` `globals.css` ile senkron tutulur.
22. Tailwind v4: renkler `@theme`, next/font değişkenlerini tüketen font tokenları `@theme inline`. Özel sınıflar `@utility` ile; `max-md:` karşılığı utility içinde `@media (width < 48rem)`.
23. `/[locale]/lab` sadece development: sayfa başında `if (process.env.NODE_ENV === "production") notFound()`. Production build'de lab 404 döner; lab doğrulaması `next dev` ile yapılır.
24. Smooth scroll: **`lenis/react`** (`<ReactLenis root options={{ autoRaf:false }}>` + `useLenis`) — manuel `new Lenis()` değil. Gerekçe: `useLenis` context'i Marquee/JellyWave'in scroll `velocity` okuması için hazır; instance lifecycle'ı React'e bağlı; raf `gsap.ticker`'a **`<ReactLenis>` içindeki çocuk `LenisTicker` component'inde `useLenis()` ile** bağlanır — `ref.current.lenis` mount anında `undefined`dır, ona güvenme (`lenis.on("scroll", ScrollTrigger.update)`, `lagSmoothing(0)`). Sistem reduced-motion'ı Lenis kendisi izler; lab override'ı için `lerp` elle 1 yapılır.
25. React Compiler lint kuralları aktif (`react-hooks/refs`, `react-hooks/immutability`, `react-hooks/set-state-in-effect`): effect içinde **senkron `setState` yok** (türetilmiş değer kullan ya da `setTimeout(fn, 0)` ile ertele, cleanup'ta temizle); closure'larda `ref.current` **okumak da yazmak da** yasak — closure'larda `document.title =` gibi global mutasyon ve modül-seviyesi `let` ataması da yasak → hepsi ayrı modülde plain fonksiyon (`src/lib/transition-title.ts`), closure sadece çağırır; `ref.current`'i render'da **ve render'da çağrılan closure'larda** (`contextSafe(...)` dahil) okuma → GSAP hedefini `useGSAP({ scope })` selector'ıyla ver (`".wrap"`, `"path"`); dinamik element için `createElement(as, { ref })` değil `const Tag = as; <Tag ref={ref}>`; kütüphane nesnesi mutasyonunu (`lenis.options.x = …`) modül-seviyesi helper fonksiyona taşı.
26. Her motion primitive `useReducedMotion()` okur (`src/lib/hooks/useReducedMotion.ts` = sistem tercihi ∨ `useMotionStore.forceReduced`), `true` ise GSAP kurmadan statik render eder. GSAP eklentileri sadece `src/lib/gsap.ts` üzerinden import edilir (tek `registerPlugin`).
27. CursorTrail: `data-cursor-hide` **sadece açıkça işaretlenen** elementlerde (BlobButton, hap butonlar, nav). Otomatik `button, a` selector'ı yok — her yeni etkileşimli bileşen kendi karar verir (karar 2026-09-17).
28. Marquee metinleri iki dilde de İngilizce (`Motion.marqueeItems` / `Home.marquee*` tr.json'da da EN) — Kural 18'in sonucu (karar 2026-09-17).
29. PageTransition: React `<ViewTransition>` / View Transitions API **kullanılmıyor** — snapshot crossfade'i canlı GSAP path morph'u ve "eski sayfayı perde kapanana kadar tut" akışını veremez. Yol: `TransitionLink` (next-intl `Link` + `onNavigate` → `preventDefault`) → `useTransitionStore.trigger(href)` → perde kapanır → `router.push` → `usePathname` değişince perde açılır; 4 s fallback. Reduced motion / hash / aynı sayfa: normal navigasyon. Tüm iç linkler `TransitionLink`.
30. `persist` (localStorage) store'ları SSR'da boş; badge/sayaç gibi çıktılar `useHydrated()` sonrası render edilir (hydration uyuşmazlığı yok). Preloader `sessionStorage`, cookie `localStorage` sadece effect'te okunur.
31. Koşullu `null` render eden client component'te `useGSAP({ scope })` kullanma: ref effect içinde okunur, yoksa erken çıkılır, hedefler element olarak verilir. Aksi halde bağımlılık değişince "Invalid scope" uyarısı.

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
| Açılış | 2026 yazı |
| Telefon / saat / sipariş | TODO |

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

**Renkler** (logodan teyit edilecek):
```
berry #7A1F4B · berry-dk #4E1030 · sky #C4E4F3 · tile #8FC3D6
cream #F4EEE6 · paper #E9DCC6 · pink #E9A3B8 · mustard #F6C343 · ink #1B1B1B
```
**Fontlar:** Modak (`font-display`) · Mouse Memoirs (`font-ui`, uppercase, tracking-wide) · Silkscreen (`font-pixel`, tape/aksan). TR karakterleri test et.
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
| R15 | SmashAnatomy | Pinned, katmanlar scroll'la ayrılır + etiketler |
| R16 | CookieBanner | alt orta kart, LATER / OKAY! |
| R17 | InfoModal | iletişim/rezervasyon, "ANLADIM & KAPAT" |
| R18 | Footer | Modak linkler + line-mask + RollText, dev MANCH wordmark, zıplayan (juggle) malzeme ikonları, "Designed & developed by Webber Digital" |
| R19 | SmoothScroll | Lenis + GSAP ticker, reduced-motion desteği |

---

## 4. FAZLAR

### Faz 1 — Kurulum & Altyapı
- [x] Proje klasörü içinde (`~/Projects/manch`, içinde sadece `docs/` var): `pnpm create next-app@latest . --ts --tailwind --app --src-dir --eslint --import-alias "@/*" --use-pnpm` *(revize: 2026-09-17 — `--no-turbopack --skip-install` eklendi; scaffold Next 16.3.5 kuruyor; `--no-turbopack` sadece script'e bayrak eklemiyor, Next 16'da build zaten Turbopack)*
- [x] `docs/CLAUDE.md` dosyasını köke taşı; scaffold'un ürettiği `CLAUDE.md` (`@AGENTS.md`) önce silinir, `AGENTS.md` yerinde bırakılır *(revize: 2026-09-17)*
- [x] Bağımlılıklar: `gsap @gsap/react lenis next-intl zustand clsx`
- [x] Klasörler: `src/{app/[locale],components/{layout,sections,motion,ui},data,lib,messages,styles,i18n}`, `public/{images,burgers,icons}` *(revize: 2026-09-17 — `src/i18n/` eklendi: next-intl `routing.ts` / `navigation.ts` / `request.ts`)*
- [x] next-intl: `tr` (varsayılan) + `en`, **`src/proxy.ts`** (Next 16'da `middleware.ts` deprecated), `[locale]` layout *(revize: 2026-09-17)*
- [x] `src/lib/site.ts`, `src/data/menu.ts` (bölüm 2), `messages/tr.json` + `en.json` iskeleti
- [x] Git init, `.gitignore`, ilk commit
- [x] ✅ Kabul: `pnpm build` temiz, `/tr` ve `/en` açılıyor

### Faz 2 — Tasarım Sistemi
- [x] Tailwind v4 `@theme`: renk tokenları, font değişkenleri (`src/styles/globals.css`, JS aynası `src/styles/tokens.ts`)
- [x] next/font: Modak, Mouse Memoirs, Silkscreen (latin-ext) — Silkscreen ğşıĞŞİ içermez, sadece EN metinlerde (Kural 18; Press Start 2P denendi ve karar ile kaldırıldı) *(revize: 2026-09-17)*
- [x] Utility'ler: `heading180`, `text40`, `text-stroke-small`, grain overlay
- [x] Desen component'leri: `CheckerBand`, `TileWall`, `KraftCard`, `Placeholder` (`src/components/ui/`) + `GlyphCheck` (client, canvas TR glyph testi) *(revize: 2026-09-17)*
- [x] `/[locale]/lab` sayfası: tüm token/font/desen önizlemesi, TR karakter testi; production'da 404 (Kural 23), ekran görüntüsü `docs/screens/faz-2-lab.png`
- [x] ✅ Kabul: lab sayfası doğru render, build temiz

### Faz 3 — Motion Primitive'leri
- [x] R19 SmoothScroll provider (`lenis/react` + GSAP ticker, Kural 24; `[locale]/layout.tsx`'te)
- [x] R6 RollText · R7 BlobButton · R14 Marquee (scroll hızıyla `timeScale`) · SplitReveal (chars / lines `mask`, `autoSplit`) — `src/components/motion/`
- [x] R9 JellyWave (Lenis `velocity` → `quickTo scaleY`) · R8 CursorTrail (hover+fine pointer, `data-cursor-hide`) · R18 Juggle (`--juggle-scale`)
- [x] Hepsi `/lab` "Motion" bölümünde demo; `useReducedMotion` hook + Zustand override ile emülasyon toggle'ı; `ScrollTrigger.getAll().length` göstergesi *(revize: 2026-09-17)*
- [x] ✅ Kabul: Playwright (headless Chromium) — console 0 hata/uyarı; ST sayısı 2 → reduced'da 0 → 2; `/tr/lab`↔`/en/lab` ×10 ve `/tr/lab`↔`/tr` ×10 sonrası hep 2 (leak yok). `docs/screens/faz-3-lab.png`, `faz-3-motion.webm`

### Faz 4 — Global Layout
- [x] R1 Preloader (`src/components/layout/Preloader.tsx`: ilk render "yükleniyor", sessionStorage effect'te, 3 mesaj + progress, Lenis + overflow kilidi)
- [x] R2 PageTransition + R3 dinamik title (`PageTransition.tsx` + `motion/TransitionLink.tsx` + `lib/transition-store.ts` + `lib/transition-title.ts`; Kural 29) *(revize: 2026-09-17 — View Transitions API yerine TransitionLink)*
- [x] R4 Nav (Lenis direction, IO `[data-nav-dark]`, `text-stroke-fill` logo) + R5 MenuOverlay (SplitReveal lines, `useDialog`: ESC / focus trap / scroll kilidi)
- [x] R12 Cart (`lib/cart-store.ts` persist localStorage, toast, kraft drawer, `wa.me` checkout; numara null → disabled + "yakında")
- [x] R16 CookieBanner (localStorage OKAY / sessionStorage LATER) · R17 InfoModal (KraftCard, `useDialog`)
- [x] R18 Footer (SplitReveal + RollText linkler, dev wordmark, Juggle, tape, telif, kredi; `data-nav-dark`)
- [x] CursorTrail layout'a taşındı; `/lab` "Layout" bölümü (perde tetikle, perde ile ana sayfa, sepete ekle, sepeti aç, InfoModal, preloader sıfırla) *(revize: 2026-09-17)*
- [x] ✅ Kabul: `scripts/lab-check.mjs` 31/31 ✓, console 0 — perde + title (`Smash'leniyor` → `Servis` → başlık), preloader 1 kez, nav gizlen/göster/invert, cart persist, ESC/focus, mobil 375 overlay + drawer. `docs/screens/faz-4-desktop.png`, `faz-4-mobile.png`, `faz-4-transition.webm`

### Faz 5 — Ana Sayfa
- [ ] Hero (R9)
- [ ] Marquee (R14)
- [ ] The Hits: 6 imza ürün (R10 + R11)
- [ ] Smash Anatomy (R15)
- [ ] Handmade hikayesi ("Hazır soslara biraz uzağız")
- [ ] United Chill Burger Zone (R13, "THE BURGER YOU'LL CRAVE AGAIN")
- [ ] Misu & Miyu bölümü (idle animasyon)
- [ ] Instagram grid (6 statik + @manch.tr CTA)
- [ ] Konum (harita embed, saatler TODO)
- [ ] ✅ Kabul: desktop + mobil scroll akışı kusursuz

### Faz 6 — İç Sayfalar
- [ ] `/menu`: sticky kategori sekmeleri, filtre (spicy/new/signature), tüm kartlar, ürün detay modalı (kraft kart malzeme listesi)
- [ ] `/about`: hikaye, maskotlar, zone galerisi
- [ ] `/contact`: iletişim, harita, WhatsApp, InfoModal
- [ ] 404 sayfası (Misu&Miyu ile)
- [ ] ✅ Kabul: tüm linkler çalışıyor, iki dil eksiksiz

### Faz 7 — İçerik, SEO & Erişilebilirlik
- [ ] Tüm TR/EN metinler tamam, placeholder'lar işaretli
- [ ] Metadata, OG görseli, `Restaurant` JSON-LD, sitemap, robots, hreflang
- [ ] Favicon / app icon (logo)
- [ ] Focus ring (mustard), aria-label'lar, kontrast kontrolü
- [ ] ✅ Kabul: Lighthouse A11y ≥ 95, SEO ≥ 95

### Faz 8 — Performans & QA
- [ ] next/image AVIF/WebP, lazy, sizes
- [ ] GSAP eklentilerini dinamik import et, bundle analizi
- [ ] Mobil (375, 768) + desktop (1440, 1920) görsel kontrol
- [ ] Safari / iOS testi (Lenis, backdrop-blur, svh/dvh)
- [ ] ✅ Kabul: LCP < 2.5s, CLS < 0.1, Performance ≥ 90

### Faz 9 — Deploy
- [ ] GitHub repo `manch` oluştur, push
- [ ] Vercel'e bağla (auto-deploy), env yok
- [ ] Preview URL'yi DURUM'a yaz
- [ ] Domain (Cloudflare DNS) — TODO
- [ ] ✅ Kabul: production build Vercel'de yeşil

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

---

## AGENTS.md

Kokteki `AGENTS.md` dosyasi Next.js tarafindan otomatik uretilir (`next dev` her calistiginda yeniden yazar). Next 16 API farklari icin `node_modules/next/dist/docs/` altindaki rehberleri okumayi hatirlatir. Silme, commite dahil et.
