import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { SplitReveal } from "@/components/motion/SplitReveal";
import { KraftCard } from "@/components/ui/KraftCard";

/** "Hazır soslara biraz uzağız" — hikaye + tezgah fotoğrafı + kraft kart. */
export async function Handmade() {
  const t = await getTranslations("Home");
  const points = t("handmade.points").split("|");

  return (
    <section className="grid grid-cols-2 items-center gap-[4vw] bg-cream px-[3vw] py-[5vw] max-md:grid-cols-1 max-md:gap-[8vw] max-md:px-[5vw] max-md:py-[14vw]">
      <div>
        <p className="font-display text-[1vw] uppercase tracking-[0.2em] text-berry max-md:text-[3.4vw]">
          {t("handmade.eyebrow")}
        </p>
        <SplitReveal as="h2" type="lines" className="heading180 text-[4vw] text-berry max-md:text-[11vw]">
          {t("handmade.title")}
        </SplitReveal>
        <SplitReveal as="p" type="lines" className="mt-[1.2vw] max-w-[46ch] font-ui text-[1.1vw] text-ink max-md:mt-[4vw] max-md:text-[4vw]">
          {t("handmade.body")}
        </SplitReveal>

        <KraftCard className="mt-[2vw] w-[26vw] p-[1.4vw] max-md:mt-[6vw] max-md:w-full max-md:p-[5vw]">
          <p className="font-display text-[1.4vw] text-berry max-md:text-[5vw]">
            {t("handmade.cardTitle")}
          </p>
          <ul className="mt-[0.5vw] flex flex-col gap-[0.2vw] font-ui text-[1vw] uppercase text-berry-dk max-md:mt-[2vw] max-md:gap-[1vw] max-md:text-[3.6vw]">
            {points.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        </KraftCard>
      </div>

      <Image
        src="/images/team-counter.jpg"
        alt={t("handmade.imageAlt")}
        width={1176}
        height={1510}
        quality={75}
        sizes="(min-width: 768px) 45vw, 90vw"
        className="w-full rounded-[2vw] object-cover max-md:rounded-[5vw]"
      />
    </section>
  );
}
