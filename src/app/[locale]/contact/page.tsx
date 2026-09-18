import type { Metadata } from "next";

import type { Locale } from "@/i18n/routing";
import { clientMessages } from "@/i18n/client-messages";
import { pageMetadata } from "@/lib/seo";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { SectionHeader } from "@/components/ui/SectionHeader";
import ContactClient from "./ContactClient";

export async function generateMetadata({ params }: Pick<PageProps<"/[locale]/contact">, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/contact",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Kural 44: temel namespace"ler + "Contact".
  const messages = clientMessages(await getMessages(), ["Contact"]);
  const t = await getTranslations("Contact");
  return (
    <NextIntlClientProvider messages={messages}>
    <main id="main" data-testid="contact-page" className="bg-cream px-[2.5vw] pb-[8vw] pt-[9vw] max-md:px-[5vw] max-md:pb-[16vw] max-md:pt-[26vw]">
      <SectionHeader as="h1" eyebrow={t("eyebrow")} title={t("title")} className="mb-[3vw] max-md:mb-[8vw]" />
      <ContactClient />
    </main>
    </NextIntlClientProvider>
  );
}
