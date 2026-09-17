"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import RollText from "@/components/motion/RollText";

const KEY = "manch-cookie";

/** R16 — alt orta kart, hardal nokta, LATER (oturumluk) / OKAY! (kalıcı). localStorage sadece effect'te. */
export default function CookieBanner() {
  const t = useTranslations("Cookie");
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "ok" || sessionStorage.getItem(KEY) === "later") return;
    } catch {
      /* yoksay */
    }
    const id = window.setTimeout(() => setShow(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const decide = (v: "ok" | "later") => {
    try {
      (v === "ok" ? localStorage : sessionStorage).setItem(KEY, v);
    } catch {
      /* yoksay */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label={t("text")}
      data-testid="cookie-banner"
      className="fixed bottom-[2vw] left-1/2 z-60 flex w-[32vw] max-md:w-[90vw] max-md:bottom-[22vw] -translate-x-1/2 items-center gap-[1vw] max-md:gap-[3vw] rounded-[1vw] max-md:rounded-[3vw] bg-white p-[1.2vw] max-md:p-[4vw] text-ink shadow-[0_1vw_2.5vw_-0.8vw_rgba(27,27,27,.35)]"
    >
      <span aria-hidden="true" className="h-[0.9vw] w-[0.9vw] max-md:h-[3vw] max-md:w-[3vw] shrink-0 rounded-full bg-mustard" />
      <p className="flex-1 text40 text-[1vw] max-md:text-[3.4vw] normal-case tracking-normal">{t("text")}</p>
      <button type="button" data-cursor-hide onClick={() => decide("later")} className="group rounded-full border border-ink px-[1vw] py-[0.4vw] max-md:px-[3vw] max-md:py-[1.5vw] text40 text-[0.9vw] max-md:text-[3vw]">
        <RollText text={t("later")} />
      </button>
      <button type="button" data-cursor-hide onClick={() => decide("ok")} className="group rounded-full bg-berry px-[1vw] py-[0.4vw] max-md:px-[3vw] max-md:py-[1.5vw] text40 text-[0.9vw] max-md:text-[3vw] text-cream">
        <RollText text={t("okay")} />
      </button>
    </div>
  );
}
