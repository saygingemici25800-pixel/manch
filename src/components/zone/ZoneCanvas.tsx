"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { Character } from "@/components/zone/Character";
import { Footprints } from "@/components/zone/Footprints";
import { FramePrompt } from "@/components/zone/FramePrompt";
import { Frames } from "@/components/zone/Frames";
import { Hall } from "@/components/zone/Hall";
import { Npc } from "@/components/zone/Npc";
import { useFollowCamera } from "@/hooks/useFollowCamera";
import { useZoneControls } from "@/hooks/useZoneControls";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { angLerp, normalizeAngle, smoothing } from "@/lib/zone/angles";
import { mirrorFor, viewFor } from "@/lib/zone/character";
import { CAMERA_FOV, CAM_DIST, CAM_HEIGHT } from "@/lib/zone/frames";
import { CAM_START_ANG, CHAR_START, resetRuntime, resetZoneDebug, teleport, zoneRuntime } from "@/lib/zone/runtime";
import { artSources, releaseArts } from "@/lib/zone/art";
import { releaseTextureSlots, textureLedger } from "@/lib/zone/textures";
import { otherCharacter, useZoneStore, type Character as CharacterId } from "@/store/zone";
import { colors } from "@/styles/tokens";

/**
 * Zone sahnesinin kabı (spec bölüm 1, 3.1, 9).
 *
 * **Asla sunucuda render edilmez** — çağıran taraf `next/dynamic` + `{ ssr: false }` kullanır.
 *
 * Dispose disiplini baştan kuruludur (spec bölüm 9): unmount'ta renderer, tüm geometry /
 * material / texture ve rAF bırakılır. Sonradan eklenmesi zor, şimdi ucuz.
 */

/**
 * Karakter seçimi 5.5.10'da (`CharacterSelect`) bağlanacak. O zamana kadar — ve store boşken —
 * Misu ile gezilir; sahne karaktersiz kalmaz.
 */
const FALLBACK_CHARACTER: CharacterId = "misu";

/** Dev/QA: canlı WebGL bağlamı sayacı — sızıntı testi bunu okur. */
const stats = { created: 0, disposed: 0 };
/** Dev/QA: aktif sahne — lab testleri mesh sayısı/konumunu buradan doğrular. */
let liveScene: THREE.Scene | null = null;
/** Dev/QA: aktif kamera — `zone-camera-check` dönüşü buradan ölçer. */
let liveCamera: THREE.Camera | null = null;

/**
 * Dev/QA: bir tablo görselinin EKRAN dikdörtgeni (CSS piksel). Prompt'un görselle
 * örtüşmediğini kanıtlamak için — DOM `getBoundingClientRect()` ile doğrudan karşılaştırılır.
 */
function artScreenRect(id: string) {
  const mesh = liveScene?.getObjectByName(`zone-art-${id}`) as THREE.Mesh | undefined;
  const canvas = document.querySelector("canvas");
  if (!mesh || !liveCamera || !canvas) return null;
  mesh.updateWorldMatrix(true, false);
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox;
  if (!bb) return null;
  const v = new THREE.Vector3();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const cx of [bb.min.x, bb.max.x]) {
    for (const cy of [bb.min.y, bb.max.y]) {
      v.set(cx, cy, 0).applyMatrix4(mesh.matrixWorld).project(liveCamera);
      const px = (v.x * 0.5 + 0.5) * canvas.clientWidth;
      const py = (-v.y * 0.5 + 0.5) * canvas.clientHeight;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
  }
  return { left: minX, top: minY, right: maxX, bottom: maxY };
}

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
  const reduced = useReducedMotion();
  const character = useZoneStore((s) => s.character);

  /**
   * Kontroller `<Canvas>` DIŞINDA bağlanır: pencere olayları sahneye ait değil, üstelik
   * 5.5.6'daki Joystick de DOM tarafında aynı runtime modülüne yazacak.
   */
  useZoneControls();

  // Dev sayaçları — sadece development'ta (prod'da tree-shake).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as Record<string, unknown>;
    // Saf açı matematiği — `scripts/zone-camera-check.mjs` üç tuzağı doğrudan burada sınar.
    w.__ZONE_ANG__ = { angLerp, normalizeAngle, smoothing, viewFor, mirrorFor };
    // Ölçüm penceresi: test tepe ayrışmayı/kovaları kare döngüsünden okur, örneklemeden değil.
    w.__ZONE_DEBUG_RESET__ = resetZoneDebug;
    w.__ZONE_TELEPORT__ = teleport;
    w.__ZONE_ART_RECT__ = artScreenRect;
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
      char: { x: +zoneRuntime().char.x.toFixed(3), z: +zoneRuntime().char.z.toFixed(3), ang: zoneRuntime().char.ang },
      cam: {
        ang: zoneRuntime().cam.ang,
        /** Portrede uyarlanan dikey FOV (spec 3.0). */
        fov: (liveCamera as THREE.PerspectiveCamera | null)?.fov ?? null,
        x: liveCamera ? +liveCamera.position.x.toFixed(3) : null,
        y: liveCamera ? +liveCamera.position.y.toFixed(3) : null,
        z: liveCamera ? +liveCamera.position.z.toFixed(3) : null,
      },
      /** Elle üretilen dokuların defteri — bağlam sayacının göremediği sızıntı (spec 9). */
      textures: textureLedger(),
      /** Ayak izleri: kaçı görünür, en koyusu ne kadar (spec 8.3 — basılır ve söner). */
      footprints: (() => {
        const g = liveScene?.getObjectByName("zone-footprints");
        if (!g) return null;
        const ops = g.children.map(
          (c) => ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity,
        );
        // Kaçı gerçekten KADRAJDA? Görünür opaklık tek başına yetmiyor: iz kameranın
        // arkasında ya da ekran dışında olabilir (kamera karakterin ÖNÜNE bakıyor).
        let onScreen = 0;
        if (liveCamera) {
          const v = new THREE.Vector3();
          for (const c of g.children) {
            const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
            if (m.opacity <= 0.01) continue;
            v.copy(c.position).project(liveCamera);
            if (Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z < 1) onScreen += 1;
          }
        }
        return {
          pool: ops.length,
          visible: ops.filter((o) => o > 0.01).length,
          onScreen,
          max: +Math.max(0, ...ops).toFixed(3),
        };
      })(),
      /** Sahnede bırakılmış (ölü) dokuya bağlı materyal sayısı — 0 olmalı. */
      staleMaps: (() => {
        let n = 0;
        liveScene?.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const map = (m as THREE.MeshBasicMaterial | undefined)?.map;
            if (map?.userData?.zoneDisposed) n += 1;
          }
        });
        return n;
      })(),
      input: { ...zoneRuntime().input },
      /** Billboard açısı — sprite kameraya dönmezse `FrontSide` onu kırpar (spec 8.3). */
      heroRotY: liveScene?.getObjectByName("zone-char")?.rotation.y ?? null,
      /** NPC: konum + billboard açısı (kameraya dönmeli — Kural 63 ⑤). */
      npc: (() => {
        const o = liveScene?.getObjectByName("zone-npc");
        return o
          ? { x: +o.position.x.toFixed(2), y: +o.position.y.toFixed(3), z: +o.position.z.toFixed(2), rotY: o.rotation.y }
          : null;
      })(),
      arts: artSources(),
      nearFrame: useZoneStore.getState().nearFrame,
      zoneState: useZoneStore.getState().state,
      lastStepRot: zoneRuntime().debug.lastStepRot,
      peakSpread: zoneRuntime().debug.peakSpread,
      seenViews: { ...zoneRuntime().debug.seenViews },
      view: zoneRuntime().debug.view,
      mirrored: zoneRuntime().debug.mirrored,
      spriteSource: zoneRuntime().debug.source,
    });
    return () => {
      delete w.__ZONE_STATS__;
      delete w.__ZONE_ANG__;
      delete w.__ZONE_DEBUG_RESET__;
      delete w.__ZONE_TELEPORT__;
      delete w.__ZONE_ART_RECT__;
    };
  }, []);

  return (
    <div ref={rootRef} className={className}>
      <Canvas
        // Kural/spec 9: retina'da 2 ile sınırla, yoksa mobilde fps düşer.
        dpr={typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2)}
        /* Başlangıçta kamera zaten takip pozisyonunda dursun: mount'ta içeri doğru
           süzülme olmaz, ilk kare doğru kadrajla açılır. */
        camera={{
          fov: CAMERA_FOV,
          position: [
            CHAR_START.x - Math.sin(CAM_START_ANG) * CAM_DIST,
            CAM_HEIGHT,
            CHAR_START.z - Math.cos(CAM_START_ANG) * CAM_DIST,
          ],
          near: 0.1,
          far: 120,
        }}
        // Gölge haritası KAPALI — karakterin altında canvas'tan üretilen yumuşak gölge var.
        shadows={false}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl, scene, camera }) => {
          stats.created += 1;
          // Sahne her kurulduğunda dünya sıfırlanır: aç-kapa-aç aynı yerden başlar.
          // (`onCreated` render değil, callback — ilk kareden önce koşar.)
          resetRuntime();
          gl.setClearColor(colors.cream);
          scene.fog = new THREE.Fog(colors.cream, 26, 52);
          liveCamera = camera;
          camera.lookAt(CHAR_START.x, 1.55, CHAR_START.z - CAM_DIST);
        }}
      >
        {/* spec 3.1 — gölgesiz, iki yönlü ışık */}
        <ambientLight intensity={0.85} />
        <directionalLight color="#ffffff" intensity={0.55} position={[4, 10, 6]} />
        <directionalLight color={colors.sky} intensity={0.35} position={[-6, 6, -8]} />

        <Hall />
        <Frames reduced={reduced} />
        <FramePrompt />
        {/* Sıra önemli: `Character` simülasyon adımıdır (girdi → konum → İKİ açı),
            `FollowCamera` yalnızca o açıyı kamera konumuna çevirir. R3F `useFrame`
            aboneliklerini mount sırasına göre çalıştırır. */}
        <Character who={character ?? FALLBACK_CHARACTER} reduced={reduced} />
        {/* Ayak izleri `Character`'dan SONRA: `stepWorld` bu karenin adımını üretir,
            `Footprints` onu aynı karede tüketir. */}
        <Footprints />
        <Npc who={otherCharacter(character ?? FALLBACK_CHARACTER)} reduced={reduced} />
        <FollowCamera />
        <SceneDisposer onDispose={() => { stats.disposed += 1; liveCamera = null; }} />
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
      // Yuvalı dokular (salon + ayak izi) sahneye değil, yuva kaydına ait — sahne seviyesinde
      // bırakılırlar. `trackTexture` çift `dispose()`'u bir kez sayar.
      releaseTextureSlots();
      releaseArts();
      if (liveScene === scene) liveScene = null;
      onDispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
  return null;
}

/** `useFollowCamera` `<Canvas>` içinde çağrılmalı (useThree/useFrame). Tek satırlık kap. */
function FollowCamera() {
  useFollowCamera();
  return null;
}
