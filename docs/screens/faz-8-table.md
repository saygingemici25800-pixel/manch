# Faz 8 — taban → final (Lighthouse, prod build, Kural 43)

Final değerler 3 koşu medyanı. Hedef = **preloader'sız mobile**: perf ≥ 90 · LCP < 2500 ms · CLS < 0.1.

| sayfa | form | varyant | perf | LCP ms | CLS | TBT ms |
|---|---|---|---|---|---|---|
| `/tr` ✅ | mobile | nopreload | 83 → **98** | 4691 → **2310** | 0 → **0** | 37 → **42** |
| `/tr` | mobile | preloader | 87 → **93** | 3771 → **2745** | 0.0004 → **0.0004** | 16 → **35** |
| `/tr` | desktop | nopreload | 100 → **100** | 751 → **695** | 0 → **0** | 0 → **0** |
| `/tr` | desktop | preloader | 98 → **98** | 646 → **585** | 0.0001 → **0.0001** | 0 → **0** |
| `/tr/menu` ⚠️ | mobile | nopreload | 87 → **91** | 4043 → **3465** | 0 → **0.0011** | 24 → **42** |
| `/tr/menu` | mobile | preloader | 85 → **85** | 4014 → **4088** | 0.0004 → **0.0015** | 15 → **46** |
| `/tr/menu` | desktop | nopreload | 99 → **99** | 916 → **933** | 0 → **0.0004** | 0 → **0** |
| `/tr/menu` | desktop | preloader | 98 → **97** | 893 → **1032** | 0.0001 → **0.0005** | 0 → **0** |
| `/tr/contact` ⚠️ | mobile | nopreload | 94 → **95** | 3122 → **2888** | 0 → **0.001** | 23 → **21** |
| `/tr/contact` | mobile | preloader | 91 → **93** | 3096 → **2878** | 0.0004 → **0.0014** | 15 → **18** |
| `/tr/contact` | desktop | nopreload | 100 → **100** | 557 → **539** | 0 → **0.0002** | 0 → **0** |
| `/tr/contact` | desktop | preloader | 98 → **98** | 556 → **557** | 0.0001 → **0.0003** | 0 → **0** |

A11y ve SEO tüm satırlarda **100** (taban ve final).

## First Load JS (Kural 46, hedef ≤ 200 kB gz)

| sayfa | taban gz | final gz | fark |
|---|---|---|---|
| `/tr` | 214.6 | **214.6** | 0.0 |
| `/tr/menu` | 215.1 | **215.1** | 0.0 |
| `/tr/about` | 203 | **203** | 0 |
| `/tr/contact` | 205.2 | **205.2** | 0.0 |

## Yapılan iyileştirmeler

1. **Ana sayfada kart `priority` kaldırıldı** — kartlar fold ALTINDA, preload hero fontlarıyla yarışıyordu.
2. **Press Start 2P `preload: false`** — yalnızca küçük aksanlarda, LCP adayı değil (6 → 4 font preload).
3. **Lenis lazy** (Kural 24 revize) — `lenis/react` provider'ı yerine store; `lenis` çekirdeği effect'te `import()`.
4. **Cart / InfoModal / CookieBanner `LayoutDeferred`'a** (ssr:false) — talep üzerine açılan UI.
5. **Lazy `import()`lere `.catch()`** — WebKit'te hızlı gezinmede `ChunkLoadError` yakalanmamış redde dönüşüyordu.

## Denenip GERİ ALINAN

- **Hero görseline medya koşullu preload:** ölçüm kötüleşti (perf 96 → 93, LCP 2799 → 3230) — görsel LCP adayı olunca metinden geç boyanıyor.
- **Modak `display: "optional"`:** perf 96 → 92, TBT 34 → 124. Marka fontunu feda etmeye değmedi.

## Hedefe ULAŞILAMAYAN

- `/tr/menu` LCP **3465 ms** ve `/tr/contact` LCP **2888 ms** (hedef < 2500). Perf ikisinde de ≥ 90.
- First Load JS **214.6 kB gz** (hedef ≤ 200). Kalan yük React+Next+next-intl çatısı: en büyük üç chunk 71.4 / 45.6 / 39.4 kB gz.
- İkisinin de kökü aynı: simüle yavaş 4G'de JS bant genişliğini font ve görselle paylaşıyor.
