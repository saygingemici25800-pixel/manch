import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /**
   * `pnpm dev` ve `pnpm build` VARSAYILAN OLARAK AYNI `.next` klasörünü kullanır. Geliştirme
   * sunucusu açıkken build almak çıktıyı bozuyor — 2026-09-18'de bu yaşandı: canlı dev sunucusu
   * varken alınan build'de `/tr` ilk yüklemesi 215 kB yerine 141 kB ölçüldü (eksik çıktı,
   * "iyileşme" gibi görünen sahte sonuç). Kullanıcı dev sunucusunu açık tutmak istediği için
   * ölçüm build'leri ayrı klasöre alınır: `NEXT_DIST_DIR=.next-build pnpm build`.
   */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    // Kural 47: kullanılan her `quality` listede olmalı, yoksa istek 400 döner.
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75],
  },
};

export default withNextIntl(nextConfig);
