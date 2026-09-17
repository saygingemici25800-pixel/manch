import { getTranslations } from "next-intl/server";
import SplitReveal from "@/components/motion/SplitReveal";
import KraftCard from "@/components/ui/KraftCard";

/** El yapımı hikayesi — "Hazır soslara biraz uzağız." + kraft kart. */
export default async function Handmade() {
  const t = await getTranslations("Home.handmade");
  const points = t("points").split("|");
  return (
    <section className="grid grid-cols-2 max-md:grid-cols-1 items-center gap-[4vw] max-md:gap-[10vw] bg-cream px-[2.5vw] py-[8vw] max-md:px-[5vw] max-md:py-[16vw]">
      <div className="flex flex-col gap-[1.5vw] max-md:gap-[5vw]">
        <p className="font-display text-[1.3vw] max-md:text-[4.5vw] text-berry">{t("eyebrow")}</p>
        <SplitReveal as="h2" mode="lines" text={t("title")} className="font-display text-[5.5vw] max-md:text-[12vw] leading-[0.95] text-berry" />
        <p className="max-w-[34vw] max-md:max-w-none text40 text-[1.4vw] max-md:text-[4.5vw] normal-case tracking-normal text-berry-dk">{t("body")}</p>
      </div>
      <KraftCard tilt={1.5} className="justify-self-center w-[30vw] max-md:w-full">
        <p className="font-display text-[2.2vw] max-md:text-[8vw] leading-none">{t("cardTitle")}</p>
        <ul className="mt-[1.2vw] max-md:mt-[4vw] flex flex-col gap-[0.6vw] max-md:gap-[2vw] text40 text-[1.2vw] max-md:text-[4.2vw]">
          {points.map((p) => (
            <li key={p} className="flex gap-[0.6vw] max-md:gap-[2vw]"><span aria-hidden="true" className="mt-[0.35vw] max-md:mt-[1.2vw] h-[0.6vw] w-[0.6vw] max-md:h-[2vw] max-md:w-[2vw] shrink-0 rounded-full bg-mustard" />{p}</li>
          ))}
        </ul>
      </KraftCard>
    </section>
  );
}
