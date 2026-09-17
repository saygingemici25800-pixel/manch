import { getTranslations, setRequestLocale } from "next-intl/server";

import { getFeatured, products } from "@/data/menu";
import { site } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale); // Kural 16

  const t = await getTranslations("Home");

  return (
    <main>
      <h1>{t("hero.title")}</h1>
      <p>{t("hero.sub")}</p>
      <p>{t("tagline")}</p>
      <p>
        {site.address.full} · {site.contact.phoneDisplay}
      </p>
      <p>
        {products.length} ürün · {getFeatured().length} imza ürün · {locale}
      </p>
    </main>
  );
}
