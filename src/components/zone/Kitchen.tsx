"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { acquireDish, dishSources, setSceneCursor } from "@/lib/zone/dishes";
import { KITCHEN, STATIONS, kitchenFace, nearestStation, type StationId } from "@/lib/zone/kitchen";
import { COUNTER_DISHES } from "@/lib/zone/kitchen-stations";
import { zoneRuntime } from "@/lib/zone/runtime";
import { acquireTexture, counterBandTexture, kitchenSignTexture, redrawTextTextures } from "@/lib/zone/textures";
import { useZoneStore } from "@/store/zone";
import { colors } from "@/styles/tokens";

/**
 * Açık mutfak (karar 2026-11-15, kullanıcı): salonun ortasında boydan boya alçak bir tezgâh,
 * üç istasyon. Burger istasyonunda 7 gerçek kesit; "yanında" ve "içecek & tatlı"
 * istasyonlarında temsili nesneler + asılı tabela. Ürüne/tabelaya dokununca `KitchenBoard`
 * açılır. Yerleşim ve gerekçesi `lib/zone/kitchen.ts`'te.
 *
 * Etkileşim iki yoldan, ikisi de aynı panoya çıkar:
 * · **İşaretçi** — R3F ışın testi; kesite dokunmak doğrudan o ürünü, tabelaya ya da
 *   nesneye dokunmak istasyon listesini açar.
 * · **Klavye** — istasyonun yanında durunca `KitchenPrompt` (İNCELE) ve `E` tuşu.
 *
 * Kesitler ve tabelalar **billboard** yapar (Kural 63 ⑤): yön takipli kamerada düzlem
 * öbür yüzüne dönerse `FrontSide` onu kırpardı.
 */

const LEN = KITCHEN.zMax - KITCHEN.zMin;
const MID_Z = (KITCHEN.zMax + KITCHEN.zMin) / 2;
const BODY_W = KITCHEN.halfW * 2 - 0.1;
const BAND_H = 0.18;
const DISH = 0.8;
/** Kesitler burger istasyonunun ortasına, eşit aralıkla. */
const DISH_GAP = 0.82;
const SIGN_Y = 2.75;
const SIGN_W = 1.7;
const SIGN_H = SIGN_W * (200 / 640);

const dishZ = (i: number) => ((COUNTER_DISHES.length - 1) / 2 - i) * DISH_GAP;
/**
 * Zikzak: tek sırada dizilince girişten bakan yedi burgeri üst üste binmiş bir kule gibi
 * görüyordu (Kural 59 gözle bakmada). ±0.32 kaydırma ızgaranın (1.5) içinde kalır.
 */
const dishX = (i: number) => (i % 2 === 0 ? -0.32 : 0.32);
/** Askı tabelanın ÜST kenarından tavana — yazının önünden geçmez. */
const ROD_LEN = 6 - SIGN_Y - SIGN_H / 2;

/** Etkileşim yalnız gezinirken: pano açıkken sahneye tıklamak hiçbir şey yapmaz. */
const canInteract = () => useZoneStore.getState().state === "zone";

export function Kitchen() {
  const t = useTranslations("Zone");
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const aniso = gl.capabilities.getMaxAnisotropy();
  const billboards = useRef<THREE.Group>(null);
  const dishRefs = useRef<THREE.Group>(null);

  // spec 4.2 — tabela yazısı Google fontları gelince yeniden çizilir (Hall ile aynı kalıp).
  const [fontEpoch, setFontEpoch] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void redrawTextTextures(() => {
      if (!cancelled) setFontEpoch((e) => e + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hint = t("kitchen.tap");
  const signs = STATIONS.map((s) => {
    const title = t(`groups.${s.id}`);
    return {
      ...s,
      texture: acquireTexture(`kitchen-sign-${s.id}`, `${title}|${hint}|${fontEpoch}`, () =>
        kitchenSignTexture(title, hint),
      ),
    };
  });
  const band = acquireTexture("kitchen-band", String(aniso), () => {
    const tx = counterBandTexture(aniso);
    tx.repeat.set(LEN / (BAND_H * 2), 1);
    return tx;
  });

  useFrame(() => {
    const { char } = zoneRuntime();
    useZoneStore.getState().setNearStation(nearestStation(char.x, char.z), kitchenFace(char.x, char.z));

    // billboard: yalnız Y ekseni, kameraya dön
    const g = billboards.current;
    if (g) {
      for (const o of g.children) {
        o.rotation.y = Math.atan2(camera.position.x - o.position.x, camera.position.z - o.position.z);
      }
    }
    // kesit dokusu: yer tutucu → gerçek görsel geçişi burada takılır (Frame ile aynı kalıp)
    const d = dishRefs.current;
    if (d) {
      d.children.forEach((o, i) => {
        const spec = COUNTER_DISHES[i];
        const mesh = o.children[0] as THREE.Mesh | undefined;
        if (!spec || !mesh) return;
        const texture = acquireDish(spec.slug, spec.url, aniso).texture;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat.map !== texture) {
          mat.map = texture;
          mat.needsUpdate = true;
        }
        o.rotation.y = Math.atan2(camera.position.x - o.position.x, camera.position.z - o.position.z);
      });
    }
  });

  // Dev/QA: kesitlerin ve tabelaların EKRAN noktası — test gerçek fareyle tıklar (ışın testi
  // dahil uçtan uca), hangi kesitin görsel aldığını da buradan okur.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as Record<string, unknown>;
    const point = (name: string) => {
      const o = billboards.current?.parent?.getObjectByName(name);
      const canvas = gl.domElement;
      if (!o) return null;
      const v = new THREE.Vector3();
      o.getWorldPosition(v);
      v.project(camera);
      if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return null;
      const r = canvas.getBoundingClientRect();
      return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
    };
    w.__ZONE_KITCHEN__ = {
      dishes: () => dishSources(),
      dishPoint: (slug: string) => point(`zone-dish-${slug}`),
      signPoint: (id: StationId) => point(`zone-sign-${id}`),
      count: COUNTER_DISHES.length,
    };
    return () => {
      delete w.__ZONE_KITCHEN__;
    };
  }, [camera, gl]);

  const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setSceneCursor(gl.domElement, on && canInteract() ? "pointer" : "");
  };
  const openStation = (id: StationId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!canInteract()) return;
    setSceneCursor(gl.domElement, "");
    useZoneStore.getState().openKitchen(id);
  };
  const openDish = (slug: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!canInteract()) return;
    setSceneCursor(gl.domElement, "");
    useZoneStore.getState().openKitchen("burgers", slug);
  };

  return (
    <group name="zone-kitchen">
      {/* ---- tezgâh gövdesi ---- */}
      <mesh position={[0, 0.44, MID_Z]}>
        <boxGeometry args={[BODY_W, 0.88, LEN - 0.1]} />
        <meshStandardMaterial color={colors.berry} roughness={0.7} />
      </mesh>
      <mesh position={[0, KITCHEN.top - 0.035, MID_Z]}>
        <boxGeometry args={[KITCHEN.halfW * 2, 0.07, LEN]} />
        <meshStandardMaterial color={colors.cream} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.04, MID_Z]}>
        <boxGeometry args={[BODY_W + 0.02, 0.08, LEN - 0.08]} />
        <meshStandardMaterial color={colors.ink} roughness={0.8} />
      </mesh>
      {/* dama bandı — iki uzun yüzde */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (BODY_W / 2 + 0.002), 0.7, MID_Z]} rotation={[0, (side * Math.PI) / 2, 0]}>
          <planeGeometry args={[LEN - 0.1, BAND_H]} />
          <meshBasicMaterial map={band} toneMapped={false} />
        </mesh>
      ))}
      {/* ızgara — burger istasyonunun altında */}
      <mesh position={[0, KITCHEN.top + 0.012, 0]}>
        <boxGeometry args={[1.5, 0.025, COUNTER_DISHES.length * DISH_GAP + 0.3]} />
        <meshStandardMaterial color={colors.ink} roughness={0.35} metalness={0.2} />
      </mesh>

      {/* ---- burger istasyonu: gerçek kesitler ---- */}
      <group ref={dishRefs}>
        {COUNTER_DISHES.map((d, i) => (
          <group key={d.slug} position={[dishX(i), KITCHEN.top + DISH / 2 + 0.03, dishZ(i)]}>
            <mesh
              name={`zone-dish-${d.slug}`}
              onClick={openDish(d.slug)}
              onPointerOver={hover(true)}
              onPointerOut={hover(false)}
            >
              <planeGeometry args={[DISH, DISH]} />
              <meshBasicMaterial transparent alphaTest={0.05} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---- yanında: patates kabı + sos kavanozları ---- */}
      <group
        position={[0, KITCHEN.top, STATIONS[1].z]}
        onClick={openStation("sides")}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
      >
        <mesh position={[0, 0.17, 0.35]}>
          <cylinderGeometry args={[0.2, 0.15, 0.34, 20]} />
          <meshStandardMaterial color={colors.berry} roughness={0.6} />
        </mesh>
        {[-0.09, -0.03, 0.03, 0.09, 0].map((x, i) => (
          <mesh key={i} position={[x, 0.4 + (i % 2) * 0.05, 0.35 + (i - 2) * 0.02]} rotation={[0, 0, x * 1.5]}>
            <boxGeometry args={[0.04, 0.26, 0.04]} />
            <meshStandardMaterial color={colors.cream} roughness={0.8} />
          </mesh>
        ))}
        {[-0.6, -0.25, 0.1].map((z, i) => (
          <group key={z} position={[i % 2 ? 0.3 : -0.3, 0, z - 0.4]}>
            <mesh position={[0, 0.09, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.18, 16]} />
              <meshStandardMaterial color={colors.cream} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.105, 0.105, 0.04, 16]} />
              <meshStandardMaterial color={colors.berry} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---- içecek & tatlı: iki bardak + tiramisu ---- */}
      <group
        position={[0, KITCHEN.top, STATIONS[2].z]}
        onClick={openStation("drinks")}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
      >
        {[-0.32, 0.32].map((x) => (
          <mesh key={x} position={[x, 0.18, 0.3]}>
            <cylinderGeometry args={[0.12, 0.1, 0.36, 20]} />
            <meshStandardMaterial color={colors.sky} transparent opacity={0.8} roughness={0.15} />
          </mesh>
        ))}
        <mesh position={[0, 0.07, -0.45]}>
          <boxGeometry args={[0.5, 0.14, 0.38]} />
          <meshStandardMaterial color={colors.cream} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.16, -0.45]}>
          <boxGeometry args={[0.5, 0.04, 0.38]} />
          <meshStandardMaterial color={colors.ink} roughness={0.9} />
        </mesh>
      </group>

      {/* ---- asılı tabelalar (billboard) ---- */}
      <group ref={billboards}>
        {signs.map((s) => (
          <group key={s.id} position={[0, SIGN_Y, s.z]}>
            {/* tavana iki ince askı */}
            {[-1, 1].map((k) => (
              <mesh key={k} position={[k * SIGN_W * 0.38, SIGN_H / 2 + ROD_LEN / 2, -0.01]}>
                <boxGeometry args={[0.02, ROD_LEN, 0.02]} />
                <meshBasicMaterial color={colors.ink} />
              </mesh>
            ))}
            <mesh
              name={`zone-sign-${s.id}`}
              onClick={openStation(s.id)}
              onPointerOver={hover(true)}
              onPointerOut={hover(false)}
            >
              <planeGeometry args={[SIGN_W, SIGN_H]} />
              <meshBasicMaterial map={s.texture} transparent toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
