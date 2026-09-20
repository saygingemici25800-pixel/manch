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
    <footer data-nav-dark className="relative overflow-hidden bg-berry-dk px-[2.5vw] pb-[2vw] pt-[6vw] max-md:px-[5vw] max-md:pb-[6vw] max-md:pt-[16vw] text-cream">
      <div className="grid grid-cols-[1fr_auto] max-md:grid-cols-1 items-end gap-[3vw] max-md:gap-[10vw]">
        <nav className="flex flex-col gap-[0.4vw] max-md:gap-[1.5vw]">
          {LINKS.map((l) => (
            <TransitionLink key={l.key} href={l.href} data-cursor-hide className="group w-fit text40 font-display normal-case tracking-normal text-[2.6vw] max-md:text-[8vw] leading-none hover:text-mustard">
              <SplitReveal type="lines" className="block" >{tn(l.key)}</SplitReveal>
              <span className="sr-only">{tn(l.key)}</span>
              <span aria-hidden="true" className="hidden group-hover:block"><RollText>{tn(l.key)}</RollText></span>
            </TransitionLink>
          ))}
        </nav>
        <div className="flex flex-col items-end max-md:items-start gap-[1vw] max-md:gap-[3vw]">
          <p className="font-pixel text-[0.75vw] max-md:text-[2.8vw] uppercase tracking-widest text-cream">{t("tape")}</p>
        </div>
      </div>

      {/* Zıplama alanı (R18): wordmark'ın ÜSTÜNDEN sayfanın en alt zeminine kadar.
          YIĞIN SIRASI — dekoratif wordmark z-0, ikonlar z-10, GERÇEK METİN z-20.
          İkonlar ilk denemede wordmark'ın ARKASINA konmuştu (z-0); ölçümlerin hepsi
          yeşildi ama ekranda **görünmüyorlardı**: wordmark bandın tamamını kaplayan
          opak bir SVG, ikonlar yalnız harf aralarında bir an göründü (Kural 59).
          İkonlar artık wordmark'ın önünde ama telif satırı ile menü linklerinin
          ARKASINDA; ayrıca katmanın alt sınırı telif satırının üstünde bitiyor
          (`bottom-[3vw] max-md:bottom-[15vw]`) → ikon hiç metne değmiyor.
          `pointer-events-none` — tıklamayı yakalamıyor. */}
      <div className="relative [--juggle-scale:1]">
        <Juggle field items={INGREDIENTS.slice(0, 4)} className="z-10 text-mustard [&_span]:h-[3.5vw] [&_span]:w-[3.5vw] max-md:[&_span]:h-[8vw] max-md:[&_span]:w-[8vw]" />

        {/* dev wordmark: gerçek logo, dekoratif */}
        <Logo className="relative z-0 mt-[2vw] max-md:mt-[8vw] block w-[95vw] max-md:w-[140vw] h-auto text-berry select-none" />

        <div className="relative z-20 mt-[1.5vw] max-md:mt-[5vw] flex flex-wrap items-center justify-between gap-[1vw] max-md:gap-[3vw] text40 text-[0.9vw] max-md:text-[3.2vw] text-cream">
          <span>{t("rights")}</span>
          <span>{t("credit")}</span>
        </div>
      </div>
    </footer>
  );
}
