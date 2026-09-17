import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const modak = await readFile(join(process.cwd(), "src/assets/fonts/Modak-Regular.ttf"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#7A1F4B", color: "#F6C343", fontFamily: "Modak", fontSize: 140 }}>
        M
      </div>
    ),
    { ...size, fonts: [{ name: "Modak", data: modak, style: "normal", weight: 400 }] },
  );
}
