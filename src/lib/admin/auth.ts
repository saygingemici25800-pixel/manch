import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Yönetim paneli girişi — TEK kullanıcı (işletme sahibi), tek şifre.
 *
 * · Şifre Vercel env'inde: `ADMIN_PASSWORD`. Kodda, repoda, sohbette DEĞİL.
 * · Oturum: `ADMIN_SESSION_SECRET` ile HMAC-imzalı çerez (`v1.<bitiş>.<imza>`). Sunucuda
 *   oturum tablosu yok; sırrı değiştirmek tüm oturumları anında düşürür.
 * · Çerez `HttpOnly` (JS okuyamaz) · `Secure` (prod) · `SameSite=Lax`: WhatsApp'tan
 *   gelen bir bağlantıyla açılınca da girişli kalır, başka siteden POST'ta gönderilmez.
 *   Server Action'lar ayrıca Next'in kendi Origin denetiminden geçer.
 * · **Her server action oturumu KENDİSİ doğrular** (`requireAdmin`). Sayfanın korumalı
 *   olması yetmez: action'lar doğrudan POST edilebilen uç noktalardır.
 */

export const SESSION_COOKIE = "manch_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 gün — sahip telefondan sık girmek zorunda kalmasın

function sessionSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

/** Panel kurulmuş mu? Şifre ya da yeterince uzun sır yoksa giriş tamamen kapalıdır. */
export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && sessionSecret() !== null;
}

/**
 * İmza anahtarı = oturum sırrı + ŞİFRENİN ÖZETİ. Şifre değişince (ya da silinince) eski
 * çerezlerin hepsi anında geçersiz olur — sızan bir şifreden sonra sahibin olağan tepkisi
 * "şifreyi değiştirmek"tir ve bu yetmeli; yalnız sırrı bilmek gerekmesin (inceleme 2026-11-13).
 */
function signingKey(secret: string): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return secret + createHash("sha256").update(pw, "utf8").digest("hex");
}

const sign = (payload: string, key: string) => createHmac("sha256", signingKey(key)).update(payload).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Sabit süreli karşılaştırma — özetler karşılaştırılır ki şifre uzunluğu da sızmasın. */
export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(pw, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function startSession(): Promise<void> {
  const key = sessionSecret();
  if (!key) throw new Error("ADMIN_SESSION_SECRET yok ya da 32 karakterden kısa");
  const exp = Date.now() + MAX_AGE * 1000;
  (await cookies()).set(SESSION_COOKIE, `v1.${exp}.${sign(`v1.${exp}`, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const key = sessionSecret();
  if (!key || !adminConfigured()) return false;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return false;
  const [v, exp, sig] = raw.split(".");
  if (v !== "v1" || !exp || !sig) return false;
  const until = Number(exp);
  if (!Number.isFinite(until) || until <= Date.now()) return false;
  return safeEqual(sig, sign(`v1.${exp}`, key));
}

/** Oturum yoksa girişe yönlendirir (server component + server action ikisinde de). */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
