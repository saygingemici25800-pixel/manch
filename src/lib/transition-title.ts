// R3 dinamik title + geçiş bookkeeping. Kural 25: React Compiler closure'larında global mutasyon yasak,
// bu yüzden document.title ve tek-instance durum burada, modül-seviyesi fonksiyonlarda değişir.
let baseTitle = "";
let coveredAt: string | null = null;

const base = () => document.title.split(" | ")[0];

export function markCover(pathname: string, flippingWord: string) {
  baseTitle = base();
  coveredAt = pathname;
  document.title = `${baseTitle} | ${flippingWord}`;
}

export function pathChangedSinceCover(pathname: string): boolean {
  return pathname !== coveredAt;
}

/** "Servis" başlığını yazar; geri alma fonksiyonu döner (yeni sayfa başlığı korunur). */
export function markServing(servingWord: string): () => void {
  const current = base();
  document.title = `${current} | ${servingWord}`;
  return () => {
    if (document.title.endsWith(servingWord)) document.title = current;
  };
}
