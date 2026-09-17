import { getTranslations } from "next-intl/server";
import Float from "@/components/motion/Float";
import SplitReveal from "@/components/motion/SplitReveal";
import CheckerBand from "@/components/ui/CheckerBand";
import Image from "next/image";
import { site } from "@/lib/site";

/** Misu & Miyu — maskot tanıtımı, idle float. TODO(Faz 7): line-art. */
export default async function MisuMiyu() {
  const t = await getTranslations("Home.misu");
  return (
    <section className="overflow-hidden bg-pink text-berry-dk">
      <CheckerBand tone="pink" rows={1} />
      <div className="grid grid-cols-2 max-md:grid-cols-1 items-center gap-[4vw] max-md:gap-[10vw] px-[2.5vw] py-[8vw] max-md:px-[5vw] max-md:py-[16vw]">
        <Float duration={3.4} className="justify-self-center">
          {/* TODO: maskot vektör/orijinal istenecek — basılı menüden kesit, düşük çözünürlük */}
          <div className="relative aspect-[1.55] w-[32vw] max-md:w-[80vw]">
            <Image src="/images/misu-miyu.png" alt={t("imageAlt")} fill sizes="(max-width: 768px) 80vw, 32vw" className="object-contain" />
          </div>
        </Float>
        <div className="flex flex-col gap-[1.5vw] max-md:gap-[5vw]">
          <p className="font-display text-[1.3vw] max-md:text-[4.5vw]">{site.mascots.label}</p>
          <SplitReveal as="h2" mode="lines" text={t("title")} className="font-display text-[5vw] max-md:text-[12vw] leading-[0.95] text-berry" />
          <p className="max-w-[32vw] max-md:max-w-none text40 text-[1.4vw] max-md:text-[4.5vw] normal-case tracking-normal">{t("body")}</p>
          <p className="font-pixel text-[0.8vw] max-md:text-[3vw] uppercase tracking-widest">{t("tape")}</p>
        </div>
      </div>
      <CheckerBand tone="pink" rows={1} />
    </section>
  );
}
