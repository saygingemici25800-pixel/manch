"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { CEIL_H, HALF_W } from "@/lib/zone/frames";
import {
  backWallTexture,
  floorTexture,
  frontWallTexture,
  redrawTextTextures,
  tileTexture,
} from "@/lib/zone/textures";
import { colors } from "@/styles/tokens";

/** z: -20 .. +20 (spec bölüm 3). Ön duvar +20'de KAPALI — kamera dönünce oraya bakılır. */
const Z_BACK = -20;
const Z_FRONT = 20;
const HALL_LEN = Z_FRONT - Z_BACK;

export function Hall() {
  const t = useTranslations("Zone");

  /**
   * spec 4.2 — Google fontları canvas'a GEÇ yüklenir. İlk çizimde yazılar yedek fontla
   * çıkar ve öyle kalır. `fonts.ready` sonrası sayaç artar, yazılı dokular yeniden üretilir.
   * setState promise callback'inde (effect'te senkron değil) — Kural 25.
   */
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

  // --- yazısız dokular: fontEpoch'a bağlı DEĞİL, boşuna yeniden üretilmez
  // (React Compiler kuralı: useMemo bağımlılığı dizi LİTERALİ olmalı → jenerik hook yok)
  const floor = useMemo(() => floorTexture(), []);
  const tileL = useMemo(() => tileTexture(), []);
  const tileR = useMemo(() => tileTexture(), []);

  // --- yazılı dokular: metin i18n'den, fontEpoch değişince yeniden çizilir
  const plaque = useMemo(
    () => ({
      title: t("plaque.title"),
      place: t("plaque.place"),
      body: t("plaque.body").split("|"),
      footer: t("plaque.footer"),
    }),
    [t],
  );
  const frontLines = useMemo(
    () => t("frontWall").split("|") as [string, string, string],
    [t],
  );

  const back = useMemo(() => backWallTexture(plaque, fontEpoch), [plaque, fontEpoch]);
  const front = useMemo(() => frontWallTexture(frontLines, fontEpoch), [frontLines, fontEpoch]);

  // Doku dispose'u tek yerde: değişince eskisi, unmount'ta hepsi bırakılır.
  // (ZoneCanvas'taki SceneDisposer ikinci güvence; burada erken bırakmak yeniden
  //  çizimde eski dokunun asılı kalmasını engeller.)
  useEffect(() => () => { floor.dispose(); tileL.dispose(); tileR.dispose(); }, [floor, tileL, tileR]);
  useEffect(() => () => back.dispose(), [back]);
  useEffect(() => () => front.dispose(), [front]);

  return (
    <group>
      {/* ---------------- zemin: bordo–krem dama ---------------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[HALF_W * 2, HALL_LEN]} />
        <meshStandardMaterial map={floor} roughness={0.95} metalness={0} />
      </mesh>

      {/* ---------------- tavan: düz krem ----------------
          `meshStandardMaterial` ile aşağı bakan yüzey sadece ambient alıyor ve GRİ görünüyordu.
          Spec "düz krem" diyor → ışıktan etkilenmeyen materyal. */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_H, 0]}>
        <planeGeometry args={[HALF_W * 2, HALL_LEN]} />
        <meshBasicMaterial color={colors.cream} toneMapped={false} />
      </mesh>

      {/* tavandaki hardal ışık bantları (x = ±4) */}
      {[-4, 4].map((x) => (
        <mesh key={x} rotation={[Math.PI / 2, 0, 0]} position={[x, CEIL_H - 0.02, 0]}>
          <planeGeometry args={[0.5, HALL_LEN - 2]} />
          <meshBasicMaterial color={colors.mustard} toneMapped={false} />
        </mesh>
      ))}

      {/* ---------------- yan duvarlar: mavi karo ---------------- */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-HALF_W, CEIL_H / 2, 0]}>
        <planeGeometry args={[HALL_LEN, CEIL_H]} />
        <meshStandardMaterial map={tileL} roughness={0.85} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[HALF_W, CEIL_H / 2, 0]}>
        <planeGeometry args={[HALL_LEN, CEIL_H]} />
        <meshStandardMaterial map={tileR} roughness={0.85} />
      </mesh>

      {/* ---------------- arka duvar: müze künyesi ---------------- */}
      <mesh position={[0, CEIL_H / 2, Z_BACK]}>
        <planeGeometry args={[HALF_W * 2, CEIL_H]} />
        <meshStandardMaterial map={back} roughness={0.9} />
      </mesh>

      {/* ---------------- ön duvar: slogan (kamera dönünce görülür) ---------------- */}
      <mesh rotation={[0, Math.PI, 0]} position={[0, CEIL_H / 2, Z_FRONT]}>
        <planeGeometry args={[HALF_W * 2, CEIL_H]} />
        <meshStandardMaterial map={front} roughness={0.9} />
      </mesh>

      {/* ---------------- süpürgelik: ink, 0.12 × 0.35 ---------------- */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (HALF_W - 0.06), 0.175, 0]}>
          <boxGeometry args={[0.12, 0.35, HALL_LEN]} />
          <meshStandardMaterial color={colors.ink} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
