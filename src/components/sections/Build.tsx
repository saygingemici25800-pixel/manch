import { getTranslations } from "next-intl/server";

import { BuildSequence } from "@/components/sections/BuildSequence";
import { SectionHeader } from "@/components/ui/SectionHeader";

/** R15b bölümü — başlık + yapım sırası. */
export async function Build() {
  const t = await getTranslations("Home");
  return (
    <section id="build" className="scroll-mt-[6vw] bg-paper px-[3vw] py-[5vw] max-md:px-[5vw] max-md:py-[14vw]">
      <SectionHeader eyebrow={t("build.eyebrow")} title={t("build.title")} />
      <BuildSequence />
    </section>
  );
}
