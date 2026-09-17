"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import KraftCard from "@/components/ui/KraftCard";
import RollText from "@/components/motion/RollText";
import { site } from "@/lib/site";
import { useUiStore } from "@/lib/ui-store";
import { useDialog } from "@/lib/hooks/useDialog";

/** R17 — iletişim / rezervasyon modalı (kraft kart), "ANLADIM & KAPAT". */
export default function InfoModal() {
  const t = useTranslations("Modal");
  const tc = useTranslations("Common");
  const open = useUiStore((s) => s.infoOpen);
  const setOpen = useUiStore((s) => s.setInfoOpen);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);
  useDialog(open, close, ref);

  return (
    <div
      className={clsx("fixed inset-0 z-73 grid place-items-center bg-berry-dk/50 p-[4vw] transition-opacity duration-300", open ? "opacity-100" : "pointer-events-none opacity-0")}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="info-title" data-state={open ? "open" : "closed"} className={clsx("w-[34vw] max-md:w-[88vw] transition-transform duration-400", open ? "scale-100" : "scale-95")}>
        <KraftCard tilt={-1} className="flex flex-col gap-[1vw] max-md:gap-[3.5vw]">
          <h2 id="info-title" className="font-display text-[2.4vw] max-md:text-[8vw] leading-none">{t("title")}</h2>
          <p className="text40 text-[1.2vw] max-md:text-[4vw] normal-case tracking-normal">{t("subtitle")}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-[1.5vw] gap-y-[0.4vw] max-md:gap-y-[1.5vw] text40 text-[1.1vw] max-md:text-[3.8vw]">
            <dt className="text-berry">{t("address")}</dt>
            <dd>{site.address.full}</dd>
            <dt className="text-berry">{t("phone")}</dt>
            <dd>{site.contact.phone ? <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">{site.contact.phoneDisplay}</a> : tc("todo")}</dd>
            <dt className="text-berry">{t("email")}</dt>
            <dd>{site.contact.email ? <a href={`mailto:${site.contact.email}`} className="underline underline-offset-4 break-all">{site.contact.email}</a> : tc("todo")}</dd>
            <dt className="text-berry">{t("hours")}</dt>
            <dd>{site.hours ? site.hours.map((h) => `${h.days} ${h.open}–${h.close}`).join(" · ") : tc("todo")}</dd>
            <dt className="text-berry">Instagram</dt>
            <dd><a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{site.social.instagramHandle}</a></dd>
          </dl>
          <p className="font-pixel text-[0.7vw] max-md:text-[2.6vw]">{t("reservation")}</p>
          <button type="button" data-cursor-hide data-testid="info-close" onClick={close} className="group mt-[0.5vw] grid place-items-center rounded-full bg-berry px-[1.6vw] py-[0.8vw] max-md:px-[5vw] max-md:py-[3vw] text40 text-[1.1vw] max-md:text-[3.8vw] text-cream transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-ink">
            <RollText text={t("close")} />
          </button>
        </KraftCard>
      </div>
    </div>
  );
}
