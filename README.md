# MANCH

Fethiye Paspatur'da el yapımı smash burger. İki dilli (TR varsayılan / EN), animasyon ağırlıklı Next.js sitesi.

> Projenin tek doğruluk kaynağı **[`CLAUDE.md`](CLAUDE.md)** — fazlar, kurallar ve hata günlüğü orada.

## Stack

Next.js 16 (App Router, TS, `src/`) · Tailwind v4 · GSAP 3 (lazy) · Lenis (lazy) · next-intl · Zustand · Vercel

## Geliştirme

```bash
pnpm install
cp .env.example .env.local     # NEXT_PUBLIC_SITE_URL'i doldur
pnpm dev
```

`/tr` ve `/en` açılır. `/tr/lab` tasarım sistemi + motion önizlemesi — **yalnızca development**, production'da 404 (Kural 23).

## Ortam değişkenleri

| değişken | zorunlu | açıklama |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **evet** | Canonical kök. Yoksa production build kırılır (Kural 57). |
| `NEXT_PUBLIC_ALLOW_NOPRELOAD` | hayır | `?nopreload=1`'i prod build'de açar. Ölçüme özel — **Vercel'e eklenmez** (Kural 43). |

## Komutlar

```bash
pnpm build        # Turbopack prod build (push öncesi ZORUNLU — Kural 2)
pnpm lint
```

### Doğrulama script'leri

Hepsi `playwright-core` kullanır; Chromium yolu `CHROME` ile verilir.

```bash
# dev sunucu (3113) çalışırken — 93 kontrol
CHROME="$CHROME" node scripts/lab-check.mjs
BROWSER=webkit node scripts/lab-check.mjs        # Kural 45, Safari/WebKit koşusu

# prod sunucu (3101) çalışırken
CHROME="$CHROME" node scripts/lighthouse.mjs      # Kural 43, 3 koşu medyanı
node scripts/bundle-report.mjs                    # Kural 46, First Load JS
CHROME="$CHROME" node scripts/screens.mjs         # 375/768/1440/1920 taşma kontrolü

# deploy sonrası
node scripts/smoke.mjs https://<host>             # Kural 48
```

## Dizin

```
src/app/[locale]/     sayfalar (ana, menu, about, contact, lab, 404, catch-all)
src/components/       layout · sections · motion · ui
src/data/menu.ts      menü (tek doğruluk kaynağı)
src/lib/site.ts       marka sabitleri (tek doğruluk kaynağı)
src/messages/         tr.json · en.json (simetrik)
scripts/              doğrulama script'leri
docs/                 brief, kaynak görseller, ekran görüntüleri, ölçümler
```
