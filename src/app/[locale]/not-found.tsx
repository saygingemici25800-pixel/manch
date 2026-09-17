import { getLocale, getTranslations } from "next-intl/server";
import Float from "@/components/motion/Float";
import RollText from "@/components/motion/RollText";
import TransitionLink from "@/components/motion/TransitionLink";
import Placeholder from "@/components/ui/Placeholder";
import { site } from "@/lib/site";

/** Kural 35 — [locale]/not-found: notFound() atıldığında (catch-all dahil) layout içinde render edilir. */
export default async function NotFound() {
  await getLocale(); // request config'i tetikler; params yok
  const t = await getTranslations("NotFound");
  return (
    <main data-testid="not-found" className="flex min-h-[80svh] flex-col items-center justify-center gap-[2vw] max-md:gap-[6vw] bg-cream px-[2.5vw] py-[10vw] max-md:px-[5vw] max-md:py-[30vw] text-center">
      <div className="flex items-end gap-[1.5vw] max-md:gap-[4vw]">
        {site.mascots.names.map((name, i) => (
          <Float key={name} duration={3 + i * 0.5} delay={i * 0.3}>
            <Placeholder tone={i ? "berry" : "sky"} label={name} ratio="3/4" className="w-[10vw] max-md:w-[26vw]" />
          </Float>
        ))}
      </div>
      <p className="font-pixel text-[1vw] max-md:text-[3.4vw] uppercase tracking-widest text-berry-dk/70">404</p>
      <h1 className="font-display text-[6vw] max-md:text-[13vw] leading-[0.95] text-berry">{t("title")}</h1>
      <p className="max-w-[36vw] max-md:max-w-none text40 text-[1.4vw] max-md:text-[4.5vw] normal-case tracking-normal text-berry-dk">{t("body")}</p>
      <TransitionLink href="/" data-cursor-hide data-testid="nf-home" className="group rounded-full bg-berry px-[2vw] py-[0.9vw] max-md:px-[6vw] max-md:py-[3.5vw] text40 text-[1.3vw] max-md:text-[4.2vw] text-cream transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-ink">
        <RollText text={t("home")} />
      </TransitionLink>
    </main>
  );
}
