import { getTranslations } from "next-intl/server";
import RollText from "@/components/motion/RollText";
import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import { site } from "@/lib/site";

// 3 fotoğraf + 3 kesit (sky zemin); her kare @manch.tr'ye link
const SHOTS: { src: string; cutout?: boolean }[] = [
  { src: "/images/hero-cook.jpg" },
  { src: "/burgers/classic-manch.png", cutout: true },
  { src: "/images/crispy-triangle.jpg" },
  { src: "/burgers/fig-jam.png", cutout: true },
  { src: "/images/tiramisu.jpg" },
  { src: "/burgers/truffle-manch.png", cutout: true },
];

/** Instagram grid — 6 görsel + @manch.tr CTA. */
export default async function InstagramGrid() {
  const t = await getTranslations("Home.insta");
  const labels = t("alts").split("|");
  return (
    <section className="bg-cream px-[2.5vw] py-[8vw] max-md:px-[5vw] max-md:py-[16vw]">
      <SectionHeader eyebrow={t("eyebrow")} title={site.social.instagramHandle} counter={t("counter")} className="mb-[3vw] max-md:mb-[8vw]" />
      <ul className="grid grid-cols-3 max-md:grid-cols-2 gap-[1.5vw] max-md:gap-[3vw]">
        {SHOTS.map((shot, i) => (
          <li key={shot.src}>
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" data-cursor-hide className="group relative block aspect-square overflow-hidden rounded-[1vw] max-md:rounded-[3vw] bg-sky">
              <Image
                src={shot.src}
                alt={labels[i] ?? ""}
                fill
                sizes="(max-width: 768px) 45vw, 30vw"
                className={shot.cutout ? "object-contain p-[8%] transition-transform duration-500 ease-[var(--ease-jelly)] group-hover:rotate-3 group-hover:scale-105" : "object-cover transition-transform duration-500 group-hover:scale-105"}
              />
            </a>
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
