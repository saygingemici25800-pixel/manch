import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { SectionHeader } from "@/components/ui/SectionHeader";
import ContactClient from "./ContactClient";

export async function generateMetadata({ params }: Pick<PageProps<"/[locale]/contact">, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  // Faz 7'de `pageMetadata` ile genişletilecek.
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Kural 44 daraltması Faz 7/8 işi; şimdilik tüm mesajlar.
  const messages = await getMessages();
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
