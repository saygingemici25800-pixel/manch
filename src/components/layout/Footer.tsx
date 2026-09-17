import { getTranslations } from "next-intl/server";
import Juggle from "@/components/motion/Juggle";
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

// Geçici ikonlar — Faz 7'de berry tek çizgi line-art SVG
const icons = [
  <svg key="l" viewBox="0 0 24 24" className="h-[3.5vw] w-[3.5vw] max-md:h-[10vw] max-md:w-[10vw]"><circle cx="12" cy="12" r="10" fill="#7CBF6A" /></svg>,
  <svg key="t" viewBox="0 0 24 24" className="h-[3.5vw] w-[3.5vw] max-md:h-[10vw] max-md:w-[10vw]"><circle cx="12" cy="12" r="10" fill="#E24B3B" /></svg>,
  <svg key="c" viewBox="0 0 24 24" className="h-[3.5vw] w-[3.5vw] max-md:h-[10vw] max-md:w-[10vw]"><rect x="2" y="2" width="20" height="20" rx="3" fill="var(--color-mustard)" /></svg>,
  <svg key="p" viewBox="0 0 24 24" className="h-[3.5vw] w-[3.5vw] max-md:h-[10vw] max-md:w-[10vw]"><circle cx="12" cy="12" r="10" fill="#6B3F2A" /></svg>,
];

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
          <p className="font-pixel text-[0.75vw] max-md:text-[2.8vw] uppercase tracking-widest text-cream/70">{t("tape")}</p>
        </div>
      </div>

      <p aria-hidden="true" className="mt-[2vw] max-md:mt-[8vw] font-display text-[22vw] max-md:text-[34vw] leading-[0.8] text-berry select-none">
        {site.name}
      </p>

      <div className="mt-[1.5vw] max-md:mt-[5vw] flex flex-wrap items-center justify-between gap-[1vw] max-md:gap-[3vw] text40 text-[0.9vw] max-md:text-[3.2vw] text-cream/80">
        <span>{t("rights")}</span>
        <span>{t("credit")}</span>
      </div>
    </footer>
  );
}
