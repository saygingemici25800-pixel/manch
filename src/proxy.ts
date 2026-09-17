import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

// Kural 14: Next 16'da `middleware.ts` deprecated; route-level kod `src/proxy.ts`.
export default createMiddleware(routing);

export const config = {
  matcher: [
    // Statik dosyalar, _next ve dosya uzantili yollar haric her sey.
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
