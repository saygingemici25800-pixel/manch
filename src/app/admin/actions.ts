"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getProduct } from "@/data/menu";
import { adminConfigured, checkPassword, endSession, requireAdmin, startSession } from "@/lib/admin/auth";
import { PRICES_TAG } from "@/lib/menu-prices";
import { ORDERING_TAG } from "@/lib/order/status";
import { clientIp } from "@/lib/request-ip";
import { getStore, StoreNotConfigured } from "@/lib/store";

/**
 * Panel eylemleri. Her biri DIŞARIDAN doğrudan çağrılabilen bir POST uç noktasıdır —
 * sayfanın korumalı olması onları korumaz. Bu yüzden girişten sonraki her eylem
 * `requireAdmin()` ile BAŞLAR ve istemciden gelen her değeri yeniden doğrular.
 */

const MAX_FAILS = 5; // IP başına, 15 dk
const GLOBAL_MAX = 40; // TÜM IP'ler toplamı, 15 dk — IP döndürülerek dağıtık deneme
const LOCK_SEC = 15 * 60;

export type LoginState = { error: string } | undefined;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) {
    return { error: "Panel henüz kurulmadı: Vercel'de ADMIN_PASSWORD tanımlanmalı." };
  }
  const store = getStore();
  // Depo yokken hız sınırı da yok — kaba kuvvete açık bir giriş bırakmaktansa giriş kapanır.
  if (store.kind === "none") return { error: "Veritabanı bağlı değil — Vercel'de Neon (Storage) bağlanmalı." };

  /* ÖNCE SAY, SONRA DENE. İlk yazımda sıra "sayaca bak → şifreyi dene → yanlışsa say"
     idi: paralel 300 istek sayacı aynı anda 0 görüyor ve 5 sınırı fiilen yok oluyordu
     (inceleme 2026-11-13). INCR atomik — her deneme şifreye bakılmadan sayılır. */
  const ipKey = `login:${clientIp(await headers())}`;
  const n = await store.hit(ipKey, LOCK_SEC);
  const g = await store.hit("login:all", LOCK_SEC);
  if (n > MAX_FAILS || g > GLOBAL_MAX) {
    return { error: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." };
  }
  const pw = form.get("password");
  if (typeof pw !== "string" || !checkPassword(pw)) {
    await new Promise((r) => setTimeout(r, 400)); // kaba kuvveti yavaşlat
    return { error: "Şifre yanlış." };
  }
  await store.reset(ipKey);
  await store.reset("login:all");
  await startSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

export type ActionState = { ok: true; at: number } | { error: string } | undefined;

export async function setOrdering(enabled: unknown): Promise<ActionState> {
  await requireAdmin();
  if (typeof enabled !== "boolean") return { error: "Geçersiz istek." };
  try {
    await getStore().setOrderingEnabled(enabled);
  } catch (e) {
    return { error: e instanceof StoreNotConfigured ? "Veritabanı bağlı değil." : "Kaydedilemedi, tekrar deneyin." };
  }
  // Durum ucu anahtarı 30 sn önbellekte tutuyor — sahibin kararı ANINDA geçerli olsun.
  revalidateTag(ORDERING_TAG, { expire: 0 });
  revalidatePath("/admin");
  return { ok: true, at: Date.now() };
}

export async function savePrice(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const slug = form.get("slug");
  const raw = form.get("price");
  if (typeof slug !== "string" || !getProduct(slug)) return { error: "Ürün bulunamadı." };

  let price: number | null = null; // boş = YAKINDA (sipariş edilemez)
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw.trim());
    if (!Number.isInteger(n) || n < 0 || n > 100_000) return { error: "Tam sayı TL girin (ör. 570)." };
    price = n;
  }

  try {
    await getStore().setPrice(slug, price);
  } catch (e) {
    return { error: e instanceof StoreNotConfigured ? "Veritabanı bağlı değil." : "Kaydedilemedi, tekrar deneyin." };
  }
  /* `{ expire: 0 }` BİLEREK — "max" profili ilk ziyaretçiye eski fiyatı gösterirdi.
     Sayfalar statik: layout dahil hepsi yeniden üretilsin diye yol da geçersizleniyor. */
  revalidateTag(PRICES_TAG, { expire: 0 });
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin");
  return { ok: true, at: Date.now() };
}
