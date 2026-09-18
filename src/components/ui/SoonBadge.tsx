import clsx from "clsx";
import { useTranslations } from "next-intl";

/**
 * KURAL A — görünen arayüzde eksik bilgi boş bırakılmaz, bu rozetle gösterilir.
 * Kasıtlı görünsün diye hardal zemin + pixel font: eksik veri gibi değil,
 * tasarımın parçası gibi durur.
 *
 * KURAL B (Kural 54) ile karıştırma: yapılandırılmış veride (JSON-LD) bilinmeyen
 * alan **hiç yazılmaz** — orada bu rozetin karşılığı yoktur.
 */
export function SoonBadge({ className }: { className?: string }) {
  const t = useTranslations("Common");
  return (
    <span
      data-soon=""
      className={clsx(
        "inline-block whitespace-nowrap rounded-full bg-mustard px-[0.7vw] py-[0.2vw] font-pixel text-[0.6vw] uppercase leading-none tracking-[0.12em] text-ink max-md:px-[2.4vw] max-md:py-[0.9vw] max-md:text-[2.2vw]",
        className,
      )}
    >
      {t("soon")}
    </span>
  );
}
