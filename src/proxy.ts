import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

// Kural 14: Next 16'da `middleware.ts` deprecated; route-level kod `src/proxy.ts`.
export default createMiddleware(routing);

export const config = {
  matcher: [
    // Statik dosyalar, _next ve uzantili yollar haric her sey.
    // Kural 38: `icon` ve `apple-icon` UZANTISIZ metadata rotalari (/icon/32) —
    // haric tutulmazsa locale'e yonlendirilir ve 404 doner.
    "/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)",
  ],
};
