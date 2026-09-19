/**
 * GSAP chunk'ını **ilk boyamadan SONRAYA** erteleyen tek yükleyici (Kural 46'nın devamı).
 *
 * Neden: GSAP zaten ilk yükleme JS'inde değil, `import()` ile geliyor — ama import
 * `useEffect` içindeydi, yani hydration biter bitmez başlıyordu. Yavaş 4G'de 49 kB gz'lik
 * chunk **LCP görseliyle bant genişliği yarışıyor**: `/menu`'nün LCP öğesi ilk kart görseli
 * ve Lighthouse kırılımında baskın kalem `resourceLoadDelay`. Animasyonu birkaç yüz ms
 * geciktirmek bedava; LCP'yi geciktirmek değil.
 *
 * Güvenli olmasının sebebi Kural 50: girişte animasyon uygulayan her primitive **animasyonsuz
 * görünür** durumdan başlar. GSAP geç gelirse içerik eksik kalmaz, yalnızca hareket geç başlar.
 * `TransitionLink` de `gsapReady` false iken perdesiz normal navigasyon yapıyor (Kural 46).
 *
 * Kural 25: modül seviyesi durum bir closure'dan DEĞİL, buradaki plain fonksiyondan yazılır.
 */
export type GsapBundle = typeof import("@/lib/gsap");

let pending: Promise<GsapBundle> | null = null;

/** Boşta çalıştır; `requestIdleCallback` yoksa küçük bir gecikmeyle. */
function whenIdle(run: () => void) {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void;
  };
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(run, { timeout: 2000 });
  else setTimeout(run, 200);
}

/**
 * GSAP'ı getirir. Çağrı sayısından bağımsız olarak **tek** promise döner — her tüketici
 * kendi `import()`'unu tetiklemez.
 *
 * Sıra: sayfa `load` olmuşsa hemen boşta; olmamışsa `load`'u bekler, sonra boşta.
 * `load`, ilk boyamada keşfedilen kaynakları (LCP görseli dahil) kapsar; böylece GSAP
 * sıraya onların ARKASINA girer.
 */
export function loadGsap(): Promise<GsapBundle> {
  pending ??= new Promise<GsapBundle>((resolve, reject) => {
    const start = () => void import("@/lib/gsap").then(resolve, reject);
    if (typeof document === "undefined") return;
    if (document.readyState === "complete") whenIdle(start);
    else window.addEventListener("load", () => whenIdle(start), { once: true });
  });
  return pending;
}
