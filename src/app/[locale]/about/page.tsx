import type { Metadata } from "next";

import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Float } from "@/components/motion/Float";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { KraftCard } from "@/components/ui/KraftCard";
import TransitionLink from "@/components/motion/TransitionLink";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TileWall } from "@/components/ui/TileWall";
import { site } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

/** Zone galerisi — gerçek Instagram kareleri (karar 2026-09-18). */
const GALLERY = ["01-tray", "02-box", "03-flatlay", "04-couple", "05-table", "06-tiramisu"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/about",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale); // Kural 16

  const t = await getTranslations("About");
  const points = t("story.points").split("|");
  const alts = t("gallery.alts").split("|");
  const timeline = t("timeline.items").split("|").map((row) => row.split("::"));

  return (
    <main id="main" className="bg-cream">
      {/* ---------- hikaye ---------- */}
      <section className="grid grid-cols-2 items-center gap-[4vw] px-[3vw] pb-[5vw] pt-[9vw] max-md:grid-cols-1 max-md:gap-[8vw] max-md:px-[5vw] max-md:pb-[12vw] max-md:pt-[26vw]">
        <div>
          <p className="font-display text-[1vw] uppercase tracking-[0.2em] text-berry max-md:text-[3.4vw]">
            {t("eyebrow")}
          </p>
          <SplitReveal as="h1" type="lines" className="heading180 text-[4.2vw] text-berry max-md:text-[12vw]">
            {t("title")}
          </SplitReveal>
          <SplitReveal as="h2" type="lines" className="mt-[1.5vw] max-w-[30ch] text40 text-[1.8vw] text-berry-dk max-md:mt-[5vw] max-md:text-[5.5vw]">
            {t("story.title")}
          </SplitReveal>
          <p className="mt-[1.2vw] max-w-[48ch] font-ui text-[1.05vw] text-ink max-md:mt-[4vw] max-md:text-[3.9vw]">
            {t("story.p1")}
          </p>
          <p className="mt-[0.8vw] max-w-[48ch] font-ui text-[1.05vw] text-ink max-md:mt-[3vw] max-md:text-[3.9vw]">
            {t("story.p2")}
          </p>

          <KraftCard className="mt-[2vw] w-[26vw] p-[1.4vw] max-md:mt-[6vw] max-md:w-full max-md:p-[5vw]">
            <p className="font-display text-[1.4vw] text-berry max-md:text-[5vw]">{t("story.cardTitle")}</p>
            <ul className="mt-[0.5vw] flex flex-col gap-[0.2vw] font-ui text-[1vw] uppercase text-berry-dk max-md:mt-[2vw] max-md:gap-[1vw] max-md:text-[3.6vw]">
              {points.map((p) => (
                <li key={p}>· {p}</li>
              ))}
            </ul>
          </KraftCard>
        </div>

        {/* Kural 47: /about'un LCP adayı bu görsel (ölçüldü) → priority */}
        <Image
          src="/images/team-counter.jpg"
          alt={t("story.title")}
          width={1176}
          height={1510}
          priority
          fetchPriority="high"
          quality={70}
          sizes="(min-width: 768px) 45vw, 90vw"
          className="w-full rounded-[2vw] object-cover max-md:rounded-[5vw]"
        />
      </section>

      {/* ---------- maskotlar ----------
           `id` ŞART: Zone'daki maskot panosunun "TAM SAYFAYA GİT" bağlantısı
           `/about#mascots`'a gidiyor (lib/zone/frames.ts). Çapa yokken bağlantı sessizce
           sayfanın BAŞINA düşüyordu — kırık link değil, yanlış yere giden link; hiçbir
           durum kodu kontrolüne takılmaz, yalnızca gözle bakınca görülür (Kural 59).
           `scroll-mt` nav yüksekliği payı — diğer çapalarla aynı (Kural 33). */}
      <section
        id="mascots"
        className="grid scroll-mt-[6vw] grid-cols-2 items-center gap-[4vw] bg-pink px-[3vw] py-[5vw] max-md:grid-cols-1 max-md:gap-[6vw] max-md:px-[5vw] max-md:py-[13vw]"
      >
        <Float amount={12} className="justify-self-center">
          <Image
            src="/images/misu-lockup.png"
            alt={t("mascots.title")}
            width={596}
            height={559}
            quality={75}
            sizes="(min-width: 768px) 32vw, 72vw"
            className="h-auto w-[32vw] max-md:w-[72vw]"
          />
        </Float>
        <div>
          <SplitReveal as="h2" type="lines" className="heading180 text-[3.6vw] text-berry-dk max-md:text-[10vw]">
            {t("mascots.title")}
          </SplitReveal>
          <p className="mt-[1.2vw] max-w-[44ch] font-ui text-[1.05vw] text-berry-dk max-md:mt-[4vw] max-md:text-[3.9vw]">
            {t("mascots.body")}
          </p>
        </div>
      </section>

      {/* ---------- zone galerisi ---------- */}
      <TileWall size={72} className="px-[3vw] py-[5vw] max-md:px-[5vw] max-md:py-[13vw]">
        <SectionHeader
          eyebrow={t("gallery.eyebrow")}
          title={t("gallery.title")}
          counter={t("gallery.counter")}
        />
        <ul data-about-gallery="" className="grid grid-cols-3 gap-[1vw] max-md:grid-cols-2 max-md:gap-[3vw]">
          {GALLERY.map((g, i) => (
            <li key={g} className="overflow-hidden rounded-[1vw] max-md:rounded-[3vw]">
              <Image
                src={`/images/social/${g}.jpg`}
                alt={alts[i] ?? ""}
                width={1080}
                height={1080}
                quality={75}
                sizes="(min-width: 768px) 30vw, 45vw"
                className="aspect-square w-full object-cover"
              />
            </li>
          ))}
        </ul>

        {/* Zone'a dönüş: Zone'a giriş kapısı ana sayfadaki `#zone` bölümünde.
            Bağlantı tek yönlüydü — maskot panosu buraya getiriyordu ama buradan
            geri dönüş yoktu (Faz 6 envanteri). Hash'li iç link `TransitionLink`
            ile: perde hash'te normal navigasyona düşer (Kural 29), `LenisTicker`
            de hedefe kaydırır (Kural 32). */}
        <TransitionLink
          href="/#zone"
          data-cursor-hide
          data-testid="about-zone-cta"
          className="mt-[2vw] inline-flex items-center gap-[0.5vw] rounded-full border-2 border-berry-dk bg-mustard px-[1.8vw] py-[0.7vw] font-ui text-[1.1vw] uppercase tracking-[0.12em] text-berry-dk transition-transform duration-300 hover:scale-105 max-md:mt-[6vw] max-md:gap-[2vw] max-md:px-[6vw] max-md:py-[2.6vw] max-md:text-[4vw]"
        >
          {t("gallery.cta")} <span aria-hidden="true">→</span>
        </TransitionLink>
      </TileWall>

      {/* ---------- timeline ---------- */}
      <section className="px-[3vw] py-[5vw] max-md:px-[5vw] max-md:py-[13vw]">
        <SectionHeader eyebrow={t("timeline.eyebrow")} title={t("timeline.title")} />
        <ol className="flex flex-col gap-[1vw] border-l-[0.2vw] border-berry pl-[2vw] max-md:gap-[4vw] max-md:border-l-[0.8vw] max-md:pl-[6vw]">
          {timeline.map(([when, what]) => (
            <li key={when} className="relative">
              <span className="absolute -left-[2.5vw] top-[0.4vw] h-[0.7vw] w-[0.7vw] rounded-full bg-mustard max-md:-left-[7.4vw] max-md:h-[2.4vw] max-md:w-[2.4vw]" />
              <p className="font-pixel text-[0.85vw] uppercase text-berry max-md:text-[3vw]">{when}</p>
              <p className="font-ui text-[1.2vw] text-ink max-md:text-[4.2vw]">{what}</p>
            </li>
          ))}
        </ol>
        <p className="mt-[2vw] font-pixel text-[0.8vw] uppercase tracking-[0.25em] text-berry max-md:mt-[6vw] max-md:text-[2.8vw]">
          {site.wallQuote}
        </p>
      </section>
    </main>
  );
}
