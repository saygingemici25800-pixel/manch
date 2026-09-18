import { ImageResponse } from "next/og";
import { LOGO_M_PATH, LOGO_M_VIEWBOX } from "@/components/ui/logo-m";

// Berry zemin + wordmark'ın "M" harfi (potrace ile basılı menüden). 32 (favicon) + 512 (manifest).
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const px = Number(await id);
  const SIZE = px;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#7A1F4B", borderRadius: SIZE * 0.2 }}>
        <svg viewBox={LOGO_M_VIEWBOX} width={SIZE * 0.62} height={SIZE * 0.62 * (480 / 376)}>
          <path fill="#F6C343" fillRule="evenodd" d={LOGO_M_PATH} />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
