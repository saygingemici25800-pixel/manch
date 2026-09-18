"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { acquireCharacterSet } from "@/lib/zone/character";
import { acquireShadowTexture } from "@/lib/zone/textures";
import type { Character as CharacterId } from "@/store/zone";

/**
 * Seçilmeyen maskot (spec 8.3): salonun dibinde durur, `front` görünümüyle bakar, hafif idle.
 *
 * Oyuncudan farkı: yürümez, açıya göre görünüm değiştirmez — ama **billboard yapar**. Kamera
 * salonda dönerek onun arkasına geçebiliyor; dönmeyen düzlem orada da kırpılırdı (Kural 63 ⑤).
 */

const POS = { x: -3.2, y: 0.7, z: -12 } as const;
const SPRITE_SIZE: [number, number] = [1.1, 1.4];
const SHADOW_SIZE: [number, number] = [1.2, 0.88];
/** Idle: yavaş ve küçük — duran bir figür, nefes alıyor gibi. */
const IDLE_SPEED = 2;
const IDLE_AMPLITUDE = 0.04;

export function Npc({ who, reduced }: { who: CharacterId; reduced: boolean }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const maxAniso = gl.capabilities.getMaxAnisotropy();
  const sprite = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = sprite.current;
    if (!mesh) return;

    const mat = mesh.material as THREE.MeshBasicMaterial;
    const front = acquireCharacterSet(who, maxAniso).front;
    if (mat.map !== front) {
      mat.map = front;
      mat.needsUpdate = true;
    }

    mesh.position.y = reduced
      ? POS.y
      : POS.y + Math.sin(state.clock.elapsedTime * IDLE_SPEED) * IDLE_AMPLITUDE;
    mesh.rotation.y = Math.atan2(camera.position.x - POS.x, camera.position.z - POS.z);

    const sh = shadow.current;
    if (sh) {
      const shMat = sh.material as THREE.MeshBasicMaterial;
      if (!shMat.map) {
        shMat.map = acquireShadowTexture(maxAniso);
        shMat.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <mesh ref={sprite} name="zone-npc" position={[POS.x, POS.y, POS.z]}>
        <planeGeometry args={SPRITE_SIZE} />
        <meshBasicMaterial transparent alphaTest={0.05} toneMapped={false} />
      </mesh>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[POS.x, 0.02, POS.z]}>
        <planeGeometry args={SHADOW_SIZE} />
        <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
