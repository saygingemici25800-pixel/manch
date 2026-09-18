/**
 * Açı matematiği (spec bölüm 3.1) — yön takipli kameranın üç tuzağı burada kapatılır.
 * Saf fonksiyonlar: sahneye bağlı değil, tarayıcı gerektirmez, tek tek doğrulanabilir.
 *
 * Prototipte üçü de bir kez yaşandı ve düzeltildi
 * (`docs/reference/manch-zone-prototype.html`, `angLerp` + `1-Math.pow(...)`).
 */

const TAU = Math.PI * 2;

/** −π .. π aralığına indirger. `atan2` çıktısıyla aynı aralık. */
export function normalizeAngle(a: number): number {
  return (((a + Math.PI) % TAU) + TAU) % TAU - Math.PI;
}

/**
 * **Tuzak (c): sabit yumuşatma katsayısı kare hızına bağımlıdır.**
 *
 * `a += (b-a) * 0.08` her karede aynı oranı uygular; 120 Hz'de 60 Hz'in iki katı hızlı döner.
 * Doğru biçim `1 - base^dt`: `base`, dönüşün **bir saniyede** ne kadarının KALDIĞIdır.
 * Bu yüzden 60 Hz'de iki adım, 30 Hz'de bir adımla birebir aynı sonucu verir
 * (`1-(1-s60)² === s30`) — `scripts/zone-camera-check.mjs` bunu sayısal olarak doğrular.
 */
export function smoothing(base: number, dt: number): number {
  return 1 - Math.pow(base, dt);
}

/**
 * Açılar için lerp.
 *
 * **Tuzak (a): düz `lerp` ±π'de kamerayı ters yöne fırlatır.** 3.1 → −3.1 arası gerçekte
 * 0.08 radyanlık bir adımdır; düz lerp bunu 6.2 radyanlık ters yolculuk sanır. Farkı önce
 * −π..π aralığına indiriyoruz: her zaman KISA yoldan dönülür.
 *
 * **Tuzak (b): tam 180°'de iki dönüş yönü eşit uzaklıktadır.** `d` tam ±π olduğunda taraf
 * matematiksel olarak seçilemez: kayan nokta gürültüsü her karede işaret değiştirir → kamera
 * titrer ya da hiç dönmez. ("Aşağı çekince arkaya dönmüyor" şikâyetinin sebebi tam olarak budur.)
 * Beraberliği bilerek bozuyoruz: eşiğe düşen fark sabit olarak **pozitif** yöne çekilir.
 */
export function angLerp(a: number, b: number, t: number): number {
  let d = normalizeAngle(b - a);
  if (Math.abs(Math.abs(d) - Math.PI) < 1e-3) d = Math.PI * 0.999;
  return a + d * t;
}

/** Girdi vektöründen istenen yön. `0 = +z`, `π = −z` (prototiple aynı eksen düzeni). */
export const wantedAngle = (ix: number, iz: number) => Math.atan2(ix, iz);
