import { getTranslations } from "next-intl/server";
import Marquee from "@/components/motion/Marquee";

/** R14 — iki zıt yönlü pixel bant (Kural 28: EN). */
export default async function MarqueeBand() {
  const t = await getTranslations("Home");
  const items = t("marqueeItems").split("|");
  return (
    <div className="flex flex-col gap-[1.2vw] max-md:gap-[4vw] overflow-hidden bg-cream py-[3vw] max-md:py-[8vw]">
      <Marquee items={items} direction={1} tilt={-4} />
      <Marquee items={items} direction={-1} tilt={4} className="bg-berry-dk" duration={22} />
    </div>
  );
}
