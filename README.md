# MANCH — United Chill Burger Zone

Fethiye Paspatur'daki smash burger markası **MANCH** için iki dilli (TR varsayılan / EN), animasyon ağırlıklı web sitesi.

Canlı: **https://manch-eight.vercel.app** · Stack: Next.js 16 (App Router, TS, `src/`) · Tailwind v4 · GSAP 3 (lazy) · Lenis · next-intl · Zustand · Vercel

> Projenin tek doğruluk kaynağı **[CLAUDE.md](./CLAUDE.md)**: kurallar, faz geçmişi ve hata günlüğü orada. Kod değişikliğinden önce oku.

## Geliştirme

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build && pnpm start
pnpm lint
```

Doğrulama script'leri (dev sunucu 3200, prod sunucu 3100 varsayar):

```bash
node scripts/lab-check.mjs /tmp/out          # 96 kontrol (chromium)
BROWSER=webkit node scripts/lab-check.mjs /tmp/out
node scripts/lighthouse.mjs docs/screens/x.json --base http://localhost:3100
BASE=http://localhost:3100 node scripts/bundle-report.mjs   # First Load JS (gz)
node scripts/smoke.mjs https://manch-eight.vercel.app       # deploy duman testi
```

---

# Nasıl güncellenir

## 1. Menü ve fiyatlar → `src/data/menu.ts`

Menünün **tek** kaynağı burası (Kural 6); fiyatlar TL, `price: null` → arayüzde "Fiyat için sor".

Burger eklemek/düzenlemek (`burger()` yardımcısı):

```ts
burger("truffle-manch", "Truffle Manch Burger", 730,
  ["2 adet 60 gr burger köftesi", "Truffle aioli", "Çıtır soğan", "Cheddar peyniri"],  // TR malzemeler
  ["2 × 60 g smash patties", "Truffle aioli", "Crispy onions", "Cheddar"],             // EN malzemeler
  { tags: ["signature"], featured: true, time: 13 }),
```

- `slug` **aynı zamanda görsel adıdır**: `public/burgers/<slug>.png` varsa otomatik kullanılır, yoksa Placeholder çizilir (Kural 7). `slug` değiştirirsen görseli de yeniden adlandır.
- `featured: true` → ana sayfadaki "The Hits" (6 ürün önerilir).
- `tags`: `"spicy" | "new" | "signature"` — `/menu` filtreleri bunlara bakar.
- Burger dışı ürünler `simple(slug, kategori, {tr,en}, fiyat, açıklama, malzemeler, görsel, süre)`.
- Kategoriler dosyanın başında `categories[]`; sıra `/menu` sekme sırasıdır, `cover` kategori başlığındaki küçük görsel.
- **Fiyat güncellemesi**: yalnızca ilgili satırdaki sayıyı değiştir — sepet toplamı, ürün kartı, modal ve WhatsApp mesajı aynı yerden beslenir.

## 2. Metinler → `src/messages/tr.json` + `en.json`

Kullanıcıya görünen **hiçbir metin koda yazılmaz** (Kural 5). İki dosya **aynı anahtar ağacına** sahip olmalı; eksik anahtar konsolda `MISSING_MESSAGE` verir ve `lab-check` bunu hata sayar.

Namespace'ler: `Meta · Home · Nav · Preloader · Transition · Voice · Common · Cart · Cookie · Modal · Footer · Product · Menu · About · Contact · NotFound` (+ geliştirme: `Lab · Motion · LayoutLab`).

- Sayfa başlıkları `<namespace>.metaTitle` / `metaDescription` (şablon: `%s | MANCH`).
- Yeni **client** component yeni bir namespace kullanıyorsa ilgili sayfanın `clientMessages(all, ["X"])` listesine eklenmeli (Kural 44).
- Pixel font (`font-pixel`) **yalnızca İngilizce** metinlerde — TR karakterleri yok (Kural 18).
- Marka sabitleri (adres, telefon, WhatsApp, sosyal) metin değil: `src/lib/site.ts` (Kural 6).

## 3. Görsel ekleme → `public/burgers` · `public/images`

Kaynak fotoğraflar `docs/source/` altında durur (asla üzerine yazılmaz).

**Burger kesiti** (şeffaf PNG + WebP, Kural 41):

```bash
# 1) kaynağı docs/source/ altına koy:  docs/source/burger-<isim>.png
# 2) scripts/content/cutouts.py içindeki BURGERS sözlüğüne  "<slug>": "burger-<isim>.png"  satırını ekle
scripts/content/.venv/bin/python scripts/content/cutouts.py --matting --preclean
# çıktı: public/burgers/<slug>.png (1200²) + .webp (600) ve kontak tablosu
```

Tek ürün için: `--only <slug>`. Sonucu **mutlaka** `docs/screens/icerik-burgers.png` kontak tablosundan göz kontrol et (kağıt/ok artığı, kopan marul).

**Düz fotoğraf** (hero, atıştırmalık, tatlı): `scripts/content/photos_logo.py` içindeki `save_photo()` çağrılarına ekle → `public/images/<ad>.jpg` + `.webp` (uzun kenar 1600). Sayfada `next/image` ile, `sizes` vererek kullan; `priority` yalnızca gerçek LCP adayında (Kural 45/47).

Sanal ortam yoksa: `python3 -m venv scripts/content/.venv && scripts/content/.venv/bin/pip install "rembg[cpu]" pillow numpy`.

## 4. Ortam değişkenleri

Şablon `.env.example`. Vercel → Project → Settings → Environment Variables.

| Değişken | Nerede | Not |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel **Production + Preview** | Canonical / hreflang / sitemap / OG mutlak adresleri (Kural 38). Şu an `https://manch-eight.vercel.app`. Ayarlı değilse `https://manch.tr` varsayılanına düşer. |
| `NEXT_PUBLIC_ALLOW_NOPRELOAD` | **yalnızca yerel ölçüm build'i** | `?nopreload=1` ile preloader'ı atlar (Kural 43). **Prod'da/Vercel'de tanımlanmaz** — tanımlanırsa ziyaretçi preloader'ı URL ile atlayabilir. |

Değiştirdikten sonra **redeploy** ve `node scripts/smoke.mjs https://<host>`.

## 5. Domain bağlama (Cloudflare DNS)

1. Vercel → Project → Settings → **Domains** → alan adını ekle.
2. Cloudflare → DNS → `CNAME` kaydı: `@` ve `www` → `cname.vercel-dns.com`, **proxy kapalı (DNS only)**.
3. Vercel'de domain doğrulaması yeşile dönsün.
4. `NEXT_PUBLIC_SITE_URL`'i yeni domaine güncelle (Production + Preview).
5. **Redeploy.**
6. `node scripts/smoke.mjs https://<domain>` → 10/10 ✓, uyarı 0 olmalı (canonical yeni domaini göstermeli).

## 6. Yayın akışı

`main`'e push → Vercel auto-deploy. Push öncesi **her zaman** `pnpm build` (Kural 2), sonrasında smoke testi.
