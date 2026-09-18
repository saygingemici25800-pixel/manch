/**
 * Sayfa kaydırma kilidi — **sayaçlı**, tek doğruluk kaynağı.
 *
 * Neden sayaç: `html.style.overflow`'u kaydet/geri-yükle kalıbıyla yöneten İKİ ayrı yer vardı
 * (Preloader ve `useDialog`) ve üst üste bindiklerinde birbirlerini eziyorlardı. Ölçülen
 * sıra (2026-09-18, Zone kapısı): preloader kilitli → perde açılıyor ve önceki değeri
 * "hidden" olarak saklıyor → preloader bitip `""` yazıyor ve **perdenin kilidini açıyor** →
 * perde kapanırken sakladığı "hidden"ı geri yazıyor ve **site kaydırılamaz kalıyor.**
 *
 * Sayaçla bu mümkün değil: kilit ilk `lock()`'ta konur, **son** `unlock()`'ta kalkar; arada
 * kim gelirse gelsin sıra bozulmaz. Kural 25: mutasyon bu modüldeki plain fonksiyonlarda.
 */
let depth = 0;
let restore = "";

export function lockScroll() {
  const html = document.documentElement;
  if (depth === 0) {
    restore = html.style.overflow;
    html.style.overflow = "hidden";
  }
  depth += 1;
}

export function unlockScroll() {
  if (depth === 0) return;
  depth -= 1;
  if (depth === 0) document.documentElement.style.overflow = restore;
}

/** Dev/QA: kontroller kilit derinliğini buradan okur. */
export const scrollLockDepth = () => depth;

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__SCROLL_LOCK__ = scrollLockDepth;
}
