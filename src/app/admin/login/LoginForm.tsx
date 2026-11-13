"use client";

import { useActionState } from "react";

import { login, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Tek kullanıcı — şifre yöneticisi kaydı eşleştirebilsin diye sabit kullanıcı adı. */}
      <input type="text" name="username" value="manch" autoComplete="username" readOnly hidden />
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Şifre
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          data-testid="admin-password"
          className="rounded-xl border-2 border-berry bg-white px-4 py-3 text-base text-ink"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        data-testid="admin-login"
        className="rounded-full border-2 border-berry bg-berry px-5 py-3 text-base font-semibold text-cream disabled:opacity-50"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      {state?.error && (
        <p role="alert" data-testid="admin-login-error" className="text-sm font-semibold text-berry">
          {state.error}
        </p>
      )}
    </form>
  );
}
