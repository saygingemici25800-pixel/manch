import { getTranslations, setRequestLocale } from "next-intl/server";

import { featured, menu } from "@/data/menu";
import { site } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale); // Kural 16

  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");

  return (
    <main>
      <h1>{t("heroTitle")}</h1>
      <p>{t("heroLead")}</p>
      <p>{tc("tagline")}</p>
      <p>
        {site.address.full} · {site.name}
      </p>
      <p>
        {menu.length} ürün · {featured.length} imza ürün · {locale}
      </p>
    </main>
  );
}
