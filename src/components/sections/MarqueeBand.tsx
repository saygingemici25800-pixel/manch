import { getTranslations } from "next-intl/server";

import { Marquee } from "@/components/motion/Marquee";

/** R14 — iki bant, zıt yön. Kural 28: metinler iki dilde de İngilizce. */
export async function MarqueeBand() {
  const t = await getTranslations("Home");
  const items = t("marqueeItems").split("|");

  return (
    <div className="flex flex-col gap-[1.5vw] overflow-hidden bg-cream py-[2vw] max-md:gap-[5vw] max-md:py-[7vw]">
      <Marquee items={items} direction={1} tilt={-4} />
      <Marquee items={[...items].reverse()} direction={-1} tilt={4} />
    </div>
  );
}
