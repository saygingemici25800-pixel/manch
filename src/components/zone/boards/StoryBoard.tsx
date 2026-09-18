"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import TransitionLink from "@/components/motion/TransitionLink";
import type { ZoneFrame } from "@/lib/zone/frames";
import { useZoneStore } from "@/store/zone";

/**
 * Hikâye panosu (spec 6.4): görsel üstte, başlık + iki paragraf + "TAM SAYFAYA GİT →".
 * `crew` · `mascot` · `visit` — üçü de aynı bileşen, metin `Zone.story.<id>`'den gelir.
 *
 * **"Tam sayfaya git" Zone'u KAPATIR.** `exit()` çağrılmadan gezinirsek perde açık kalır ve
 * kaydırma kilidi sayaçta asılı kalır (Kural 67); `TransitionLink` R2 perdesini sürer.
 */
export function StoryBoard({ frame }: { frame: ZoneFrame }) {
  const t = useTranslations("Zone");
  const exit = useZoneStore((s) => s.exit);

  return (
    <div data-testid="story-board" data-frame={frame.id} className="flex flex-col gap-[1.2vw] max-md:gap-[4vw]">
      <div className="relative aspect-[4/3] w-full overflow-hidden border-2 border-ink/20 bg-paper">
        <Image
          src={frame.art}
          alt={t(`frames.${frame.id}`)}
          fill
          sizes="(max-width: 768px) 92vw, 720px"
          className="object-contain"
        />
      </div>

      <div className="flex flex-col gap-[0.7vw] max-md:gap-[3vw]">
        <p className="font-ui text-[1vw] leading-[1.6] text-ink max-md:text-[3.6vw]">
          {t(`story.${frame.id}.p1`)}
        </p>
        <p className="font-ui text-[1vw] leading-[1.6] text-ink max-md:text-[3.6vw]">
          {t(`story.${frame.id}.p2`)}
        </p>
      </div>

      <TransitionLink
        href={frame.href}
        data-testid="story-fullpage"
        onClick={exit}
        className="self-start rounded-full border-2 border-berry bg-cream px-[1.2vw] py-[0.45vw] font-ui text-[0.9vw] uppercase tracking-[0.1em] text-berry max-md:px-[4vw] max-md:py-[1.6vw] max-md:text-[3.2vw]"
      >
        {t("fullPage")}
      </TransitionLink>
    </div>
  );
}
