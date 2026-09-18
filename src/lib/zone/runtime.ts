/**
 * Zone'un kare-başına değişen durumu ve onu değiştiren SAF fonksiyonlar.
 *
 * Neden Zustand değil: bunlar her karede değişir; store'a yazmak saniyede 60 render demek olur.
 *
 * Neden `useRef` / `useState` de değil: React Compiler kuralları (Kural 25) prop, hook argümanı
 * ve `useState` çıktısının **mutasyonunu yasaklıyor**. Kuralın öngördüğü çıkış yolu zaten bu:
 * mutasyon ayrı bir modülde, plain fonksiyonların içinde olur; bileşen yalnızca çağırır.
 * `transition-title.ts` de aynı kalıpta.
 *
 * Zone tam ekran ve tekildir; modül seviyesinde tek bir dünya durumu doğru modeldir.
 * `resetRuntime()` sahne her kurulduğunda çağrılır (yerinde sıfırlar, kimlik değişmez).
 */
import { angLerp, smoothing, wantedAngle } from "@/lib/zone/angles";
import type { CharView } from "@/lib/zone/character";
import { CHAR_BOUND_X, CHAR_TURN_BASE, SPEED, TURN_BASE, Z_MAX, Z_MIN } from "@/lib/zone/frames";

export interface ZoneRuntime {
  /** Karakterin dünya konumu, baktığı yön ve yürüme fazı. */
  char: { x: number; y: number; z: number; ang: number; bob: number };
  /** Kameranın baktığı yön (radyan; 0 = +z, π = −z). Karakterden YAVAŞ döner. */
  cam: { ang: number };
  /** Bu karenin normalize edilmiş girdi vektörü (spec 7.3). */
  input: { ix: number; iz: number; len: number };
  /** Joystick çıktısı −1..1 (5.5.6'da `Joystick` yazar, şimdilik hep 0). */
  joy: { x: number; y: number };
  /** Basılı tuşlar, küçük harf. */
  keys: Set<string>;
  /** Yalnızca gözlem: ekrandaki sprite. Sahne yazar, lab/QA okur. */
  debug: { view: CharView; mirrored: boolean; source: "drawn" | "png" };
}

/** Salona giriş noktası — prototiple aynı (spec bölüm 3: z −15..15). */
export const CHAR_START = { x: 0, y: 0.83, z: 12 } as const;

/**
 * Başlangıç bakışı **−z**, yani salonun dibindeki künyeye. `wantedAngle(0,-1) === π` olduğu için
 * "ileri yürümek" (W) açıyı değiştirmez: kamera ilk karede yerinden oynamaz.
 */
export const CAM_START_ANG = Math.PI;

const runtime: ZoneRuntime = {
  char: { x: CHAR_START.x, y: CHAR_START.y, z: CHAR_START.z, ang: CAM_START_ANG, bob: 0 },
  cam: { ang: CAM_START_ANG },
  input: { ix: 0, iz: 0, len: 0 },
  joy: { x: 0, y: 0 },
  keys: new Set<string>(),
  debug: { view: "back", mirrored: false, source: "drawn" },
};

/** Okumak serbest; yazmak yalnızca aşağıdaki fonksiyonlarla. */
export const zoneRuntime = (): Readonly<ZoneRuntime> => runtime;

/** Sahne her kurulduğunda: nesnenin KİMLİĞİ korunur, alanları yerinde sıfırlanır. */
export function resetRuntime() {
  runtime.char.x = CHAR_START.x;
  runtime.char.y = CHAR_START.y;
  runtime.char.z = CHAR_START.z;
  runtime.char.ang = CAM_START_ANG;
  runtime.char.bob = 0;
  runtime.cam.ang = CAM_START_ANG;
  runtime.input.ix = 0;
  runtime.input.iz = 0;
  runtime.input.len = 0;
  runtime.joy.x = 0;
  runtime.joy.y = 0;
  runtime.keys.clear();
  runtime.debug.view = "back";
  runtime.debug.mirrored = false;
}

/* ---------------------------------- girdi ---------------------------------- */

export const pressKey = (k: string) => runtime.keys.add(k);
export const releaseKey = (k: string) => runtime.keys.delete(k);

/**
 * Tuşları ve joystick'i bırakır. Sekme değişince / pencere odağı gidince tuş "basılı kalır"
 * ve karakter kendiliğinden yürür — klasik hata; `blur` bunu çağırır (spec 7.1 joystick için de
 * aynısını ister).
 */
export function releaseAllInput() {
  runtime.keys.clear();
  runtime.joy.x = 0;
  runtime.joy.y = 0;
}

/** 5.5.6: `Joystick` bunu çağırır. Değerler −1..1. */
export function setJoystick(x: number, y: number) {
  runtime.joy.x = x;
  runtime.joy.y = y;
}

const LEFT = ["a", "arrowleft"];
const RIGHT = ["d", "arrowright"];
const UP = ["w", "arrowup"];
const DOWN = ["s", "arrowdown"];

const held = (list: string[]) => list.some((k) => runtime.keys.has(k));

/**
 * Bu karenin girdi vektörü (spec 7.3). Klavye ve joystick TOPLANIR (ikisi aynı anda
 * kullanılabilir), sonra 1'e normalize edilir — çapraz yürürken hızlanmayı bu engeller.
 *
 * **Girdi dünyaya göredir, kameraya göre değil (spec 7.4):** `W` her zaman −z, `D` her zaman +x.
 * Girdiyi `camAng` ile DÖNDÜRMÜYORUZ. Bu bir oyun değil, bir galeri; kamera dönerken yön de
 * kayarsa kullanıcı nereye bastığını şaşırır. Kamera yönü yalnızca **görüntüyü** belirler.
 */
export function readInput() {
  let ix = (held(RIGHT) ? 1 : 0) - (held(LEFT) ? 1 : 0) + runtime.joy.x;
  let iz = (held(DOWN) ? 1 : 0) - (held(UP) ? 1 : 0) + runtime.joy.y;
  let len = Math.hypot(ix, iz);
  if (len > 1) {
    ix /= len;
    iz /= len;
    len = 1;
  }
  runtime.input.ix = ix;
  runtime.input.iz = iz;
  runtime.input.len = len;
  return runtime.input;
}

/* -------------------------------- simülasyon -------------------------------- */

/** Joystick merkeze dönerken kalan gürültü kamerayı oynatmasın. */
const MOVING = 0.05;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Bir simülasyon adımı: girdi → konum → **iki açı**. Kare başına tam bir kez çağrılır.
 *
 * `char.ang` ve `cam.ang` aynı `want` hedefinden, aynı karede, farklı hızlarda döner
 * (0.02 ve 0.15 tabanı). İkisini ayrı yerlerde hesaplamak ayrışmalarına açık kapı bırakırdı —
 * aradaki fark sprite'ın hangi açıdan çizileceğini belirliyor (spec 8.1).
 */
export function stepWorld(dt: number, reduced: boolean) {
  const { ix, iz, len } = readInput();
  const { char, cam } = runtime;

  // yürüme: dünya eksenlerinde, salon sınırları içinde
  char.x = clamp(char.x + ix * SPEED * dt, -CHAR_BOUND_X, CHAR_BOUND_X);
  char.z = clamp(char.z + iz * SPEED * dt, Z_MIN, Z_MAX);

  if (len > MOVING) {
    const want = wantedAngle(ix, iz);
    // Karakter HIZLI döner (taban 0.02) — basar basmaz o yöne bakar.
    char.ang = angLerp(char.ang, want, smoothing(CHAR_TURN_BASE, dt));
    // Kamera YAVAŞ döner (taban 0.15, 180° ≈ 1.2 sn) — geriden takip eder.
    // reduced-motion: kamera HİÇ dönmez; ani dönüş yavaş dönüşten rahatsız edicidir (spec 3.1).
    if (!reduced) cam.ang = angLerp(cam.ang, want, smoothing(TURN_BASE, dt));
  }
  // Girdi bitince `cam.ang` yerinde kalır — kamera kendi kendine eski yönüne DÖNMEZ.

  // bob: yürürken hafif zıplama (spec 8.3)
  if (len > MOVING && !reduced) {
    char.bob += dt * 11;
    char.y = CHAR_START.y + Math.abs(Math.sin(char.bob)) * 0.07;
  } else {
    char.y += (CHAR_START.y - char.y) * 0.2;
  }

  return { moving: len > MOVING, lean: len > MOVING && !reduced ? Math.sin(char.bob) * 0.05 : null };
}

/** Sahne ekrandaki sprite'ı buraya bildirir; `__ZONE_STATS__` okur. */
export function reportSprite(view: CharView, mirrored: boolean, source: "drawn" | "png") {
  runtime.debug.view = view;
  runtime.debug.mirrored = mirrored;
  runtime.debug.source = source;
}
