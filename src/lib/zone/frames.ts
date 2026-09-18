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
export const CAM_DIST = 5.4;
export const CAM_HEIGHT = 2.45;
export const CAM_LERP = 0.09;
export const LOOK_AHEAD = 3.0;
export const LOOK_HEIGHT = 1.55;
/** Kamera dönüşü — 180° ≈ 1.2 sn. `1 - pow(BASE, dt)` biçiminde kullanılır. */
export const TURN_BASE = 0.15;
/** Karakter dönüşü, kameradan hızlı. */
export const CHAR_TURN_BASE = 0.02;

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

/** POV kamera hedefi ve bakış noktası (spec 6.1). */
export function povTargets(frame: ZoneFrame) {
  const fx = frame.side * (HALF_W - 0.12);
  return {
    camTarget: [fx - frame.side * POV_DISTANCE, POV_HEIGHT, frame.z] as [number, number, number],
    lookTarget: [fx, POV_HEIGHT, frame.z] as [number, number, number],
  };
}

export const getFrame = (id: FrameId) => ZONE_FRAMES.find((f) => f.id === id);
