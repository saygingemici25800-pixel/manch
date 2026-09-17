import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Float from "@/components/motion/Float";
import SplitReveal from "@/components/motion/SplitReveal";
import CheckerBand from "@/components/ui/CheckerBand";
import KraftCard from "@/components/ui/KraftCard";
import Placeholder from "@/components/ui/Placeholder";
import SectionHeader from "@/components/ui/SectionHeader";
import TileWall from "@/components/ui/TileWall";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: Pick<PageProps<"/[locale]/about">, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");
  const points = t("story.points").split("|");
  const gallery = t("gallery.alts").split("|");
  const timeline = t("timeline.items").split("|").map((row) => row.split("::"));

  return (
    <main data-testid="about-page">
      {/* hikaye */}
      <section className="bg-cream px-[2.5vw] pb-[8vw] pt-[9vw] max-md:px-[5vw] max-md:pb-[16vw] max-md:pt-[26vw]">
        <SectionHeader eyebrow={t("eyebrow")} title={t("title")} className="mb-[3vw] max-md:mb-[8vw]" />
        <div className="grid grid-cols-2 max-md:grid-cols-1 items-start gap-[4vw] max-md:gap-[10vw]">
          <div className="flex flex-col gap-[1.5vw] max-md:gap-[5vw]">
            <SplitReveal as="h2" mode="lines" text={t("story.title")} className="font-display text-[4.5vw] max-md:text-[11vw] leading-[0.95] text-berry" />
            <p className="text40 text-[1.4vw] max-md:text-[4.5vw] normal-case tracking-normal text-berry-dk">{t("story.p1")}</p>
            <p className="text40 text-[1.4vw] max-md:text-[4.5vw] normal-case tracking-normal text-berry-dk">{t("story.p2")}</p>
          </div>
          <KraftCard tilt={1.2} className="justify-self-center w-[30vw] max-md:w-full">
            <p className="font-display text-[2.2vw] max-md:text-[8vw] leading-none">{t("story.cardTitle")}</p>
            <ul className="mt-[1.2vw] max-md:mt-[4vw] flex flex-col gap-[0.6vw] max-md:gap-[2vw] text40 text-[1.2vw] max-md:text-[4.2vw]">
              {points.map((p) => (
                <li key={p} className="flex gap-[0.6vw] max-md:gap-[2vw]"><span aria-hidden="true" className="mt-[0.35vw] max-md:mt-[1.2vw] h-[0.6vw] w-[0.6vw] max-md:h-[2vw] max-md:w-[2vw] shrink-0 rounded-full bg-mustard" />{p}</li>
              ))}
            </ul>
          </KraftCard>
        </div>
      </section>

      {/* maskotlar */}
      <section className="overflow-hidden bg-pink text-berry-dk">
        <CheckerBand tone="pink" rows={1} />
        <div className="grid grid-cols-2 max-md:grid-cols-1 items-center gap-[4vw] max-md:gap-[10vw] px-[2.5vw] py-[6vw] max-md:px-[5vw] max-md:py-[14vw]">
          <div className="flex items-end justify-center gap-[2vw] max-md:gap-[6vw]">
            {site.mascots.names.map((name, i) => (
              <Float key={name} duration={3 + i * 0.6} delay={i * 0.4} className={i ? "mb-[3vw]" : ""}>
                <Placeholder tone={i ? "berry" : "sky"} label={name} ratio="3/4" className="w-[14vw] max-md:w-[34vw]" />
              </Float>
            ))}
          </div>
          <div className="flex flex-col gap-[1.2vw] max-md:gap-[4vw]">
            <p className="font-display text-[1.3vw] max-md:text-[4.5vw] opacity-70">{site.mascots.label}</p>
            <h2 className="font-display text-[4vw] max-md:text-[10vw] leading-[0.95] text-berry">{t("mascots.title")}</h2>
            <p className="max-w-[32vw] max-md:max-w-none text40 text-[1.3vw] max-md:text-[4.3vw] normal-case tracking-normal">{t("mascots.body")}</p>
          </div>
        </div>
        <CheckerBand tone="pink" rows={1} />
      </section>

      {/* zone galerisi */}
      <TileWall className="px-[2.5vw] py-[8vw] max-md:px-[5vw] max-md:py-[16vw]">
        <SectionHeader eyebrow={t("gallery.eyebrow")} title={t("gallery.title")} counter={t("gallery.counter")} className="mb-[3vw] max-md:mb-[8vw]" />
        <ul data-testid="zone-gallery" className="grid grid-cols-4 max-md:grid-cols-2 gap-[1.5vw] max-md:gap-[3vw]">
          {gallery.slice(0, 4).map((label, i) => (
            <li key={label}><Placeholder tone={i % 2 ? "sky" : "berry"} label={label} ratio="3/4" /></li>
          ))}
        </ul>
        <p className="mt-[3vw] max-md:mt-[8vw] font-display text-center text-[3.2vw] max-md:text-[9vw] leading-[0.95] text-berry">{site.wallQuote}</p>
      </TileWall>

      {/* timeline */}
      <section data-nav-dark className="bg-berry-dk px-[2.5vw] py-[8vw] max-md:px-[5vw] max-md:py-[16vw] text-cream">
        <SectionHeader tone="cream" eyebrow={t("timeline.eyebrow")} title={t("timeline.title")} className="mb-[3vw] max-md:mb-[8vw]" />
        <ol data-testid="timeline" className="relative flex flex-col gap-[2vw] max-md:gap-[6vw] border-l-[0.2vw] max-md:border-l-[0.6vw] border-mustard pl-[2vw] max-md:pl-[6vw]">
          {timeline.map(([when, what]) => (
            <li key={when} className="relative">
              <span aria-hidden="true" className="absolute -left-[2.55vw] max-md:-left-[7.4vw] top-[0.4vw] h-[0.9vw] w-[0.9vw] max-md:h-[2.6vw] max-md:w-[2.6vw] rounded-full bg-mustard" />
              <p className="font-pixel text-[0.8vw] max-md:text-[3vw] uppercase tracking-widest text-mustard">{when}</p>
              <p className="text40 text-[1.6vw] max-md:text-[5vw] normal-case tracking-normal">{what}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
