import { getTranslations } from "next-intl/server";

import { Sticker } from "@/components/ui/Sticker";

import { BuildSequence } from "@/components/sections/BuildSequence";
import { SectionHeader } from "@/components/ui/SectionHeader";

/** R15b bölümü — başlık + yapım sırası. */
export async function Build() {
  const t = await getTranslations("Home");
  return (
    <section id="build" className="relative isolate scroll-mt-[6vw] bg-paper px-[3vw] py-[5vw] max-md:px-[5vw] max-md:py-[14vw]">
      {/* Sticker 2/3 — paper (açık) zemin → köfte. SAĞ kenardan kesiliyor, bölümün üst
          şeridinde: sol boşluk 3vw ve alt şerit 72px, ikisi de 9vw'lik sticker'a dar
          (ölçüldü — soldan taşınca fotoğrafın altına giriyor, alttan kesilince sliver
          kalıyor). Mobilde gizli (Kural 8: tek sticker). */}
      <Sticker name="patty" tone="light" place="top-[3vw] right-[-3vw] rotate-[9deg] max-md:hidden" />
      <SectionHeader eyebrow={t("build.eyebrow")} title={t("build.title")} />
      <BuildSequence />
    </section>
  );
}
