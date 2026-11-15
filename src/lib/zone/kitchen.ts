/**
 * Açık mutfak — salonun ortasında boydan boya uzanan tezgâh (karar 2026-11-15, kullanıcı).
 *
 * Bu modül **saf geometri**: three yok, menü yok. `runtime.ts` çarpışma için bunu çağırır;
 * runtime ana bundle'a hiç girmediği hâlde zincir kısa ve ağırsız kalsın diye ürün listesi
 * ayrı modülde (`kitchen-stations.ts`) — Kural 61-A.
 *
 * Yerleşim (dünya birimi; salon x ±7.2, karakter z −15..15, başlangıç z 12):
 *
 *     z −9 ┌──┐  ← İÇECEK & TATLI
 *          │  │  ← YANINDA
 *     z  0 │▓▓│  ← SMASH BURGERS (7 gerçek kesit)
 *     z  3 └──┘  ← giriş tarafı: karakter 9 birim önünde başlar, tezgâhı karşıdan görür
 *
 * İki yanda ~5 birimlik koridor kalır; dört tablonun durma noktaları (x ±5.6) etkilenmez.
 * **Alçak tutuldu** (tezgâh 0.95, en uzun öğe 2.2): kamera karakterin 2.45 yükseğinde,
 * davlumbaz ya da arka duvar karşı duvardaki tabloları saklardı — "açık" mutfak.
 */

export type StationId = "burgers" | "sides" | "drinks";

/** Tezgâhın dış ölçüsü (üst tabla dahil). */
export const KITCHEN = {
  halfW: 1.05,
  zMin: -9,
  zMax: 3,
  /** Tezgâh üst yüzeyi. */
  top: 0.95,
} as const;

/** Karakterin "gövde" yarıçapı — sprite tezgâhın içine gömülmesin. */
export const CHAR_RADIUS = 0.45;

/**
 * İstasyonlar: merkez z'si ve **yakınlık aralığı** (`from`..`to`, bitişik — boşluk da çakışma
 * da yok). Uç istasyonların aralığı tezgâhın ucunu geçer: karakter tezgâhın önünde/arkasında
 * dururken de en yakın istasyonu görür (girişten düz yürüyen tezgâhın ucunda durur).
 */
export const STATIONS: readonly { id: StationId; z: number; from: number; to: number }[] = [
  { id: "burgers", z: 0, from: -3.1, to: 4.2 },
  { id: "sides", z: -4.75, from: -6.4, to: -3.1 },
  { id: "drinks", z: -7.7, from: -10.2, to: -6.4 },
] as const;

/**
 * Yakınlık: tezgâhın kenarından en çok bu kadar uzakta (x ekseninde). Tablo durma
 * noktasının tetikleme çemberi (x ±5.6, yarıçap 2.6) |x| > 3.0'da başlar — iki yakınlık
 * ÇAKIŞMAZ, aynı anda iki prompt çıkmaz.
 */
export const STATION_REACH_X = 3.0;

const bx = KITCHEN.halfW + CHAR_RADIUS;
const bz0 = KITCHEN.zMin - CHAR_RADIUS;
const bz1 = KITCHEN.zMax + CHAR_RADIUS;

/** Karakter merkezi bu noktadayken tezgâha giriyor mu? */
export const insideKitchen = (x: number, z: number) => x > -bx && x < bx && z > bz0 && z < bz1;

/**
 * Hareketi tezgâha göre çözer — **eksen eksen**: önce x, sonra z. Biri engellenince öbürü
 * sürer, yani karakter tezgâha çapraz yaklaşınca durmaz, kenarı boyunca KAYAR.
 * Başlangıç noktası zaten içerideyse (eski bir ışınlama vb.) önce dışarı itilir.
 */
export function resolveKitchen(fromX: number, fromZ: number, toX: number, toZ: number) {
  let fx = fromX;
  let fz = fromZ;
  if (insideKitchen(fx, fz)) [fx, fz] = pushOut(fx, fz);
  // Engellenen eksende eski konumda kalınmaz, kenara YASLANILIR: bir kare ~0.23 birim
  // (düşük kare hızında daha çok) — yoksa karakter kenardan rastgele bir mesafede durur.
  const x = insideKitchen(toX, fz) ? (fx >= bx ? bx : fx <= -bx ? -bx : fx) : toX;
  const z = insideKitchen(x, toZ) ? (fz >= bz1 ? bz1 : fz <= bz0 ? bz0 : fz) : toZ;
  return { x, z };
}

/** İçerideki bir noktayı en yakın kenarın dışına taşır. */
export function pushOut(x: number, z: number): [number, number] {
  if (!insideKitchen(x, z)) return [x, z];
  const options: [number, number, number][] = [
    [bx - x, bx + 1e-3, z], // sağ kenar
    [x + bx, -bx - 1e-3, z], // sol kenar
    [bz1 - z, x, bz1 + 1e-3], // giriş tarafı
    [z - bz0, x, bz0 - 1e-3], // künye tarafı
  ];
  options.sort((a, b) => a[0] - b[0]);
  return [options[0][1], options[0][2]];
}

/** Karakterin yanında durduğu istasyon (yoksa null). */
export function nearestStation(x: number, z: number): StationId | null {
  if (Math.abs(x) > STATION_REACH_X) return null;
  for (const s of STATIONS) if (z >= s.from && z < s.to) return s.id;
  return null;
}

/**
 * Karakter tezgâhın hangi yüzünde: −1 sol koridor · +1 sağ koridor · 0 uçlardan biri
 * (girişten düz yürüyen tezgâhın burnunda durur). Prompt bu yüze asılır.
 */
export type KitchenFace = -1 | 0 | 1;
export function kitchenFace(x: number, z: number): KitchenFace {
  if (z > KITCHEN.zMax || z < KITCHEN.zMin) return 0;
  return x < 0 ? -1 : 1;
}

/** İstasyonun prompt çapası: tezgâhın, karakterin baktığı yüzünde. */
export function stationAnchor(id: StationId, face: KitchenFace): [number, number, number] {
  const s = STATIONS.find((v) => v.id === id) ?? STATIONS[0];
  if (face === 0) return [0, 1.35, s.z > -4 ? KITCHEN.zMax + 0.2 : KITCHEN.zMin - 0.2];
  return [face * (KITCHEN.halfW + 0.15), 1.35, s.z];
}
