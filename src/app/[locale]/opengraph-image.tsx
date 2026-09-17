import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";

// Kural 39: next/og — Node runtime, Modak TTF diskten (src/assets/fonts, OFL). woff2 desteklenmez.
export const alt = "MANCH — United Chill Burger Zone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const modak = await readFile(join(process.cwd(), "src/assets/fonts/Modak-Regular.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#7A1F4B",
          color: "#F6C343",
          fontFamily: "Modak",
          position: "relative",
        }}
      >
        {/* dama bandı */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40, display: "flex" }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ width: 40, height: 40, background: i % 2 ? "#F4EEE6" : "#7A1F4B" }} />
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, display: "flex" }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ width: 40, height: 40, background: i % 2 ? "#7A1F4B" : "#F4EEE6" }} />
          ))}
        </div>
        <div style={{ fontSize: 260, lineHeight: 1, letterSpacing: -4, textShadow: "0 12px 0 #4E1030" }}>{site.name}</div>
        <div style={{ marginTop: 8, fontSize: 56, color: "#F4EEE6" }}>{site.tagline}</div>
        <div style={{ marginTop: 18, fontSize: 30, color: "#E9A3B8" }}>{t("description")}</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Modak", data: modak, style: "normal", weight: 400 }] },
  );
}
