import { getTranslations } from "next-intl/server";
import RollText from "@/components/motion/RollText";
import Placeholder from "@/components/ui/Placeholder";
import SectionHeader from "@/components/ui/SectionHeader";
import { site } from "@/lib/site";

/** Instagram grid — 6 statik görsel (şimdilik Placeholder) + @manch.tr CTA. */
export default async function InstagramGrid() {
  const t = await getTranslations("Home.insta");
  const labels = t("alts").split("|");
  return (
    <section className="bg-cream px-[2.5vw] py-[8vw] max-md:px-[5vw] max-md:py-[16vw]">
      <SectionHeader eyebrow={t("eyebrow")} title={site.social.instagramHandle} counter={t("counter")} className="mb-[3vw] max-md:mb-[8vw]" />
      <ul className="grid grid-cols-3 max-md:grid-cols-2 gap-[1.5vw] max-md:gap-[3vw]">
        {labels.slice(0, 6).map((label, i) => (
          <li key={label}>
            {/* TODO: gerçek görseller /images/ (Faz 8 next/image) */}
            <Placeholder tone={i % 2 ? "sky" : "berry"} label={label} ratio="1/1" />
          </li>
        ))}
      </ul>
      <div className="mt-[3vw] max-md:mt-[8vw] flex justify-center">
        <a
          href={site.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor-hide
          className="group rounded-full bg-berry px-[2vw] py-[0.9vw] max-md:px-[6vw] max-md:py-[3.5vw] text40 text-[1.3vw] max-md:text-[4.2vw] text-cream transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-ink"
        >
          <RollText text={t("cta")} />
        </a>
      </div>
    </section>
  );
}
