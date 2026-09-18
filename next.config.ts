import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Kural 47: kullanılan her `quality` listede olmalı, yoksa istek 400 döner.
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75],
  },
};

export default withNextIntl(nextConfig);
