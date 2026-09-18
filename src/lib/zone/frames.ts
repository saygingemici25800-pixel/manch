/**
 * Zone çerçeveleri — TEK DOĞRULUK KAYNAĞI (spec bölüm 5).
 *
 * Sol duvar (side -1) ve sağ duvar (side +1), z = -4 ve 6.
 * `href` gezinme hedefi DEĞİL: panonun altındaki "tam sayfaya git" bağlantısı
 * ve sahne dışı `sr-only` navigasyon için (spec bölüm 10).
 */

export type FrameId = "menu" | "crew" | "mascot" | "visit";
export type BoardKind = "order" | "story";

export interface ZoneFrame {
  id: FrameId;
  /** -1 sol duvar · +1 sağ duvar */
  side: -1 | 1;
  z: number;
  kicker: string;
  title: string;
  board: BoardKind;
  art: string;
  href: string;
}

export const ZONE_FRAMES: readonly ZoneFrame[] = [
  {
    id: "menu",
    side: -1,
    z: -4,
    kicker: "01 · SİPARİŞ",
    title: "SİPARİŞ VER",
    board: "order",
    art: "/burgers/on-tile/classic-manch.webp",
    href: "/menu",
  },
  {
    id: "crew",
    side: 1,
    z: -4,
    kicker: "02 · EKİP",
    title: "EL YAPIMI",
    board: "story",
    art: "/images/team-kitchen.webp",
    href: "/about",
  },
  {
    id: "mascot",
    side: -1,
    z: 6,
    kicker: "03 · MASKOTLAR",
    title: "MISU & MIYU",
    board: "story",
    art: "/images/misu-lockup.png",
    href: "/about#mascots",
  },
  {
    id: "visit",
    side: 1,
    z: 6,
    kicker: "04 · ZİYARET",
    title: "BİZE GEL",
    board: "story",
    art: "/images/social/03-flatlay.webp",
    href: "/contact",
  },
] as const;

/* ---------------- sahne ölçüleri (spec bölüm 3, prototipten) ---------------- */

export const HALF_W = 7.2;
export const HALL_LEN = 40;
export const CEIL_H = 6;
export const Z_MIN = -15;
export const Z_MAX = 15;
export const CHAR_BOUND_X = HALF_W - 1;
export const SPEED = 4.6;

export const CAMERA_FOV = 48;
/**
 * **Portrede FOV uyarlanır (revizyon 2026-09-18).** `CAMERA_FOV` DİKEY açıdır; 390×844'te
 * yatay karşılığı ≈ 23° kalıyordu — salon tünel gibi okunuyordu. Yatay açıyı hedefleyip dikeyi
 * en-boy oranından türetiyoruz:
 *
 *   vFov = 2·atan( tan(FOV_H_TARGET/2) / aspect )   →   clamp(FOV_MIN, FOV_MAX)
 *
 * Masaüstünde (16:9) türetilen değer 27° çıkar ve `FOV_MIN = 48`'e takılır: **masaüstünde
 * hiçbir şey değişmez.** `FOV_MAX = 72` şart — üst sınır olmadan portrede balık gözü olur.
 */
export const FOV_H_TARGET = 46;
export const FOV_MIN = 48;
export const FOV_MAX = 72;

/** En-boy oranına göre dikey FOV (derece). */
export function fovForAspect(aspect: number) {
  const hTarget = (FOV_H_TARGET * Math.PI) / 180;
  const vFov = 2 * Math.atan(Math.tan(hTarget / 2) / aspect);
  const deg = (vFov * 180) / Math.PI;
  return deg < FOV_MIN ? FOV_MIN : deg > FOV_MAX ? FOV_MAX : deg;
}

/**
 * FOV'u kameraya uygular. Kural 25: hook'tan dönen nesnenin mutasyonu bileşen içinde yasak —
 * değişiklik ayrı modüldeki plain fonksiyonda olur, hook yalnızca çağırır (`applyLerp` gibi).
 * `three` import etmemek için yapısal tip kullanılıyor.
 */
export function applyAdaptiveFov(
  camera: { isPerspectiveCamera?: boolean; fov: number; updateProjectionMatrix: () => void },
  width: number,
  height: number,
) {
  if (!camera.isPerspectiveCamera || !height) return;
  camera.fov = fovForAspect(width / height);
  camera.updateProjectionMatrix();
}
export const CAM_DIST = 5.4;
export const CAM_HEIGHT = 2.45;
export const CAM_LERP = 0.09;
export const LOOK_AHEAD = 3.0;
export const LOOK_HEIGHT = 1.55;
/** Kamera dönüşü — 180° ≈ 1.2 sn. `1 - pow(BASE, dt)` biçiminde kullanılır. */
export const TURN_BASE = 0.15;
/**
 * Karakter dönüşü — kameradan **belirgin** hızlı (revizyon 2026-09-18: 0.02 → 0.002).
 *
 * Neden: sprite'ın hangi görünümde çizileceğini karakter ile kamera arasındaki ayrışma belirler
 * (spec 8.1). Ayrışmanın tepe değeri `dönüş açısı × max_t(TURN_BASE^t − CHAR_TURN_BASE^t)`.
 * 0.02 ile bu oran %26.1 → 180°'lik dönüşte yalnızca **46.9°**, yani hep `back`/`back34`:
 * `side` (≥67.5°) hiç tetiklenmiyordu ve çizerden istenecek 8 çizimin ikisi ölü kalacaktı.
 *
 * Ara değerler ölçüldü: 0.005 → %36.2 → **65.2°**, hâlâ `side` eşiğinin **altında** (2.3° farkla).
 * 0.002 → %41.2 → **74.2°** → `side` tetikleniyor, eşiğe 6.7° pay var. Karakter dönüşü %90'ını
 * 0.37 sn'de tamamlıyor (0.02'de 0.59 sn), kamera 1.2 sn'de yetişiyor.
 *
 * `front` (≥112.5°) sürekli girdiyle ulaşılamaz (tavan %44.5 → 80°); o görünüm
 * `CharacterSelect` ve NPC içindir.
 */
export const CHAR_TURN_BASE = 0.002;

export const FRAME_PROXIMITY = 2.6;
/** Görünür yarıçap 2.3 < tetikleme 2.6 — halka tetikleme alanının İÇİNDE kalır. */
export const MARKER_SIZE = 4.6;
export const PROMPT_HEIGHT = 1.35;

export const POV_DISTANCE = 3.25;
export const POV_LERP = 0.055;
export const POV_HEIGHT = 2.65;

/** Çerçevenin önündeki durma noktası — yakınlık, prompt ve halka buna göre hesaplanır. */
export function frameStop(frame: ZoneFrame): [number, number, number] {
  return [frame.side * (HALF_W - 1.6), 0, frame.z];
}

/**
 * Prompt'un dünya çapası (spec 5.2, revize 2026-09-18).
 *
 * Tablo düzlemi `side * (HALF_W - 0.12)`'de; prompt oradan salona doğru **0.9 birim önde**
 * asılır. Gerekçe: prompt tablonun ÜSTÜNDE değil ÖNÜNDE duran bir tabela gibi durur,
 * karakter duvara dayanınca kamera ile tablo arasına girmez, `FloorMarker` halkasıyla
 * dikey olarak hizalanır.
 *
 * `frameStop` DEĞİL: durma noktası (HALF_W − 1.6) kullanıcının basacağı yer; prompt ise
 * tabloya daha yakın asılır.
 */
export const PROMPT_FORWARD = 0.9;

export function promptAnchor(frame: ZoneFrame): [number, number, number] {
  return [frame.side * (HALF_W - 0.12 - PROMPT_FORWARD), PROMPT_HEIGHT, frame.z];
}

/** POV kamera hedefi ve bakış noktası (spec 6.1). */
export function povTargets(frame: ZoneFrame) {
  const fx = frame.side * (HALF_W - 0.12);
  return {
    camTarget: [fx - frame.side * POV_DISTANCE, POV_HEIGHT, frame.z] as [number, number, number],
    lookTarget: [fx, POV_HEIGHT, frame.z] as [number, number, number],
  };
}

export const getFrame = (id: FrameId) => ZONE_FRAMES.find((f) => f.id === id);
