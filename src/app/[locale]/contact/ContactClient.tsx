"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RollText } from "@/components/motion/RollText";
import { SoonBadge } from "@/components/ui/SoonBadge";
import { KraftCard } from "@/components/ui/KraftCard";
import { Placeholder } from "@/components/ui/Placeholder";
import { formatHours, site } from "@/lib/site";
import { useUiStore } from "@/lib/ui-store";

const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(`${site.name} ${site.address.full}`)}&output=embed`;
const DIRECTIONS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address.full)}`;
const WA = site.contact.whatsapp ? `https://wa.me/${site.contact.whatsapp.replace(/[^\d]/g, "")}` : null;

const pill = "group grid place-items-center rounded-full px-[1.6vw] py-[0.8vw] max-md:px-[5vw] max-md:py-[3vw] text40 text-[1.1vw] max-md:text-[3.8vw] transition-[transform,background-color,color] duration-300 hover:scale-105";

/** /contact — adres kartı, WhatsApp (null → disabled + yakında), InfoModal, sosyal linkler, tıkla-yükle harita. */
export default function ContactClient() {
  const t = useTranslations("Contact");
  const locale = useLocale() as "tr" | "en";
  const [loaded, setLoaded] = useState(false);
  const setInfoOpen = useUiStore((s) => s.setInfoOpen);

  return (
    <div className="grid grid-cols-2 max-md:grid-cols-1 items-start gap-[4vw] max-md:gap-[10vw]">
      <KraftCard tilt={-1} className="flex flex-col gap-[1.2vw] max-md:gap-[4vw]">
        <h2 className="font-display text-[2.4vw] max-md:text-[8vw] leading-none">{site.name}</h2>
        <address className="not-italic text40 text-[1.3vw] max-md:text-[4.3vw] normal-case tracking-normal">
          {site.address.street}, {site.address.district}<br />{site.address.postalCode} {site.address.city}
        </address>
        <dl className="grid grid-cols-[auto_1fr] gap-x-[1.5vw] gap-y-[0.4vw] max-md:gap-y-[1.5vw] text40 text-[1.1vw] max-md:text-[3.8vw]">
          <dt className="text-berry">{t("phone")}</dt><dd>{site.contact.phone ? <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="inline-flex min-h-[24px] items-center underline underline-offset-4">{site.contact.phoneDisplay}</a> : <SoonBadge />}</dd>
          <dt className="text-berry">{t("hours")}</dt><dd>{formatHours(locale) ?? <SoonBadge />}</dd>
          {/* Sipariş sağlayıcısı henüz belli değil → rozet; akış WhatsApp'ta. */}
          <dt className="text-berry">{t("order")}</dt><dd>{site.orderUrl ? <a href={site.orderUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[24px] items-center underline underline-offset-4">{t("order")}</a> : <><SoonBadge /> <span className="ml-[0.5vw] max-md:ml-[2vw]">{t("orderNote")}</span></>}</dd>
          <dt className="text-berry">{t("email")}</dt><dd>{site.contact.email ? <a href={`mailto:${site.contact.email}`} className="inline-flex min-h-[24px] items-center underline underline-offset-4 break-all">{site.contact.email}</a> : <SoonBadge />}</dd>
        </dl>

        <div className="flex flex-wrap gap-[0.8vw] max-md:gap-[2.5vw]">
          {WA ? (
            <a href={WA} target="_blank" rel="noopener noreferrer" data-cursor-hide data-testid="wa-button" className={`${pill} bg-berry text-cream hover:bg-ink`}><RollText>{t("whatsapp")}</RollText></a>
          ) : (
            <button type="button" disabled aria-disabled="true" data-testid="wa-button" className={`${pill} cursor-not-allowed bg-berry/40 text-cream hover:scale-100`}>{t("whatsapp")} <SoonBadge className="ml-[0.5vw] max-md:ml-[2vw]" /></button>
          )}
          <button type="button" data-cursor-hide data-testid="contact-info" onClick={() => setInfoOpen(true)} className={`${pill} border-[0.15vw] border-berry text-berry hover:bg-berry hover:text-cream`}><RollText>{t("reservation")}</RollText></button>
          <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" data-cursor-hide className={`${pill} bg-mustard text-ink`}><RollText>{t("directions")}</RollText></a>
        </div>

        <ul className="mt-[0.5vw] flex flex-wrap gap-[1.2vw] max-md:gap-[4vw] text40 text-[1.05vw] max-md:text-[3.6vw]">
          <li><a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[24px] items-center underline underline-offset-4">Instagram {site.social.instagramHandle}</a></li>
          <li>{site.social.facebook ? <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[24px] items-center underline underline-offset-4">Facebook</a> : <span className="text-berry">Facebook <SoonBadge className="ml-[0.4vw] max-md:ml-[1.6vw]" /></span>}</li>
        </ul>
      </KraftCard>

      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5vw] max-md:rounded-[4vw]">
        {loaded ? (
          <iframe data-testid="map-iframe" title={t("mapTitle")} src={MAP_SRC} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
        ) : (
          <button type="button" data-testid="map-load" onClick={() => setLoaded(true)} className="group absolute inset-0 grid place-items-center text-cream">
            <Placeholder tone="sky" label={t("mapTitle")} className="absolute inset-0 rounded-none!" />
            <span className="relative rounded-full bg-berry-dk px-[1.6vw] py-[0.8vw] max-md:px-[5vw] max-md:py-[3vw] text40 text-[1.1vw] max-md:text-[3.8vw] transition-transform duration-300 group-hover:scale-105">{t("loadMap")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
