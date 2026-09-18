"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { consumeFootstep } from "@/lib/zone/runtime";
import { acquireTexture, footprintTexture } from "@/lib/zone/textures";

/**
 * Ayak izleri (spec 8.3) — 18'lik havuz, sönen decal'lar.
 *
 * Havuz sabit: yeni iz üretilmez, en eskisi yeniden kullanılır. 18 × 0.26 sn ≈ 4.7 sn'lik iz
 * demek; opaklık saniyede 0.28 azaldığı için (0.85 → 0 ≈ 3 sn) en eskisi zaten sönmüş oluyor,
 * yani yeniden kullanım göze çarpmaz.
 *
 * İzin **konumu ve dönüşü hareket yönünden** gelir (kamera yönünden değil) — `stepWorld`
 * hesaplar, burası yalnızca basar.
 */

const POOL = 18;
/** Opaklık saniyede bu kadar azalır. */
const FADE = 0.28;
const START_OPACITY = 0.85;
const SIZE: [number, number] = [0.22, 0.3];

export function Footprints() {
  const gl = useThree((s) => s.gl);
  const maxAniso = gl.capabilities.getMaxAnisotropy();
  const group = useRef<THREE.Group>(null);
  // Havuzda sıradaki decal. Tek sayı, React'e görünmesi gerekmiyor.
  const next = useRef(0);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);

    const stepped = consumeFootstep();
    if (stepped) {
      const mesh = g.children[next.current % POOL] as THREE.Mesh;
      next.current += 1;
      mesh.position.set(stepped.x, 0.012, stepped.z);
      mesh.rotation.z = stepped.rot;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      // Doku ilk basışta takılır — hero sprite'ıyla aynı kalıp (JSX'te ref okumak yasak).
      if (!mat.map) {
        mat.map = acquireTexture("footprint", String(maxAniso), () => footprintTexture(maxAniso));
        mat.needsUpdate = true;
      }
      mat.opacity = START_OPACITY;
    }

    for (const child of g.children) {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat.opacity > 0) mat.opacity = Math.max(0, mat.opacity - dt * FADE);
    }
  });

  return (
    <group ref={group} name="zone-footprints">
      {Array.from({ length: POOL }, (_, i) => (
        // `rotation.x` düzlemi yere yatırır; `rotation.z` basıldığında yön alır.
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <planeGeometry args={SIZE} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
