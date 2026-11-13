"use client";

import { useState, useTransition } from "react";

import { setOrdering, type ActionState } from "./actions";

/** Elle aç/kapa. Saat kuralının ÜSTÜNDE çalışmaz: saat dışında açık olsa da kapalıdır. */
export function OrderingToggle({ enabled }: { enabled: boolean }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>(undefined);

  const toggle = () => {
    if (enabled && !window.confirm("Siteden siparişleri durdurmak istiyor musunuz?")) return;
    start(async () => setState(await setOrdering(!enabled)));
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        data-testid="admin-toggle"
        data-enabled={enabled}
        className={
          enabled
            ? "rounded-full border-2 border-berry bg-transparent px-5 py-4 text-base font-bold text-berry disabled:opacity-50"
            : "rounded-full border-2 border-berry bg-berry px-5 py-4 text-base font-bold text-cream disabled:opacity-50"
        }
      >
        {pending ? "Kaydediliyor…" : enabled ? "Siparişleri durdur" : "Siparişleri aç"}
      </button>
      {state && "error" in state && (
        <p role="alert" className="text-sm font-semibold text-berry">{state.error}</p>
      )}
    </div>
  );
}
