"use client";

import { useFrame } from "@react-three/fiber";

import { Frame } from "@/components/zone/Frame";
import { FloorMarker } from "@/components/zone/FloorMarker";
import { FRAME_PROXIMITY, frameStop, ZONE_FRAMES } from "@/lib/zone/frames";
import { zoneRuntime } from "@/lib/zone/runtime";
import { useZoneStore } from "@/store/zone";

/**
 * Dört tablo + zemin halkaları + yakınlık (spec bölüm 5).
 *
 * Yakınlık **durma noktasına** göre ölçülür (`frameStop`), tablonun duvardaki konumuna göre
 * değil: kullanıcı halkanın üstüne basıyor, duvara değil.
 *
 * `setNearFrame` yalnızca değer DEĞİŞTİĞİNDE store'a yazar (store içinde korunuyor), yani
 * saniyede 60 render olmuyor.
 */
export function Frames({ reduced }: { reduced: boolean }) {
  useFrame(() => {
    const { char } = zoneRuntime();
    let best: (typeof ZONE_FRAMES)[number] | null = null;
    let bestD = FRAME_PROXIMITY;
    for (const f of ZONE_FRAMES) {
      const [x, , z] = frameStop(f);
      const d = Math.hypot(char.x - x, char.z - z);
      if (d < bestD) {
        best = f;
        bestD = d;
      }
    }
    useZoneStore.getState().setNearFrame(best ? best.id : null);
  });

  return (
    <group>
      {ZONE_FRAMES.map((f) => (
        <Frame key={f.id} frame={f} />
      ))}
      {ZONE_FRAMES.map((f) => (
        <FloorMarker key={f.id} frame={f} reduced={reduced} />
      ))}
    </group>
  );
}
