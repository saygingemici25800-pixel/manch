"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

import {
  applyAdaptiveFov,
  CAM_DIST,
  CAM_HEIGHT,
  CAM_LERP,
  HALF_W,
  LOOK_AHEAD,
  LOOK_HEIGHT,
} from "@/lib/zone/frames";
import { zoneRuntime } from "@/lib/zone/runtime";

/**
 * Yön takipli 3. şahıs kamera (spec bölüm 3.1).
 *
 * Kamera sabit bakmaz: **yürünen yönün arkasında durur, önüne bakar.** Karakter yana kaymaz —
 * sağa basınca kamera sağa döner, karakter yine ileri yürür.
 *
 * Açının kendisi burada DEĞİL, `stepWorld()` içinde döndürülür (karakter ve kamera aynı hedefe
 * farklı hızlarda dönmek zorunda). Bu hook o açıyı kamera konumuna çevirir, o kadar.
 */

/** Kamera duvarın/kapının içine girmesin — salon z −20..20, pay 0.8. */
const CAM_Z_BOUND = 19.2;
const CAM_X_BOUND = HALF_W - 0.7;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Kare başına Vector3 üretmemek için tek çalışma nesnesi (Zone tekil — modül seviyesi güvenli). */
const target = new THREE.Vector3();

export function useFollowCamera() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  /**
   * Ekran oranı değişince dikey FOV yeniden türetilir (bkz. `fovForAspect`): portrede salon
   * tünel gibi okunmasın. R3F `aspect`'i kendisi günceller, `fov`'u güncellemez.
   */
  useEffect(() => {
    applyAdaptiveFov(camera as THREE.PerspectiveCamera, size.width, size.height);
  }, [camera, size]);

  useFrame(() => {
    const { char, cam } = zoneRuntime();
    const fx = Math.sin(cam.ang);
    const fz = Math.cos(cam.ang);

    const cx = clamp(char.x - fx * CAM_DIST, -CAM_X_BOUND, CAM_X_BOUND);
    const cz = clamp(char.z - fz * CAM_DIST, -CAM_Z_BOUND, CAM_Z_BOUND);

    camera.position.lerp(target.set(cx, CAM_HEIGHT, cz), CAM_LERP);
    // Bakış noktası karakterin ÖNÜ — karakter kadrajın altında kalır, salon görünür.
    camera.lookAt(char.x + fx * LOOK_AHEAD, LOOK_HEIGHT, char.z + fz * LOOK_AHEAD);
  });
}
