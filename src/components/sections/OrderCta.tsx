"use client";

import { useTranslations } from "next-intl";

import { BlobButton } from "@/components/motion/BlobButton";
import { RollText } from "@/components/motion/RollText";
import { useUiStore } from "@/lib/ui-store";

/** R7 blob CTA → sepeti açar. */
export function OrderCta() {
  const t = useTranslations("Common");
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  return (
    <BlobButton
      onClick={() => setCartOpen(true)}
      className="h-[7vw] w-[18vw] max-md:h-[22vw] max-md:w-[58vw]"
    >
      <RollText>{t("orderNow")}</RollText>
    </BlobButton>
  );
}
