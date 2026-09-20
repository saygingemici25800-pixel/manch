/**
 * Kural 75 — beklenen şey SÜRE değil KOŞUL'dur.
 *
 * Sabit `waitForTimeout` ile beklemek, ölçüm makinesi yük altına girdiği anda yarışa
 * dönüşür: pay yetmez, kontrol eski durumu okur ve kırmızı yanar. Payı büyütmek yarışı
 * çözmez, erteler (2026-09-20: `lab-check` 102/107 · 106/107 · 107/107 oynadı; dört
 * ayrı sabit bekleme yarışıyordu ve biri geçmişte 1200 → 2600 büyütülerek bir kez
 * zaten geçiştirilmişti).
 *
 * Hepsi TAVANLI ve `.catch` ile yutulur: koşul gerçekten sağlanmazsa bekleme sessizce
 * biter ve **asıl iddia** (çağıran taraftaki `t(...)` / `ok(...)`) düşer. Yani bu
 * yardımcılar bir kontrolü asla kurtarmaz, yalnızca yarışı kaldırır.
 */

/**
 * Sayfa yerleşti mi? Fontlar hazır + GSAP yüklendi (`gsapReady`).
 * `gsapReady` evrensel: `SmoothScroll` layout'ta ve `loadGsap()` çağırıyor; `gsap.ts`
 * yüklenince motion-store'a yazıyor (Kural 46-A). Yani "hydration bitti + tembel
 * animasyon geldi" anlamına gelen tek gerçek sinyal bu.
 */
export async function hazir(p, { timeout = 15000 } = {}) {
  await p.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
  /* İKİ sinyal birden: `gsapReady` (motion-store) VE Lenis'in kök sınıfı. Yalnız
     `gsapReady` beklemek yetmedi — Lenis ayrı bir lazy chunk, gsap'tan sonra
     bağlanabiliyor ve "Lenis root sınıfı" kontrolü üç koşuda bir kırmızı yandı. */
  await p
    .waitForFunction(
      () =>
        window.__MOTION__?.getState?.().gsapReady === true &&
        /lenis/.test(document.documentElement.className),
      null,
      { timeout },
    )
    .catch(() => {});
}

/**
 * Kaydırma durdu mu? `wheel` sonrası Lenis yumuşatması sürerken ölçmek, bir sonraki
 * girdinin uçuştaki kaydırmaya karışmasına yol açıyor: "Nav yukarı scroll'da geri gelir"
 * kontrolü tam bundan düştü — aşağı kaydırma bitmeden yukarı tekerlek gönderiliyordu.
 */
export const durgun = (p, sabitMs = 220, timeout = 12000) =>
  p
    .waitForFunction(
      (ms) => {
        const w = window;
        if (w.__sonY !== window.scrollY) { w.__sonY = window.scrollY; w.__sonT = performance.now(); return false; }
        return performance.now() - (w.__sonT ?? 0) > ms;
      },
      sabitMs,
      { timeout, polling: 60 },
    )
    .catch(() => {});

/** `data-state` belirtilen değere gelene kadar bekler (dialog/drawer/modal). */
export const durumBekle = (p, sel, deger, timeout = 12000) =>
  p
    .waitForFunction(
      ([q, want]) => document.querySelector(q)?.getAttribute("data-state") === want,
      [sel, deger],
      { timeout },
    )
    .catch(() => {});

/** Eleman DOM'a girene kadar bekler. */
export const varOl = (p, sel, timeout = 12000) =>
  p.locator(sel).first().waitFor({ state: "attached", timeout }).catch(() => {});

/** Eleman DOM'dan çıkana kadar bekler. */
export const yokOl = (p, sel, timeout = 12000) =>
  p.locator(sel).first().waitFor({ state: "detached", timeout }).catch(() => {});

/** Serbest koşul — tek satırlık kullanım için. */
export const kosul = (p, fn, arg = null, timeout = 12000) =>
  p.waitForFunction(fn, arg, { timeout }).catch(() => {});

/**
 * ÖLÇÜM PENCERESİ — Kural 75'in istisnası, bilerek SÜRE.
 * "Tuşu N ms basılı tut", "N ms boyunca örnekle", "N ms'de hiçbir şey değişmedi"
 * gibi yerlerde beklenen bir koşul YOKTUR; ölçülen şeyin kendisi süredir. Bu sarmalayıcı
 * niyeti görünür kılar: `waitForTimeout` görüldüğü yerde "bu yarış mı?" diye sorulur,
 * `pencere(...)` görüldüğü yerde sorulmaz.
 * Durum beklemek için KULLANILMAZ.
 */
export const pencere = (p, ms) => p.waitForTimeout(ms);

/**
 * Eleman DURDU mu? `data-state="open"` açılış animasyonunun BAŞINDA yazılıyor; hemen
 * ardından tıklamak hareketli bir hedefe tıklamaktır ve Playwright "element is not
 * stable" ile 30 sn bekleyip çöker (2026-09-20, sepet çekmecesindeki checkout).
 * Durum beklemek yetmez — hareketin bitmesi beklenir.
 */
export const sabit = (p, sel, sabitMs = 200, timeout = 12000) =>
  p
    .waitForFunction(
      ([q, ms]) => {
        const el = document.querySelector(q);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const k = `${Math.round(r.top)}:${Math.round(r.left)}:${Math.round(r.width)}:${Math.round(r.height)}`;
        const w = window;
        if (w.__sabitK !== k) { w.__sabitK = k; w.__sabitT = performance.now(); return false; }
        return performance.now() - (w.__sabitT ?? 0) > ms;
      },
      [sel, sabitMs],
      { timeout, polling: 60 },
    )
    .catch(() => {});
