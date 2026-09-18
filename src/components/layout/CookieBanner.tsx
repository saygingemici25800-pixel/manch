"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RollText } from "@/components/motion/RollText";

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
    /* Masaüstü: ortada duran kart. Mobil: tek satırlık, ekran genişliğinde, alta yapışık şerit —
       kart formundan çok daha az yer kaplar, üstüne bindiği şeyi kapatmak yerine sınırlar. */
    <div
      role="region"
      aria-label={t("text")}
      data-testid="cookie-banner"
      className="fixed bottom-[2vw] left-1/2 z-60 flex -translate-x-1/2 w-[32vw] items-center gap-[1vw] rounded-[1vw] bg-white p-[1.2vw] text-ink shadow-[0_1vw_2.5vw_-0.8vw_rgba(27,27,27,.35)] max-md:bottom-0 max-md:left-0 max-md:w-full max-md:translate-x-0 max-md:gap-[2vw] max-md:rounded-none max-md:border-t max-md:border-ink/10 max-md:px-[4vw] max-md:py-[2.4vw]"
    >
      <span aria-hidden="true" className="h-[0.9vw] w-[0.9vw] shrink-0 rounded-full bg-mustard max-md:h-[2.2vw] max-md:w-[2.2vw]" />
      <p className="flex-1 text40 text-[1vw] normal-case tracking-normal max-md:text-[2.9vw] max-md:leading-tight">{t("text")}</p>
      <button type="button" data-cursor-hide onClick={() => decide("later")} className="group shrink-0 whitespace-nowrap rounded-full border border-ink px-[1vw] py-[0.4vw] text40 text-[0.9vw] max-md:px-[2.6vw] max-md:py-[1.2vw] max-md:text-[2.7vw]">
        <RollText>{t("later")}</RollText>
      </button>
      <button type="button" data-cursor-hide onClick={() => decide("ok")} className="group shrink-0 whitespace-nowrap rounded-full bg-berry px-[1vw] py-[0.4vw] text40 text-[0.9vw] text-cream max-md:px-[2.6vw] max-md:py-[1.2vw] max-md:text-[2.7vw]">
        <RollText>{t("okay")}</RollText>
      </button>
    </div>
  );
}
