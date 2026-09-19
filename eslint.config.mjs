import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Kural 65: ölçüm build'i ayrı klasöre alınıyor (dev sunucusu açıkken `.next` bozuluyor).
    // Lint'in üretilmiş çıktıyı taraması anlamsız — 8600 uyarı/hata üretiyordu.
    ".next-build/**", ".next-V*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
