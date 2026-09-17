"use client";

import { useTranslations } from "next-intl";
import BlobButton from "@/components/motion/BlobButton";
import { useUiStore } from "@/lib/ui-store";

/** Blob CTA → sepet drawer'ı (sipariş linki TODO olduğu sürece). */
export default function OrderCta({ className }: { className?: string }) {
  const t = useTranslations("Common");
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  return (
    <BlobButton ariaLabel={t("orderNow")} onClick={() => setCartOpen(true)} className={className}>
      {t("orderNow")}
    </BlobButton>
  );
}
