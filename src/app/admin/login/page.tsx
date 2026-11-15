import { redirect } from "next/navigation";

import { adminConfigured, isAdmin } from "@/lib/admin/auth";
import { getStore } from "@/lib/store";

import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");

  const problem = !adminConfigured()
    ? "Panel henüz kurulmadı: Vercel'de ADMIN_PASSWORD tanımlanmalı."
    : getStore().kind === "none"
      ? "Veritabanı bağlı değil — Vercel → Storage'dan Neon bağlanmalı."
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <h1 className="font-display text-5xl leading-none text-berry">MANCH</h1>
      <p className="text-sm text-ink">Yönetim paneli</p>
      {problem ? (
        <p role="alert" className="rounded-xl border-2 border-berry px-4 py-3 text-sm text-berry">
          {problem}
        </p>
      ) : (
        <LoginForm />
      )}
    </main>
  );
}
