"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { normalizeAngle } from "@/lib/zone/angles";
import {
  acquireCharacterSet,
  mirrorFor,
  releaseCharacterSet,
  viewFor,
} from "@/lib/zone/character";
import { CHAR_START, reportSprite, stepWorld, zoneRuntime } from "@/lib/zone/runtime";
import { acquireShadowTexture, releaseShadowTexture } from "@/lib/zone/textures";
import type { Character as CharacterId } from "@/store/zone";

/**
 * Misu / Miyu — salonu gezen karakter (spec bölüm 8).
 *
 * Bu bileşen Zone'un **simülasyon adımını** sürer: `stepWorld()` girdiyi okur, konumu ve iki
 * açıyı günceller; kalanı mesh'e uygulanır. `useFollowCamera` bir sonraki adımda yalnızca
 * `cam.ang`'ı kullanır.
 */

/** Prototipteki düzlem ölçüleri. */
const SPRITE_SIZE: [number, number] = [1.3, 1.66];
const SHADOW_SIZE: [number, number] = [1.5, 1.1];

export function Character({ who, reduced }: { who: CharacterId; reduced: boolean }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const maxAniso = gl.capabilities.getMaxAnisotropy();

  const hero = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);

  // Sahne kapanınca tekil sprite seti ve gölge dokusu bırakılır (spec bölüm 9).
  useEffect(
    () => () => {
      releaseCharacterSet();
      releaseShadowTexture();
    },
    [],
  );

  useFrame((_, delta) => {
    // Sekme arkaplandayken delta birikir; sıçramayı 50 ms'te keseriz.
    const dt = Math.min(delta, 0.05);
    const { lean } = stepWorld(dt, reduced);

    const mesh = hero.current;
    if (!mesh) return;
    const { char, cam } = zoneRuntime();
    const sprite = acquireCharacterSet(who, maxAniso);

    /* ---- açıya göre sprite + aynalama (spec 8.1) ----
       `rel`, karakterin kameraya göre duruşu: 0 = sırtı bize dönük, ±π = yüzü bize dönük.
       Karakter kameradan hızlı döndüğü için 180°'lik bir dönüşte önce yüzünü görürüz. */
    const rel = normalizeAngle(char.ang - cam.ang);
    const view = viewFor(rel);
    const mirrored = mirrorFor(rel, view);
    const mat = mesh.material as THREE.MeshBasicMaterial;
    if (mat.map !== sprite[view]) {
      mat.map = sprite[view];
      mat.needsUpdate = true;
    }
    reportSprite(view, mirrored, sprite.source);

    /* ---- billboard (spec 8.3) ----
       Düzlem kameraya DÖNMEZSE, kamera karakterin öbür tarafına geçtiği anda — ki yön takipli
       kamerada bu her 180° dönüşte oluyor — arka yüz görünür ve `FrontSide` onu kırpar:
       karakter kaybolur. (Prototipte bu adım yazılmamış: `hero.rotation.y` hep 0.)
       Yalnızca Y ekseninde döndürüyoruz — karakter dik kalır, kamera yükselse bile yatmaz.
       Euler sırası XYZ olduğu için `z` (lean) ÖNCE, karakterin kendi düzleminde uygulanır;
       billboard açısı sonra gelir. İkisi doğru sırayla birleşir. */
    mesh.rotation.set(
      0,
      Math.atan2(camera.position.x - char.x, camera.position.z - char.z),
      lean ?? mesh.rotation.z * 0.85,
    );
    mesh.position.set(char.x, char.y, char.z);
    mesh.scale.x = mirrored ? -1 : 1;

    /* ---- gölge: gölge haritası kapalı, canvas'tan düzlem (spec 3.1) ---- */
    const sh = shadow.current;
    if (sh) {
      const shMat = sh.material as THREE.MeshBasicMaterial;
      if (!shMat.map) {
        shMat.map = acquireShadowTexture(maxAniso);
        shMat.needsUpdate = true;
      }
      sh.position.set(char.x, 0.02, char.z);
      // Zıplarken gölge hafifçe büyür — yerden koptuğu hissi.
      sh.scale.setScalar(1 + (char.y - CHAR_START.y) * 0.6);
    }
  });

  return (
    <group>
      <mesh ref={hero} name="zone-char" position={[CHAR_START.x, CHAR_START.y, CHAR_START.z]}>
        <planeGeometry args={SPRITE_SIZE} />
        {/* `map` her karede atanır (açıya göre değişiyor). `alphaTest`: tamamen saydam
            pikseller derinlik yazmaz → karakterin görünmez dikdörtgeni arkasındaki salonu
            kesmez. */}
        <meshBasicMaterial transparent alphaTest={0.05} toneMapped={false} />
      </mesh>
      <mesh
        ref={shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[CHAR_START.x, 0.02, CHAR_START.z]}
      >
        <planeGeometry args={SHADOW_SIZE} />
        {/* `map` useFrame'de takılır — hero sprite'ıyla aynı kalıp. */}
        <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
