import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Float } from "@/components/motion/Float";
import { SplitReveal } from "@/components/motion/SplitReveal";

/** Misu & Miyu — maskot lockup + idle salınım. */
export async function MisuMiyu() {
  const t = await getTranslations("Home");

  return (
    <section className="grid grid-cols-2 items-center gap-[4vw] bg-cream px-[3vw] py-[5vw] max-md:grid-cols-1 max-md:gap-[6vw] max-md:px-[5vw] max-md:py-[14vw]">
      <Float amount={12} className="justify-self-center">
        <Image
          src="/images/misu-lockup.png"
          alt={t("misu.imageAlt")}
          width={596}
          height={559}
          quality={75}
          sizes="(min-width: 768px) 32vw, 72vw"
          className="h-auto w-[32vw] max-md:w-[72vw]"
        />
      </Float>

      <div>
        <SplitReveal as="h2" type="lines" className="heading180 text-[3.6vw] text-berry max-md:text-[10vw]">
          {t("misu.title")}
        </SplitReveal>
        <SplitReveal as="p" type="lines" className="mt-[1.2vw] max-w-[44ch] font-ui text-[1.1vw] text-ink max-md:mt-[4vw] max-md:text-[4vw]">
          {t("misu.body")}
        </SplitReveal>
        <p className="mt-[1.5vw] inline-block -rotate-2 bg-mustard px-[1vw] py-[0.4vw] font-pixel text-[0.9vw] uppercase text-ink max-md:mt-[5vw] max-md:px-[3vw] max-md:py-[1.5vw] max-md:text-[3vw]">
          {t("misu.tape")}
        </p>
      </div>
    </section>
  );
}
