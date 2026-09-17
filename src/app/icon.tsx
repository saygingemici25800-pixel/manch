import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Logo SVG gelene kadar: berry zemin, Modak "M". 32 (favicon) + 512 (manifest). TODO: logo
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const px = Number(await id);
  const modak = await readFile(join(process.cwd(), "src/assets/fonts/Modak-Regular.ttf"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#7A1F4B", color: "#F6C343", fontFamily: "Modak", fontSize: px * 0.78, borderRadius: px * 0.2 }}>
        M
      </div>
    ),
    { width: px, height: px, fonts: [{ name: "Modak", data: modak, style: "normal", weight: 400 }] },
  );
}
