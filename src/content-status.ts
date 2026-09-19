/**
 * MÜŞTERİ ONAYI BEKLEYEN İÇERİK — tek doğruluk kaynağı.
 *
 * Neden bu dosya var: hangi metnin taslak olduğu bugüne kadar üç ayrı yerde, üç ayrı biçimde
 * duruyordu (`menu.ts`'te bir yorum satırı, `site.ts`'te `// TODO`'lar, CLAUDE.md'de düzyazı).
 * Yeni bir metin eklenince hangisinin güncelleneceği belirsizdi.
 *
 * **Bu dosya kullanıcıya HİÇBİR ŞEY göstermez.** Arayüzde "taslak" yazmıyoruz:
 *   · eksik VERİ → `SoonBadge` ("YAKINDA") ile gösterilir (Kural 54-A)
 *   · onay bekleyen METİN → normal metin gibi görünür; müşteri onaylayınca değişen bir şey
 *     olmaz, yalnız buradaki satır silinir
 * Tek istisna `Menu.disclaimer` — o **bilerek** kullanıcıya görünür ("Menü ve fiyatlar örnek
 * amaçlıdır, değişebilir"), çünkü fiyat beklentisi yaratmamak ticari bir gerekliliktir.
 *
 * Bir madde onaylandığında: buradan sil. Liste boşalınca dosya da silinir.
 */

export interface PendingContent {
  /** Metnin yaşadığı yer — dosya ya da mesaj anahtarı öneki. */
  readonly source: string;
  /** Ne bekliyor. */
  readonly what: string;
  /** Kullanıcıya bir uyarı gösteriliyor mu? Çoğunda hayır — metin normal görünür. */
  readonly visibleNotice: string | null;
  readonly since: string;
}

export const PENDING_CONTENT: readonly PendingContent[] = [
  {
    source: "src/data/menu.ts → DESC",
    what: "25 ürün açıklaması (TR+EN) — müşteriden gelen taslak metinler",
    visibleNotice: "Menu.disclaimer (menü sayfasında ve sipariş tahtasında)",
    since: "2026-09-18",
  },
  {
    source: "src/data/menu.ts → fiyatlar",
    what: "3 içecek + Crispy Triangle fiyatı yok (`price: null`)",
    visibleNotice: "SoonBadge — YAKINDA rozeti, sipariş edilemez",
    since: "2026-09-18",
  },
  {
    source: "src/lib/site.ts → orderUrl",
    what: "Online sipariş linki (sağlayıcı belli değil)",
    visibleNotice: "SoonBadge — /contact'ta 'Online sipariş: YAKINDA'",
    since: "2026-09-17",
  },
  {
    source: "public/images/mascots/ (yok)",
    what: "Misu & Miyu'nun 8 açılık çizimi — gelene kadar `drawCapy()` geçici sprite üretir",
    visibleNotice: null,
    since: "2026-09-18",
  },
  {
    source: "public/logo/*.svg",
    what: "Orijinal vektör logo — şimdikiler potrace izi (MENÜ wordmark'ında ü noktaları bozuk)",
    visibleNotice: null,
    since: "2026-09-17",
  },
] as const;
