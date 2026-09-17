import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MotionLab } from "./MotionLab";
import { CheckerBand } from "@/components/ui/CheckerBand";
import { GlyphCheck } from "@/components/ui/GlyphCheck";
import { KraftCard } from "@/components/ui/KraftCard";
import { Placeholder } from "@/components/ui/Placeholder";
import { TileWall } from "@/components/ui/TileWall";
import { colors, colorTokens, TR_GLYPHS } from "@/styles/tokens";

type Props = { params: Promise<{ locale: string }> };

const PANGRAM_TR = "Pijamalı hasta yağız şoföre çabucak güvendi.";
const FONT_ROWS = [
  { label: "Modak", cssVar: "--font-modak", cls: "font-display", token: "--font-display" },
  { label: "Mouse Memoirs", cssVar: "--font-mouse-memoirs", cls: "font-ui", token: "--font-ui" },
  { label: "Press Start 2P", cssVar: "--font-press-start", cls: "font-pixel", token: "--font-pixel" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-berry/20 py-[3vw] max-md:py-[8vw]">
      <h2 className="mb-[1.6vw] font-display text-[2.6vw] text-berry max-md:mb-[4vw] max-md:text-[7vw]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function LabPage({ params }: Props) {
  // Kural 23: production'da lab yok.
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  setRequestLocale(locale); // Kural 16
  const t = await getTranslations("Lab");

  return (
    <main id="main" className="grain min-h-screen bg-cream px-[3vw] py-[3vw] max-md:px-[5vw]">
      <h1 className="heading180 text-berry">LAB</h1>
      <p className="text40 text-berry-dk">{t("subtitle")}</p>

      {/* ---------------- RENKLER ---------------- */}
      <Section id="colors" title={t("colors")}>
        <ul className="grid grid-cols-3 gap-[1vw] max-md:grid-cols-2 max-md:gap-[3vw]">
          {colorTokens.map((name) => (
            <li key={name} className="border border-berry/20">
              <div className="h-[6vw] w-full max-md:h-[18vw]" style={{ background: colors[name] }} />
              <div className="flex items-baseline justify-between p-[0.6vw] font-ui text-[1vw] uppercase max-md:p-[2vw] max-md:text-[3.2vw]">
                <span>{name}</span>
                <span className="text-berry">{colors[name]}</span>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------- FONTLAR ---------------- */}
      <Section id="fonts" title={t("fonts")}>
        <div className="flex flex-col gap-[2vw] max-md:gap-[6vw]">
          {FONT_ROWS.map((f) => (
            <div key={f.label}>
              <p className="font-ui text-[1vw] uppercase tracking-[0.12em] text-berry max-md:text-[3.2vw]">
                {f.label} · <code>{f.token}</code> · <code>.{f.cls}</code>
              </p>
              <p className={`${f.cls} text-[3vw] leading-tight text-ink max-md:text-[7vw]`}>
                MANCH — Handmade Hits Different
              </p>
              <p className={`${f.cls} text-[1.6vw] leading-tight text-berry-dk max-md:text-[4.6vw]`}>
                {PANGRAM_TR}
              </p>
              <p className={`${f.cls} text-[2vw] tracking-[0.08em] text-berry max-md:text-[6vw]`}>
                {TR_GLYPHS.join(" ")}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- TR GLYPH TESTİ ---------------- */}
      <Section id="glyphs" title={t("glyphs")}>
        <p className="mb-[1vw] font-ui text-[1vw] uppercase text-berry-dk max-md:mb-[3vw] max-md:text-[3.2vw]">
          {t("glyphsNote")}
        </p>
        <GlyphCheck families={FONT_ROWS.map(({ label, cssVar }) => ({ label, cssVar }))} />
      </Section>

      {/* ---------------- UTILITY'LER ---------------- */}
      <Section id="utilities" title={t("utilities")}>
        <div className="flex flex-col gap-[1.4vw] max-md:gap-[4vw]">
          <div>
            <code className="font-ui text-[1vw] text-berry max-md:text-[3.2vw]">.heading180</code>
            <p className="heading180 text-berry">SMASH</p>
          </div>
          <div>
            <code className="font-ui text-[1vw] text-berry max-md:text-[3.2vw]">.text40</code>
            <p className="text40 text-berry-dk">United Chill Burger Zone</p>
          </div>
          <div>
            <code className="font-ui text-[1vw] text-berry max-md:text-[3.2vw]">.text-stroke-small</code>
            <p className="text-stroke-small font-display text-[4vw] text-berry max-md:text-[10vw]">MANCH</p>
          </div>
          <div>
            <code className="font-ui text-[1vw] text-berry max-md:text-[3.2vw]">.text-stroke-fill</code>
            <p className="text-stroke-fill font-display text-[4vw] text-mustard max-md:text-[10vw]">MANCH</p>
          </div>
          <div>
            <code className="font-ui text-[1vw] text-berry max-md:text-[3.2vw]">.grain</code>
            <div className="grain h-[8vw] bg-mustard max-md:h-[20vw]" />
          </div>
        </div>
      </Section>

      {/* ---------------- MOTION ---------------- */}
      <Section id="motion" title={t("motion")}>
        <MotionLab />
      </Section>

      {/* ---------------- DESENLER ---------------- */}
      <Section id="patterns" title={t("patterns")}>
        <div className="flex flex-col gap-[1.6vw] max-md:gap-[5vw]">
          <div>
            <code className="font-ui text-[1vw] text-berry max-md:text-[3.2vw]">
              CheckerBand — kart bandı (2×12, R11) / ayırıcı (2×40)
            </code>
            {/* R11 bandı ürün kartı genişliğinde önizlenir; tam genişlikte kareler yassılaşır. */}
            <CheckerBand className="h-[3vw] w-[35vw] max-md:h-[8vw] max-md:w-full" />
            <CheckerBand cols={40} className="mt-[0.6vw] h-[2vw] max-md:mt-[2vw] max-md:h-[5vw]" />
          </div>
          <div>
            <code className="font-ui text-[1vw] text-berry max-md:text-[3.2vw]">TileWall</code>
            <TileWall className="flex h-[12vw] items-center justify-center max-md:h-[30vw]">
              <p className="font-display text-[2.4vw] text-berry max-md:text-[6vw]">
                THE BURGER YOU&apos;LL CRAVE AGAIN
              </p>
            </TileWall>
          </div>
          <div>
            <code className="font-ui text-[1vw] text-berry max-md:text-[3.2vw]">KraftCard</code>
            <KraftCard className="w-[24vw] p-[1.4vw] max-md:w-full max-md:p-[4vw]">
              <p className="font-display text-[1.6vw] max-md:text-[5vw]">Berry Manch</p>
              <ul className="font-ui text-[1vw] uppercase max-md:text-[3.4vw]">
                <li>Roquefort aioli</li>
                <li>Yaban mersini reçeli</li>
                <li>Kuzu kulağı</li>
              </ul>
            </KraftCard>
          </div>
          <div>
            <code className="font-ui text-[1vw] text-berry max-md:text-[3.2vw]">Placeholder (Kural 7)</code>
            <div className="grid grid-cols-4 gap-[1vw] max-md:grid-cols-2 max-md:gap-[3vw]">
              {(["berry", "sky", "pink", "paper"] as const).map((tone) => (
                <Placeholder
                  key={tone}
                  tone={tone}
                  label={tone}
                  className="h-[8vw] max-md:h-[20vw]"
                />
              ))}
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
