import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckerBand from "@/components/ui/CheckerBand";
import GlyphCheck from "@/components/ui/GlyphCheck";
import KraftCard from "@/components/ui/KraftCard";
import Placeholder from "@/components/ui/Placeholder";
import TileWall from "@/components/ui/TileWall";
import LayoutLab from "./LayoutLab";
import MotionLab from "./MotionLab";
import PinTest from "./PinTest";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProduct } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import { site } from "@/lib/site";
import { colors, fonts, trTestChars } from "@/styles/tokens";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };

// Boyut kademeleri: küçük / orta / büyük — vw + max-md karşılığı (Kural 8)
const sizes = [
  "text-[1.5vw] max-md:text-[4.5vw]",
  "text-[4vw] max-md:text-[9vw]",
  "text-[8vw] max-md:text-[16vw]",
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-[1.5vw] max-md:gap-[5vw]">
      <h2 className="font-display text-[2vw] max-md:text-[7vw] text-berry">{title}</h2>
      {children}
    </section>
  );
}

export default async function LabPage({ params }: PageProps<"/[locale]/lab">) {
  // Kural 23: /lab sadece development'ta; production'da 404
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Lab");
  const berry = getProduct("berry-manch");
  const loc = locale as Locale;
  const otherLocale = routing.locales.find((l) => l !== locale) ?? locale;

  const glyphFamilies = fonts.map((f) => ({
    label: f.label,
    cssVar: f.cssVar,
    note: f.enOnly ? t("enOnly") : undefined,
  }));

  return (
    <main id="main" className="flex flex-col gap-[5vw] max-md:gap-[14vw] px-[2.5vw] pb-[3vw] pt-[8vw] max-md:px-[5vw] max-md:pb-[10vw] max-md:pt-[24vw]">
      <header className="flex flex-col gap-[0.5vw] max-md:gap-[2vw]">
        <h1 className="heading180 text-berry">{t("title")}</h1>
        <p className="text40 text-berry-dk">{t("subtitle")}</p>
        <nav className="flex gap-[1.5vw] max-md:gap-[4vw] text-[1vw] max-md:text-[3.5vw] uppercase tracking-wide underline underline-offset-4">
          <Link href="/lab" locale={otherLocale} data-testid="nav-other-locale">{t("navOtherLocale")}</Link>
          <Link href="/" data-testid="nav-home">{t("navHome")}</Link>
        </nav>
      </header>

      {/* ---------- Renkler ---------- */}
      <Section id="colors" title={t("colors")}>
        <ul className="grid grid-cols-9 max-md:grid-cols-3 gap-[1vw] max-md:gap-[3vw]">
          {(Object.keys(colors) as Array<keyof typeof colors>).map((name) => (
            <li key={name} className="flex flex-col gap-[0.4vw] max-md:gap-[1.5vw]">
              <div
                className="aspect-square rounded-[1vw] max-md:rounded-[3vw] border border-ink/10"
                style={{ background: colors[name] }}
              />
              <span className="text-[1vw] max-md:text-[3.5vw] uppercase tracking-wide">{name}</span>
              <span className="font-pixel text-[0.7vw] max-md:text-[2.6vw]">{colors[name]}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Fontlar ---------- */}
      <Section id="fonts" title={t("fonts")}>
        <div className="flex flex-col gap-[3vw] max-md:gap-[8vw]">
          {fonts.map((f) => (
            <div key={f.token} className="flex flex-col gap-[0.6vw] max-md:gap-[2vw]">
              <p className="text-[1vw] max-md:text-[3.5vw] uppercase tracking-wide text-berry">
                {f.label} · <code className="font-pixel">{f.className}</code>
                {f.enOnly && <> · {t("enOnly")}</>}
              </p>
              {sizes.map((s) => (
                <p key={s} className={`${f.className} ${s} leading-none text-ink break-words [overflow-wrap:anywhere]`}>
                  {t("sample")}
                </p>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-[0.8vw] max-md:gap-[3vw] rounded-[1vw] max-md:rounded-[3vw] bg-white p-[1.5vw] max-md:p-[5vw]">
          <p className="text-[1vw] max-md:text-[3.5vw] uppercase tracking-wide text-berry">
            {t("glyphCheck", { chars: trTestChars })}
          </p>
          <GlyphCheck
            families={glyphFamilies}
            chars={trTestChars}
            labels={{
              checking: t("glyphChecking"),
              ok: t("glyphOk"),
              missing: t("glyphMissing"),
              notLoaded: t("glyphNotLoaded"),
            }}
          />
        </div>
      </Section>

      {/* ---------- Utility'ler ---------- */}
      <Section id="utilities" title={t("utilities")}>
        <div className="flex flex-col gap-[2vw] max-md:gap-[6vw]">
          <div>
            <code className="font-pixel text-[0.8vw] max-md:text-[3vw] text-berry">heading180</code>
            <p className="heading180 text-berry">{site.name}</p>
          </div>
          <div>
            <code className="font-pixel text-[0.8vw] max-md:text-[3vw] text-berry">text40</code>
            <p className="text40 text-ink">{site.tagline}</p>
          </div>
          <div>
            <code className="font-pixel text-[0.8vw] max-md:text-[3vw] text-berry">text-stroke-small</code>
            <p className="font-display text-[6vw] max-md:text-[14vw] leading-none text-berry text-stroke-small">
              {site.name}
            </p>
          </div>
          <div>
            <code className="font-pixel text-[0.8vw] max-md:text-[3vw] text-berry">grain</code>
            <div className="grain mt-[0.5vw] flex h-[12vw] max-md:h-[36vw] items-center justify-center rounded-[1vw] max-md:rounded-[3vw] bg-sky">
              <span className="text40 text-berry">{t("grainSample")}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- Desenler ---------- */}
      <Section id="patterns" title={t("patterns")}>
        <div className="flex flex-col gap-[2vw] max-md:gap-[6vw]">
          <div className="flex flex-col gap-[1vw] max-md:gap-[3vw]">
            <code className="font-pixel text-[0.8vw] max-md:text-[3vw] text-berry">CheckerBand</code>
            <CheckerBand tone="berry" />
            <CheckerBand tone="pink" rows={3} />
            <CheckerBand tone="ink" rows={1} className="-rotate-2" />
          </div>

          <div className="flex flex-col gap-[1vw] max-md:gap-[3vw]">
            <code className="font-pixel text-[0.8vw] max-md:text-[3vw] text-berry">TileWall</code>
            <TileWall className="flex min-h-[24vw] max-md:min-h-[70vw] items-center justify-center rounded-[1vw] max-md:rounded-[3vw] p-[3vw] max-md:p-[8vw]">
              <p className="font-display text-center text-[5vw] max-md:text-[11vw] leading-[0.95] text-berry">
                {site.wallQuote}
              </p>
            </TileWall>
          </div>

          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-[2vw] max-md:gap-[8vw]">
            <div className="flex flex-col gap-[1vw] max-md:gap-[3vw]">
              <code className="font-pixel text-[0.8vw] max-md:text-[3vw] text-berry">KraftCard</code>
              {berry && (
                <KraftCard className="max-w-[28vw] max-md:max-w-none">
                  <p className="font-display text-[2.2vw] max-md:text-[8vw] leading-none">{berry.name[loc]}</p>
                  <p className="text40 mt-[0.5vw] max-md:mt-[2vw] normal-case tracking-normal text-[1.3vw] max-md:text-[4.5vw]">
                    {berry.desc[loc]}
                  </p>
                  <ul className="mt-[1vw] max-md:mt-[4vw] flex flex-col gap-[0.2vw] max-md:gap-[1vw] text-[1.2vw] max-md:text-[4.2vw] uppercase tracking-wide">
                    {berry.ingredients[loc].map((i) => (
                      <li key={i}>· {i}</li>
                    ))}
                  </ul>
                </KraftCard>
              )}
            </div>

            <div className="flex flex-col gap-[1vw] max-md:gap-[3vw]">
              <code className="font-pixel text-[0.8vw] max-md:text-[3vw] text-berry">Placeholder</code>
              <div className="grid grid-cols-2 gap-[1vw] max-md:gap-[3vw]">
                <Placeholder tone="berry" label={t("placeholderBerry")} />
                <Placeholder tone="sky" label={t("placeholderSky")} ratio="1/1" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- Motion (Faz 3) ---------- */}
      <Section id="motion" title={t("motion")}>
        <MotionLab />
      </Section>

      {/* ---------- Pin testi (Faz 5, R15 izole) ---------- */}
      <Section id="pin" title={t("pin")}>
        <PinTest />
      </Section>

      {/* ---------- Layout (Faz 4) ---------- */}
      <Section id="layout" title={t("layout")}>
        <LayoutLab />
      </Section>
    </main>
  );
}
