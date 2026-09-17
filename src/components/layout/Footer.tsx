import { getTranslations } from "next-intl/server";
import Juggle from "@/components/motion/Juggle";
import IngredientIcon, { INGREDIENTS } from "@/components/ui/IngredientIcon";
import RollText from "@/components/motion/RollText";
import SplitReveal from "@/components/motion/SplitReveal";
import TransitionLink from "@/components/motion/TransitionLink";
import { site } from "@/lib/site";

const LINKS = [
  { key: "home", href: "/" },
  { key: "menu", href: "/menu" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

const icons = INGREDIENTS.slice(0, 4).map((n) => <IngredientIcon key={n} name={n} className="h-[3.5vw] w-[3.5vw] max-md:h-[10vw] max-md:w-[10vw] text-mustard" />);

/** R18 — Modak linkler (line-mask + RollText), dev MANCH wordmark, juggle ikonlar, tape, telif, kredi. */
export default async function Footer() {
  const t = await getTranslations("Footer");
  const tn = await getTranslations("Nav");
  return (
    <footer data-nav-dark className="relative overflow-hidden bg-berry-dk px-[2.5vw] pb-[2vw] pt-[6vw] max-md:px-[5vw] max-md:pb-[6vw] max-md:pt-[16vw] text-cream">
      <div className="grid grid-cols-[1fr_auto] max-md:grid-cols-1 items-end gap-[3vw] max-md:gap-[10vw]">
        <nav className="flex flex-col gap-[0.4vw] max-md:gap-[1.5vw]">
          {LINKS.map((l) => (
            <TransitionLink key={l.key} href={l.href} data-cursor-hide className="group w-fit text40 font-display normal-case tracking-normal text-[2.6vw] max-md:text-[8vw] leading-none hover:text-mustard">
              <SplitReveal mode="lines" text={tn(l.key)} className="block" />
              <span className="sr-only">{tn(l.key)}</span>
              <span aria-hidden="true" className="hidden group-hover:block"><RollText text={tn(l.key)} /></span>
            </TransitionLink>
          ))}
        </nav>
        <div className="flex flex-col items-end max-md:items-start gap-[1vw] max-md:gap-[3vw] [--juggle-scale:0.7]">
          <Juggle>{icons}</Juggle>
          <p className="font-pixel text-[0.75vw] max-md:text-[2.8vw] uppercase tracking-widest text-cream">{t("tape")}</p>
        </div>
      </div>

      {/* dev wordmark: dekoratif, konturlu SVG metin (axe kontrast denetimi dışında, Kural 40) */}
      <svg aria-hidden="true" viewBox="0 0 1000 200" className="mt-[2vw] max-md:mt-[8vw] block w-[95vw] max-md:w-[140vw] select-none overflow-visible">
        <text x="0" y="175" fill="none" stroke="var(--color-berry)" strokeWidth="6" style={{ fontFamily: "var(--font-display)", fontSize: 230 }}>
          {site.name}
        </text>
      </svg>

      <div className="mt-[1.5vw] max-md:mt-[5vw] flex flex-wrap items-center justify-between gap-[1vw] max-md:gap-[3vw] text40 text-[0.9vw] max-md:text-[3.2vw] text-cream">
        <span>{t("rights")}</span>
        <span>{t("credit")}</span>
      </div>
    </footer>
  );
}
