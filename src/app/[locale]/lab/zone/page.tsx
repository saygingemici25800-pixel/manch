import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { clientMessages } from "@/i18n/client-messages";

import { ZoneStage } from "./ZoneStage";

type Props = { params: Promise<{ locale: string }> };

/** Faz 5.5.2 izole test sayfası — Kural 23: production'da 404. */
export default async function ZoneLabPage({ params }: Props) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  setRequestLocale(locale); // Kural 16

  const messages = clientMessages(await getMessages(), ["Zone", "Lab"]);
  const t = await getTranslations("Zone");

  return (
    <NextIntlClientProvider messages={messages}>
      <main id="main" className="relative h-[100svh] w-full overflow-hidden bg-cream">
        <ZoneStage />
        <p className="pointer-events-none absolute left-[2vw] top-[2vw] z-10 font-pixel text-[0.8vw] uppercase tracking-[0.2em] text-berry max-md:left-[5vw] max-md:top-[5vw] max-md:text-[2.6vw]">
          {t("title")} · 5.5.2 — salon
        </p>
      </main>
    </NextIntlClientProvider>
  );
}
