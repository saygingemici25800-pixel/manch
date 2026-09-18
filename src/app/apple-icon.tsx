import { ImageResponse } from "next/og";
import { LOGO_M_PATH, LOGO_M_VIEWBOX } from "@/components/ui/logo-m";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const SIZE = 180;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#7A1F4B", borderRadius: SIZE * 0.2 }}>
        <svg viewBox={LOGO_M_VIEWBOX} width={SIZE * 0.62} height={SIZE * 0.62 * (480 / 376)}>
          <path fill="#F6C343" fillRule="evenodd" d={LOGO_M_PATH} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
