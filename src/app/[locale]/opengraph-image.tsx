import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";
import { LOGOMANCH_PATH, LOGOMANCH_VIEWBOX } from "@/components/ui/logo-manch";

// Kural 39: next/og — Node runtime, Modak TTF diskten (src/assets/fonts, OFL). woff2 desteklenmez.
export const alt = "MANCH — United Chill Burger Zone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const modak = await readFile(join(process.cwd(), "src/assets/fonts/Modak-Regular.ttf"));
  // burger kesiti diskten data URI (site.url'e ağ isteği yok — build/preview ortamlarında ulaşılamaz)
  const burger = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/burgers/classic-manch.png"))).toString("base64")}`;

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
        <div style={{ display: "flex", alignItems: "center", gap: 40, padding: "0 60px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 18, width: 700 }}>
            <svg viewBox={LOGOMANCH_VIEWBOX} width={700} height={Math.round((700 * 480) / 1948)}>
              <path fill="#F4EEE6" fillRule="evenodd" d={LOGOMANCH_PATH} />
            </svg>
            <div style={{ fontSize: 52, color: "#F6C343" }}>{site.tagline}</div>
            <div style={{ fontSize: 28, color: "#E9A3B8" }}>{t("description")}</div>
          </div>
          <img src={burger} width={400} height={400} alt="" style={{ objectFit: "contain" }} />
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Modak", data: modak, style: "normal", weight: 400 }] },
  );
}
