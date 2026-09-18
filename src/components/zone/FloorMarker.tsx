"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { frameStop, MARKER_SIZE, type ZoneFrame } from "@/lib/zone/frames";
import { acquireTexture, markerTexture, pulseTexture } from "@/lib/zone/textures";
import { useZoneStore } from "@/store/zone";
import { colors } from "@/styles/tokens";

/**
 * Tablonun önündeki zemin halkası (spec 5.1). İşlevi: **tıklamanın nerede açılacağını
 * göstermek.** İki düzlem, yere yatık, `depthWrite` kapalı:
 *
 *   halka (y 0.014) — yavaş döner, yaklaşınca parlar
 *   nabız (y 0.016) — 0.5'ten 1.5'e büyüyerek söner, yaklaşınca hızlanır
 *
 * **Ölçü ilişkisi kritik:** `MARKER_SIZE = 4.6` → görünür yarıçap 2.3, tetikleme 2.6.
 * Halka tetikleme alanının İÇİNDE kalır; "halkanın üstündeyim ama açılmadı" olmaz.
 * İkisi birlikte değişir.
 */

export function FloorMarker({ frame, reduced }: { frame: ZoneFrame; reduced: boolean }) {
  const gl = useThree((s) => s.gl);
  const maxAniso = gl.capabilities.getMaxAnisotropy();
  const ring = useRef<THREE.Mesh>(null);
  const pulse = useRef<THREE.Mesh>(null);
  /** Yakınlık vurgusu 0→1 arasında yumuşar; ani yanıp sönme olmaz. */
  const glow = useRef(0);

  const [x, , z] = frameStop(frame);

  useFrame((state, delta) => {
    const r = ring.current;
    const pl = pulse.current;
    if (!r || !pl) return;
    const dt = Math.min(delta, 0.05);

    const rMat = r.material as THREE.MeshBasicMaterial;
    const pMat = pl.material as THREE.MeshBasicMaterial;
    if (!rMat.map) {
      rMat.map = acquireTexture("marker", String(maxAniso), () => markerTexture(maxAniso));
      rMat.needsUpdate = true;
    }
    if (!pMat.map) {
      pMat.map = acquireTexture("pulse", String(maxAniso), () => pulseTexture(maxAniso));
      pMat.needsUpdate = true;
    }

    // Store'a ABONE OLMUYORUZ: yakınlık her karede okunuyor ama React render etmiyor.
    const zone = useZoneStore.getState();
    // spec bölüm 9: POV'da sahne render'ı sürer ama halka nabzı DURUR.
    if (zone.state === "pov") return;
    const near = zone.nearFrame === frame.id ? 1 : 0;
    glow.current += (near - glow.current) * Math.min(1, dt * 6);
    const g = glow.current;

    if (reduced) {
      // Dönmez, atmaz: yaklaşınca sabit vurgu (spec 5.1).
      r.rotation.z = 0;
      rMat.opacity = g * 0.35;
      pMat.opacity = 0;
      pl.scale.setScalar(1);
      return;
    }

    const now = state.clock.elapsedTime;
    r.rotation.z = -now * 0.18;
    rMat.opacity = 0.3 + g * 0.55;

    const ph = (now * (0.75 + g * 0.85)) % 1;
    const scale = 0.5 + ph;
    pl.scale.set(scale, scale, 1);
    pMat.opacity = (1 - ph) * (0.22 + g * 0.5);
  });

  return (
    <group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014, z]}>
        <planeGeometry args={[MARKER_SIZE, MARKER_SIZE]} />
        <meshBasicMaterial transparent opacity={0.3} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Nabız beyaz çizilir, materyalde hardala boyanır. */}
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.016, z]}>
        <planeGeometry args={[MARKER_SIZE, MARKER_SIZE]} />
        <meshBasicMaterial
          color={colors.mustard}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
