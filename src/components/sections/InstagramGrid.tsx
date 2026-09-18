import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { site } from "@/lib/site";

/**
 * 6 gerçek 1:1 fotoğraf (karar 2026-09-18).
 * Şeffaf kesit veya metin kartı **karıştırılmaz** — eski sitedeki tutarsızlık buydu.
 */
const SHOTS = ["01-tray", "02-box", "03-flatlay", "04-couple", "05-table", "06-tiramisu"] as const;

export async function InstagramGrid() {
  const t = await getTranslations("Home");
  const alts = t("insta.alts").split("|");

  return (
    <section className="bg-pink px-[3vw] py-[5vw] max-md:px-[5vw] max-md:py-[14vw]">
      <SectionHeader
        eyebrow={t("insta.eyebrow")}
        title={site.social.instagramHandle}
        counter={t("insta.counter")}
      />
      <ul data-insta-grid="" className="grid grid-cols-3 gap-[1vw] max-md:grid-cols-2 max-md:gap-[3vw]">
        {SHOTS.map((s, i) => (
          <li key={s} className="overflow-hidden rounded-[1vw] max-md:rounded-[3vw]">
            <Image
              src={`/images/social/${s}.jpg`}
              alt={alts[i] ?? ""}
              width={1080}
              height={1080}
              quality={75}
              sizes="(min-width: 768px) 30vw, 45vw"
              className="aspect-square w-full object-cover"
            />
          </li>
        ))}
      </ul>
      <a
        href={site.social.instagram}
        target="_blank"
        rel="noreferrer"
        data-cursor-hide
        className="mt-[2vw] inline-block bg-berry px-[2vw] py-[0.8vw] font-ui text-[1.1vw] uppercase tracking-[0.1em] text-cream transition-transform duration-300 hover:scale-105 max-md:mt-[6vw] max-md:px-[6vw] max-md:py-[3vw] max-md:text-[4vw]"
      >
        {t("insta.cta")}
      </a>
    </section>
  );
}
