import { getTranslations } from "next-intl/server";
import { Juggle } from "@/components/motion/Juggle";
import { INGREDIENTS } from "@/components/ui/IngredientIcon";
import Logo from "@/components/ui/Logo";
import { RollText } from "@/components/motion/RollText";
import { SplitReveal } from "@/components/motion/SplitReveal";
import TransitionLink from "@/components/motion/TransitionLink";

const LINKS = [
  { key: "home", href: "/" },
  { key: "menu", href: "/menu" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;


/** R18 — Modak linkler (line-mask + RollText), dev MANCH wordmark, juggle ikonlar, tape, telif, kredi. */
export default async function Footer() {
  const t = await getTranslations("Footer");
  const tn = await getTranslations("Nav");
  return (
    <footer data-nav-dark className="relative overflow-hidden bg-berry px-[2.5vw] pb-[2vw] pt-[6vw] max-md:px-[5vw] max-md:pb-[6vw] max-md:pt-[16vw] text-cream">
      <div className="grid grid-cols-[1fr_auto] max-md:grid-cols-1 items-end gap-[3vw] max-md:gap-[10vw]">
        <nav className="flex flex-col gap-[0.4vw] max-md:gap-[1.5vw]">
          {LINKS.map((l) => (
            <TransitionLink key={l.key} href={l.href} data-cursor-hide className="group w-fit text40 font-display normal-case tracking-normal text-[2.6vw] max-md:text-[8vw] leading-none hover:text-cream">
              <SplitReveal type="lines" className="block" >{tn(l.key)}</SplitReveal>
              <span className="sr-only">{tn(l.key)}</span>
              <span aria-hidden="true" className="hidden group-hover:block"><RollText>{tn(l.key)}</RollText></span>
            </TransitionLink>
          ))}
        </nav>
        <div className="flex flex-col items-end max-md:items-start gap-[1vw] max-md:gap-[3vw]">
          <Juggle items={INGREDIENTS.slice(0, 4)} className="text-cream [&_span]:h-[3.5vw] [&_span]:w-[3.5vw] max-md:[&_span]:h-[10vw] max-md:[&_span]:w-[10vw]" />
          <p className="font-pixel text-[0.75vw] max-md:text-[2.8vw] uppercase tracking-widest text-cream">{t("tape")}</p>
        </div>
      </div>

      {/* Dev wordmark: gerçek logo, DEKORATİF filigran (aria-hidden, metin değil).
          Eskiden `text-berry` (#6a1f3b) `bg-berry-dk` (#4e1030) üstündeydi → 1.30:1,
          bilinçli olarak zar zor görünen bir filigran (karar 2026-09-18).
          Kit'te tek bordo kaldığı için bordo-üstü-bordo oldu ve **tamamen kayboldu**
          (1.00 — gözle bakma turu yakaladı, 2026-09-28). Filigran NİYETİ kit içinde
          yeniden kuruluyor: krem %12 → 1.32:1, eski değere birebir yakın.
          Kural 40 burada geçerli değil: bu metin değil, `aria-hidden` dekoratif SVG. */}
      <Logo className="mt-[2vw] max-md:mt-[8vw] block w-[95vw] max-md:w-[140vw] h-auto text-[color-mix(in_srgb,var(--color-cream)_12%,var(--color-berry))] select-none" />

      <div className="mt-[1.5vw] max-md:mt-[5vw] flex flex-wrap items-center justify-between gap-[1vw] max-md:gap-[3vw] text40 text-[0.9vw] max-md:text-[3.2vw] text-cream">
        <span>{t("rights")}</span>
        <span>{t("credit")}</span>
      </div>
    </footer>
  );
}
