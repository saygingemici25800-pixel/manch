import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Varsayılan olarak ./src/i18n/request.ts bulunur.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
