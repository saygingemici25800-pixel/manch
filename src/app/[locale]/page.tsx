import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";

// Faz 1 placeholder — gerçek Hero ve section'lar Faz 5'te gelir.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const otherLocale = routing.locales.find((l) => l !== locale) ?? locale;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-[1.5vw] px-[2.5vw] py-[4vw] text-center max-md:gap-[5vw] max-md:px-[6vw] max-md:py-[12vw]">
      <p className="text-[1.1vw] uppercase tracking-wide max-md:text-[3.5vw]">
        {t("eyebrow")}
      </p>
      <h1 className="text-[8vw] leading-none max-md:text-[18vw]">
        {site.name}
      </h1>
      <p className="text-[2vw] max-md:text-[5vw]">{t("tagline")}</p>
      <p className="text-[1.2vw] max-md:text-[3.8vw]">{site.address.full}</p>
      <Link
        href="/"
        locale={otherLocale}
        className="text-[1.1vw] underline underline-offset-4 max-md:text-[3.5vw]"
      >
        {t("switchLocale")}
      </Link>
      {process.env.NODE_ENV !== "production" && (
        <Link href="/lab" data-testid="nav-lab" className="text-[1.1vw] underline underline-offset-4 max-md:text-[3.5vw]">
          {t("lab")}
        </Link>
      )}
    </main>
  );
}
