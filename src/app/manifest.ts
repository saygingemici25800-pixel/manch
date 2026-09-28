import type { MetadataRoute } from "next";
import { colors } from "@/styles/tokens";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.taglineAlt,
    start_url: "/tr",
    display: "standalone",
    background_color: colors.cream,
    theme_color: colors.berry,
    icons: [
      { src: "/icon/32", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
