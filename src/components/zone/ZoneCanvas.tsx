"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { Hall } from "@/components/zone/Hall";
import { CAMERA_FOV, CAM_HEIGHT } from "@/lib/zone/frames";
import { colors } from "@/styles/tokens";

/**
 * Zone sahnesinin kabı (spec bölüm 1, 3.1, 9).
 *
 * **Asla sunucuda render edilmez** — çağıran taraf `next/dynamic` + `{ ssr: false }` kullanır.
 *
 * Dispose disiplini baştan kuruludur (spec bölüm 9): unmount'ta renderer, tüm geometry /
 * material / texture ve rAF bırakılır. Sonradan eklenmesi zor, şimdi ucuz.
 */

/** Dev/QA: canlı WebGL bağlamı sayacı — sızıntı testi bunu okur. */
const stats = { created: 0, disposed: 0 };
/** Dev/QA: aktif sahne — lab testleri mesh sayısı/konumunu buradan doğrular. */
let liveScene: THREE.Scene | null = null;

function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const m of mats) {
      // Materyalin taşıdığı tüm doku slotları
      for (const key of Object.keys(m) as (keyof THREE.Material)[]) {
        const v = (m as unknown as Record<string, unknown>)[key as string];
        if (v && typeof v === "object" && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
      }
      m.dispose();
    }
  });
  scene.clear();
}

export function ZoneCanvas({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Dev sayaçları — sadece development'ta (prod'da tree-shake).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as Record<string, unknown>;
    w.__ZONE_STATS__ = () => ({
      created: stats.created,
      disposed: stats.disposed,
      /** 0 olmalı: her mount kendi bağlamını unmount'ta bırakır. */
      alive: stats.created - stats.disposed,
      canvases: document.querySelectorAll("canvas").length,
      meshes: liveScene
        ? (() => {
            const out: { x: number; y: number; z: number }[] = [];
            liveScene.traverse((o) => {
              if ((o as THREE.Mesh).isMesh) {
                out.push({
                  x: +o.position.x.toFixed(2),
                  y: +o.position.y.toFixed(2),
                  z: +o.position.z.toFixed(2),
                });
              }
            });
            return out;
          })()
        : null,
      fog: liveScene?.fog ? `${(liveScene.fog as THREE.Fog).near}-${(liveScene.fog as THREE.Fog).far}` : null,
    });
    return () => {
      delete w.__ZONE_STATS__;
    };
  }, []);

  return (
    <div ref={rootRef} className={className}>
      <Canvas
        // Kural/spec 9: retina'da 2 ile sınırla, yoksa mobilde fps düşer.
        dpr={typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2)}
        camera={{ fov: CAMERA_FOV, position: [0, CAM_HEIGHT, 14], near: 0.1, far: 120 }}
        // Gölge haritası KAPALI — karakterin altında canvas'tan üretilen yumuşak gölge var.
        shadows={false}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl, scene, camera }) => {
          stats.created += 1;
          gl.setClearColor(colors.cream);
          scene.fog = new THREE.Fog(colors.cream, 26, 52);
          camera.lookAt(0, 1.55, 0);
        }}
      >
        {/* spec 3.1 — gölgesiz, iki yönlü ışık */}
        <ambientLight intensity={0.85} />
        <directionalLight color="#ffffff" intensity={0.55} position={[4, 10, 6]} />
        <directionalLight color={colors.sky} intensity={0.35} position={[-6, 6, -8]} />

        <Hall />
        <SceneDisposer onDispose={() => { stats.disposed += 1; }} />
      </Canvas>
    </div>
  );
}

/**
 * R3F, JSX ile tanımlanan geometry/material'ları unmount'ta kendisi bırakır ve `gl`'i
 * dispose eder. Elle üretilen dokular (canvas doku üreticileri) ise sahnede asılı kalır —
 * aç-kapa-aç'ta bellek büyür. Bu bileşen sahneyi dolaşıp hepsini bırakır.
 */
function SceneDisposer({ onDispose }: { onDispose: () => void }) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    liveScene = scene;
    return () => {
      disposeScene(scene);
      if (liveScene === scene) liveScene = null;
      onDispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
  return null;
}
