import "server-only";

/**
 * İstek sahibinin IP'si — yalnız HIZ SINIRI anahtarı için (kayda yazılmaz, kişisel veri
 * tutulmaz). Vercel `x-forwarded-for`'un İLK öğesini istemci IP'si olarak koyar.
 */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "unknown";
  return headers.get("x-real-ip") ?? "local";
}
