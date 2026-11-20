# DEVAM — telefondan / yeni oturumdan devam notu

> Son güncelleme: 2026-11-20. **Tek doğruluk kaynağı `CLAUDE.md`'dir** (kurallar, hata günlüğü,
> ayrıntılı durum). Bu dosya hızlı giriş içindir; çelişki olursa CLAUDE.md kazanır.
> Daha uzun devir notu: `docs/manch-devir.md`.

## Proje

- **Ne:** Fethiye'deki smash burger markası **MANCH** için iki dilli (TR varsayılan / EN),
  animasyon ağırlıklı web sitesi + 3D "MANCH Zone" galeri + yönetim paneli `/admin`
  (fiyat, sipariş aç/kapa, saat kapısı, sipariş akışı). Sipariş WhatsApp'tan gider.
- **Canlı:** https://manch.sngdestek.com (yönetim: `/admin`).
  `manch-v2.vercel.app` de aynı içeriği verir ama bazı Türk bağlantılarında engelli (Kural 82).
- **GitHub:** https://github.com/saygingemici25800-pixel/manch
  · **Çalışma dalı: `faz-1-yeniden`** (production). Reponun varsayılan dalı `main` = eski site,
    **ona dokunma**; telefonda oturum açarken dalı `faz-1-yeniden` seç.
- **Vercel:** proje `manch-v2`, GitHub'a bağlı, production dalı `faz-1-yeniden`
  → bu dala her push otomatik canlıya deploy olur (~40 sn).
  Eski proje `manch` (`main` dalı, manch-eight.vercel.app) dokunulmadan duruyor.
- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
  next-intl · GSAP + Lenis (lazy) · three / react-three-fiber (Zone) · Zustand ·
  Neon Postgres (panel deposu) · pnpm.
- **Asıl kaynak dosyalar:** `CLAUDE.md` (kurallar) · `src/data/menu.ts` (menü, tek kaynak) ·
  `src/lib/site.ts` (marka sabitleri) · `src/messages/{tr,en}.json` (tüm metinler) ·
  `docs/manch-zone-3d.md` (Zone spec).

## Şu anki durum

**Bitti:** Fazlar 1–9 + 5.5 (Zone) kapalı · site yayında · marka kiti FAZ B (palet) + B-2
(CTA/rozet sistemi) · `/admin` paneli + Neon deposu bağlı, şifre Vercel'de, girişi doğrulandı ·
Zone açık mutfak + tabaklar · ana sayfa açılışı Zone karesi · lab-check checkout çöküşü
düzeltildi (Kural 83, 2026-11-19).

**Yarım / açık:**
- Canlıda panelden **bir fiyat kaydı + bir aç/kapa elle denenmedi** (kayıt yok) — ilk iş bu.
- `/tr` ilk yükleme JS **219.6 / 220 kB gz** — payda 0.4 kB kaldı (Kural 46). Yeni özellik
  eklemeden önce bütçeye bak.
- `zone-perf-check` temiz makinede ölçülemedi (makine yükü) — temiz ortamda 3 koşu gerekiyor.

## Sıradaki işler (öncelik sırasıyla)

1. **Canlı panel testi** (senin elinle): `/admin` → bir ürünün fiyatını değiştir, sitede gör,
   geri al; siparişi kapat → sepette gönder kapalı mı, sonra aç.
2. **Repo görünürlüğü — KARAR SENDE:** repo şu an **PUBLIC**. Private yapmak istersen
   GitHub → Settings → Danger Zone → Change visibility. (Vercel bağlantısı etkilenmez.)
3. **İçerik bekleyenler (işletme sahibinden):** Misu & Miyu'nun 8 açılık çizimi
   (`public/images/mascots/`, gelince `character.ts` `MASCOT_SPRITE_BASE` tek satır + Zone
   kareleri `zone-still.mjs` ile yeniden üretilir) · orijinal fotoğraflar · orijinal vektör logo +
   marka renk kılavuzu · içecek fiyatları (şu an `null` = YAKINDA) · Crispy Triangle fiyatı ·
   menü metinlerinin onayı · 16 üründe fotoğraf yok.
4. **Marka kiti Faz C / D / E** (font · logo · maskot) — planlayıcı (claude.ai) kararı bekliyor.
5. **Kalıcı marka alan adı** (ör. manch.com.tr) — adımlar CLAUDE.md DURUM'da
   ("Cloudflare DNS adımları"); `NEXT_PUBLIC_SITE_URL` yeni adrese güncellenir + redeploy.
6. `manch-v2.vercel.app` → yeni adrese yönlendirme yok (kopya içerik sorunu yok, canonical doğru).

**Onayını bekleyen:** madde 2 (görünürlük), madde 4 (kit fazları), domain kararı.
Bir sonraki faza **kendiliğinden geçilmez** — her faz sonunda onay istenir.

## Kurallar (özet — tamamı CLAUDE.md "KURALLAR")

- Paket yöneticisi **pnpm**; npm/yarn yok. Next **16** API'leri (`src/proxy.ts`, `middleware.ts` YOK).
- Görünen her metin `messages/tr.json` + `en.json`'dan; koda sabit metin yazılmaz.
- Menü yalnız `src/data/menu.ts`, marka sabitleri yalnız `src/lib/site.ts`.
- GSAP/three ilk yükleme JS'ine **statik import edilmez** (lazy, Kural 46/61).
- Metin renginde opaklık yok; kontrast çiftleri Kural 40.
- **HATA PROTOKOLÜ:** her build/lint/runtime hatasında önce CLAUDE.md'ye hata günlüğü satırı
  (+ gerekirse kural), sonra düzeltme.
- **Commit formatı:** `tip(kapsam): türkçe açıklama` — tip: `feat` / `fix` / `perf` / `docs` /
  `chore`; prefix turda fiilen değişen en ağır şeye göre (Kural 76).
- **Push yalnız `faz-1-yeniden`'e, tek seferde** — commit commit push yok, her push bir deploy
  (Kural 70). `main`'e push yok.
- Gizli değer (şifre, token, DB adresi) repoya ve belgelere yazılmaz.

**Push öncesi zorunlu kontroller:**
```bash
pnpm lint && NEXT_PUBLIC_SITE_URL=https://manch.sngdestek.com pnpm build
```
Davranışa dokunan değişikliklerde ek olarak (dev sunucusu açıkken, Playwright Chromium ile):
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3113 pnpm dev -p 3113
```
```bash
PORT=3113 CHROME=<chromium yolu> node scripts/lab-check.mjs
```
lab-check **3 ardışık temiz koşu** (Kural 60); dokunulan alana göre `a11y-check`,
`zone-camera-check`, `admin-check`, `bundle-report`. Deploy sonrası canlıda:
```bash
node scripts/smoke.mjs https://manch.sngdestek.com
```

## Telefondan nasıl devam edilir

1. claude.ai/code → repo `saygingemici25800-pixel/manch` → dal **`faz-1-yeniden`**.
2. İlk mesajda: "CLAUDE.md ve DEVAM.md'yi oku" de.
3. Ortam değişkenleri (yalnız adlar; değerler **Vercel → manch-v2 → Settings → Environment
   Variables**'tan):
   - `NEXT_PUBLIC_SITE_URL` — **zorunlu**, yoksa `pnpm build` kırılır (Kural 57). Değeri gizli
     değil: production için canlı adres, yerel dev için `http://localhost:<port>`.
   - `ADMIN_PASSWORD` — yalnız `admin-check` koşacaksan. Vercel'de **Secret** tipinde: panodan
     **geri okunamaz**; değer yalnız eski bilgisayardaki `.env.admin-sifre`'de. Kaybolduysa
     yenisini üret, Vercel'de değiştir, redeploy (tüm oturumlar düşer).
   - `DATABASE_URL` (+ Vercel'in Neon için eklediği `PG*` / `POSTGRES_*`) — yalnız gerçek
     Postgres'le test için (`ADMIN_CHECK_PG=1` + `ADMIN_PG_PREFIX=manchtest_`; **asla `manch_`**).
     Değer: Vercel → manch-v2 → Storage → Neon. Dev'de gerekmez — dev deposu
     `.data/admin-store.json` dosyasıdır.
   - `ADMIN_SESSION_SECRET` — isteğe bağlı, tanımlı değil (DATABASE_URL'den türetiliyor).
   - **Vercel'e eklenmeyenler:** `NEXT_PUBLIC_ALLOW_NOPRELOAD`, `ADMIN_STORE`, `ORDER_TEST_CLOCK`
     (yalnız yerel ölçüm/test).
4. Bulut ortamında tarayıcı yoksa Playwright bekçileri (`lab-check` vb.) koşmayabilir;
   o zaman `lint && build` + canlıda `smoke` ile yetin ve bunu raporda **açıkça yaz**
   (Kural 77: koşmayan kontrol geçmiş sayılmaz).
5. Canlıda ağır ölçüm (Lighthouse, tur) yapma — Vercel bot koruması 403'e düşer (Kural 71).
