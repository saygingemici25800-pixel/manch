"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import * as THREE from "three";

import { acquireArt } from "@/lib/zone/art";
import { HALF_W, type ZoneFrame } from "@/lib/zone/frames";
import { colors } from "@/styles/tokens";

/**
 * Duvardaki tablo (spec bölüm 5): ink kutu + krem paspartu + görsel düzlemi,
 * üstünde duvara vuran hardal spot bandı.
 *
 * Ölçüler prototipten: çerçeve 1.9 × 2.7, y = 2.65; spot bandı 3.2 × 0.06, y = 4.4.
 */

const FW = 1.9;
const FH = 2.7;
/** Çerçeve duvarın 12 cm önünde; paspartu ve görsel onun da önünde (z-fighting yok). */
const WALL_GAP = 0.12;
const SPOT_Y = 4.4;

export function Frame({ frame }: { frame: ZoneFrame }) {
  const t = useTranslations("Zone");
  const gl = useThree((s) => s.gl);
  const maxAniso = gl.capabilities.getMaxAnisotropy();
  const art = useRef<THREE.Mesh>(null);

  // Sol duvar +90°, sağ duvar −90° döner: tablo hep salona bakar.
  const rotY = frame.side > 0 ? -Math.PI / 2 : Math.PI / 2;

  useFrame(() => {
    const mesh = art.current;
    if (!mesh) return;
    const texture = acquireArt(
      frame.id,
      frame.art,
      {
        title: t(`frames.${frame.id}`),
        kicker: t(`kickers.${frame.id}`),
        waiting: t("artWaiting"),
      },
      maxAniso,
    ).texture;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    if (mat.map !== texture) {
      mat.map = texture;
      mat.needsUpdate = true;
    }
  });

  return (
    <>
      <group position={[frame.side * (HALF_W - WALL_GAP), 2.65, frame.z]} rotation={[0, rotY, 0]}>
        <mesh>
          <boxGeometry args={[FW + 0.28, FH + 0.28, 0.14]} />
          <meshStandardMaterial color={colors.ink} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[FW, FH]} />
          <meshStandardMaterial color={colors.cream} roughness={0.9} />
        </mesh>
        {/* Görsel `useFrame`'de takılır: yer tutucu → gerçek fotoğraf geçişi orada olur. */}
        <mesh ref={art} position={[0, 0, 0.09]}>
          <planeGeometry args={[FW - 0.34, FH - 0.5]} />
          <meshBasicMaterial toneMapped={false} />
        </mesh>
      </group>

      {/* spot bandı — tablonun üstünde duvara vuran ışık çizgisi */}
      <mesh
        position={[frame.side * (HALF_W - 0.1), SPOT_Y, frame.z]}
        rotation={[0, rotY, 0]}
      >
        <planeGeometry args={[3.2, 0.06]} />
        <meshBasicMaterial color={colors.mustard} transparent opacity={0.6} toneMapped={false} />
      </mesh>
    </>
  );
}
