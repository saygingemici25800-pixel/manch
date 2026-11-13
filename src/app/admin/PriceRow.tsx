"use client";

import { useActionState } from "react";

import { savePrice, type ActionState } from "./actions";

interface Props {
  slug: string;
  name: string;
  /** Etkin fiyat (ezme varsa o). null = YAKINDA. */
  price: number | null;
  /** menu.ts'teki özgün fiyat — farklıysa ipucu olarak gösterilir. */
  base: number | null;
  /** Depo okunamadıysa ya da bağlı değilse kayıt kapalı (yanlış rakamın üstüne yazılmasın). */
  disabled?: boolean;
}

export function PriceRow({ slug, name, price, base, disabled = false }: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(savePrice, undefined);
  const id = `fiyat-${slug}`;

  return (
    <form action={action} data-price-row={slug} className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-berry/30 bg-white px-3 py-2">
      <input type="hidden" name="slug" value={slug} />
      <label htmlFor={id} className="min-w-0 flex-1 text-sm font-semibold">
        {name}
        {price !== base && (
          <span className="block text-xs font-normal">menüde: {base == null ? "YAKINDA" : `${base} TL`}</span>
        )}
      </label>
      <span className="flex items-center gap-1">
        {/* `key` fiyatı izler: kayıttan sonra sayfa yenilenince alan yeni değeri gösterir
            (kontrolsüz input `defaultValue` değişimini kendiliğinden almaz). */}
        <input
          key={String(price)}
          id={id}
          name="price"
          defaultValue={price ?? ""}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="YAKINDA"
          aria-describedby={`${id}-durum`}
          className="w-24 rounded-lg border-2 border-berry px-2 py-2 text-right text-base"
        />
        <span className="text-sm">TL</span>
      </span>
      <button
        type="submit"
        disabled={pending || disabled}
        className="rounded-full border-2 border-berry bg-berry px-4 py-2 text-sm font-bold text-cream disabled:opacity-50"
      >
        {pending ? "…" : "Kaydet"}
      </button>
      <span id={`${id}-durum`} role="status" className="basis-full text-xs font-semibold text-berry empty:hidden">
        {state && "ok" in state ? "✓ Kaydedildi — sitede güncellendi" : state && "error" in state ? state.error : ""}
      </span>
    </form>
  );
}
