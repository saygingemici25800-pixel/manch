"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RollText } from "@/components/motion/RollText";
import { SoonBadge } from "@/components/ui/SoonBadge";
import { Placeholder } from "@/components/ui/Placeholder";
import { site } from "@/lib/site";
import { useUiStore } from "@/lib/ui-store";

const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(`${site.name} ${site.address.full}`)}&output=embed`;
const DIRECTIONS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address.full)}`;

/** Konum — adres, saatler (TODO), tıkla-yükle Google Maps iframe (lazy). */
export function Location() {
  const t = useTranslations("Home.location");
  const tc = useTranslations("Common");
  const [loaded, setLoaded] = useState(false);
  const setInfoOpen = useUiStore((s) => s.setInfoOpen);

  return (
    <section id="location" data-nav-dark className="scroll-mt-[6vw] bg-berry px-[2.5vw] py-[8vw] max-md:px-[5vw] max-md:py-[16vw] text-cream">
      <div className="grid grid-cols-2 max-md:grid-cols-1 items-center gap-[4vw] max-md:gap-[10vw]">
        <div className="flex flex-col gap-[1.5vw] max-md:gap-[5vw]">
          <p className="font-display text-[1.3vw] max-md:text-[4.5vw] text-mustard">{t("eyebrow")}</p>
          <h2 className="font-display text-[5vw] max-md:text-[12vw] leading-[0.95]">{t("title")}</h2>
          <address className="not-italic text40 text-[1.5vw] max-md:text-[4.8vw] normal-case tracking-normal">
            {site.address.street}, {site.address.district}<br />{site.address.postalCode} {site.address.city}
          </address>
          <dl className="grid grid-cols-[auto_1fr] gap-x-[1.5vw] gap-y-[0.4vw] max-md:gap-y-[1.5vw] text40 text-[1.1vw] max-md:text-[3.8vw]">
            <dt className="text-mustard">{t("hours")}</dt><dd>{site.hours ? site.hours.map((h) => `${h.days} ${h.open}–${h.close}`).join(" · ") : <SoonBadge />}</dd>
            <dt className="text-mustard">{t("phone")}</dt><dd>{site.contact.phone ? <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">{site.contact.phoneDisplay}</a> : tc("todo")}</dd>
          </dl>
          <div className="flex flex-wrap gap-[1vw] max-md:gap-[3vw]">
            <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" data-cursor-hide className="group rounded-full bg-mustard px-[1.6vw] py-[0.7vw] max-md:px-[5vw] max-md:py-[2.5vw] text40 text-[1.1vw] max-md:text-[3.8vw] text-ink transition-[transform] duration-300 hover:scale-105">
              <RollText>{t("directions")}</RollText>
            </a>
            <button type="button" data-cursor-hide onClick={() => setInfoOpen(true)} className="group rounded-full border-[0.15vw] border-cream px-[1.6vw] py-[0.7vw] max-md:px-[5vw] max-md:py-[2.5vw] text40 text-[1.1vw] max-md:text-[3.8vw] transition-[transform,background-color,color] duration-300 hover:scale-105 hover:bg-cream hover:text-berry">
              <RollText>{t("contact")}</RollText>
            </button>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5vw] max-md:rounded-[4vw]">
          {loaded ? (
            <iframe
              data-testid="map-iframe"
              title={t("mapTitle")}
              src={MAP_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <button type="button" data-testid="map-load" onClick={() => setLoaded(true)} className="group absolute inset-0 grid place-items-center text-cream">
              <Placeholder tone="sky" label={t("mapTitle")} className="absolute inset-0 rounded-none!" />
              <span className="relative rounded-full bg-berry-dk px-[1.6vw] py-[0.8vw] max-md:px-[5vw] max-md:py-[3vw] text40 text-[1.1vw] max-md:text-[3.8vw] transition-transform duration-300 group-hover:scale-105">
                {t("loadMap")}
              </span>
              <span className="absolute bottom-[1vw] max-md:bottom-[3vw] font-pixel text-[0.6vw] max-md:text-[2.4vw] uppercase tracking-widest">{t("mapNote")}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
