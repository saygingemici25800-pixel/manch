import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";

// Varsayılan olarak ./src/i18n/request.ts bulunur.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Kural 47: AVIF önce (sharp ile), WebP fallback; kesit PNG'ler de dönüştürülür
  // Next 16: kullanılan her `quality` burada listelenmeli (hero 70) — yoksa /_next/image 400 döner (hero kırık!)
  images: { formats: ["image/avif", "image/webp"], qualities: [70, 75] },
};

// ANALYZE=1 pnpm build → .next/analyze/*.html (Faz 8)
const withAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "1" });

export default withAnalyzer(withNextIntl(nextConfig));
