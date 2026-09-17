// Next.js 16: `middleware.ts` yerine `proxy.ts`. next-intl createMiddleware'i proxy olarak dışa aktarıyoruz.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const proxy = createMiddleware(routing);

export default proxy;

export const config = {
  // api, _next, _vercel, metadata rotaları (icon/apple-icon: uzantısız!) ve uzantılı dosyalar hariç her yol (Kural 38)
  matcher: "/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)",
};
