import clsx from "clsx";
import { useTranslations } from "next-intl";

import { label, type Ground, type LabelClass } from "@/styles/emphasis";

/**
 * KURAL A — görünen arayüzde eksik bilgi boş bırakılmaz, bu rozetle gösterilir.
 * Rozet **konturludur** (FAZ B-2): eksik veri gibi değil, tasarımın parçası gibi
 * durur, ama dolu bir CTA ile yarışmaz.
 *
 * ZEMİN VERİLMEK ZORUNDA (Kural 79-A). 2026-09-28'de rol devri `mustard → cream`
 * yapıldı ve rozetin zemini sorulmadı: krem rozet krem KraftCard / krem çekmece
 * üstünde **1.00** oldu, 18 kullanım yerinin 17'sinde gövde tamamen kayboldu.
 * `ground` varsayılanı "light"; koyu bölümde (Location) açıkça "dark" verilir.
 *
 * KURAL B (Kural 54) ile karıştırma: yapılandırılmış veride (JSON-LD) bilinmeyen
 * alan **hiç yazılmaz** — orada bu rozetin karşılığı yoktur.
 */
export function SoonBadge({ className, ground = "light" }: { className?: string; ground?: Ground }) {
  const t = useTranslations("Common");
  /* Tip kapısı: buraya `action(ground)` yazmak DERLENMEZ — rozet eylem değildir. */
  const tone: LabelClass = label(ground);
  return (
    <span
      data-soon=""
      data-ground={ground}
      className={clsx(
        "inline-block whitespace-nowrap rounded-full px-[0.7vw] py-[0.2vw] font-pixel text-[0.6vw] uppercase leading-none tracking-[0.12em] max-md:px-[2.4vw] max-md:py-[0.9vw] max-md:text-[2.2vw]",
        tone,
        className,
      )}
    >
      {t("soon")}
    </span>
  );
}
