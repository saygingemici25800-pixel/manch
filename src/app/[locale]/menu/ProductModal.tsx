"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { RollText } from "@/components/motion/RollText";
import { KraftCard } from "@/components/ui/KraftCard";
import Image from "next/image";
import { Placeholder } from "@/components/ui/Placeholder";
import type { Product } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import { useCartStore } from "@/lib/cart-store";
import { useDialog } from "@/lib/hooks/useDialog";

interface Props {
  product: Product | null;
  onClose: () => void;
}

/** Ürün detay modalı: kraft kart malzeme listesi + quick details + sepete ekle. Açık/kapalı URL'den (?p=). */
export function ProductModal({ product, onClose }: Props) {
  const t = useTranslations("Product");
  const tc = useTranslations("Common");
  const tm = useTranslations("Menu");
  const locale = useLocale() as Locale;
  const ref = useRef<HTMLDivElement>(null);
  const add = useCartStore((s) => s.add);
  const open = product !== null;
  useDialog(open, onClose, ref);

  return (
    <div
      className={clsx("fixed inset-0 z-73 grid place-items-center bg-berry-dk/50 p-[3vw] max-md:p-[4vw] transition-opacity duration-300", open ? "opacity-100" : "pointer-events-none opacity-0")}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={product ? "product-title" : undefined}
        aria-label={product ? undefined : t("detail")}
        data-testid="product-modal"
        data-state={open ? "open" : "closed"}
        className={clsx("w-[52vw] max-md:w-[92vw] max-h-[90svh] overflow-y-auto transition-transform duration-400", open ? "scale-100" : "scale-95")}
      >
        {product && (
          <KraftCard tilt={-0.8} className="grid grid-cols-[1fr_1.2fr] max-md:grid-cols-1 gap-[2vw] max-md:gap-[5vw]">
            {product.image ? (
              <div className={clsx("relative aspect-square w-full self-start overflow-hidden rounded-[1vw] max-md:rounded-[3vw]", product.image.endsWith(".png") && "bg-berry")}>
                <Image src={product.image} alt={product.name[locale]} fill sizes="(max-width: 768px) 84vw, 22vw" className={product.image.endsWith(".png") ? "object-contain p-[4%]" : "object-cover"} />
              </div>
            ) : (
              <Placeholder tone="sky" label={product.name[locale]} className="w-full self-start" />
            )}
            <div className="flex flex-col gap-[1vw] max-md:gap-[3.5vw]">
              <div className="flex items-start justify-between gap-[1vw]">
                <h2 id="product-title" className="font-display text-[2.6vw] max-md:text-[8vw] leading-none">{product.name[locale]}</h2>
                <button type="button" data-cursor-hide data-testid="product-close" onClick={onClose} aria-label={tc("close")} className="text40 text-[1.1vw] max-md:text-[4vw] underline underline-offset-4">✕</button>
              </div>
              <p className="text40 text-[1.2vw] max-md:text-[4.2vw] normal-case tracking-normal">{product.desc[locale]}</p>
              <p className="font-pixel text-[0.7vw] max-md:text-[2.8vw] uppercase tracking-wide">{product.price !== null ? `${product.price} TL` : t("priceTodo")}</p>
              {/* Faz 4'te eklenen anahtar — 2/2: modalda fiyatın yanında */}
              <p data-testid="modal-disclaimer" className="font-ui text-[0.7vw] max-md:text-[2.6vw] normal-case text-berry-dk">{tm("disclaimer")}</p>

              <h3 className="mt-[0.5vw] font-display text-[1.3vw] max-md:text-[5vw]">{t("ingredients")}</h3>
              <ul className="flex flex-col gap-[0.2vw] max-md:gap-[1vw] text40 text-[1.05vw] max-md:text-[3.8vw]">
                {product.ingredients[locale].map((i) => <li key={i}>· {i}</li>)}
              </ul>

              <dl className="mt-[0.5vw] grid grid-cols-2 gap-x-[1vw] gap-y-[0.3vw] max-md:gap-y-[1.2vw] border-t border-berry/15 pt-[0.8vw] max-md:pt-[3vw] text40 text-[0.9vw] max-md:text-[3.2vw]">
                <dt className="text-berry">{t("time")}</dt><dd>{t("minutes", { n: product.quick.time })}</dd>
                <dt className="text-berry">{t("bun")}</dt><dd>{product.quick.bun[locale]}</dd>
                <dt className="text-berry">{t("patty")}</dt><dd>{product.quick.patty[locale]}</dd>
                <dt className="text-berry">{t("spice")}</dt><dd>{t(`spiceLevel.${product.quick.spice}`)}</dd>
              </dl>

              <button
                type="button"
                data-cursor-hide
                data-testid="modal-add"
                onClick={() => add(product.slug)}
                className="group mt-[0.5vw] grid place-items-center rounded-full bg-berry px-[1.6vw] py-[0.8vw] max-md:px-[5vw] max-md:py-[3vw] text40 text-[1.1vw] max-md:text-[3.8vw] text-cream transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-ink"
              >
                <RollText>{tc("addToCart")}</RollText>
              </button>
            </div>
          </KraftCard>
        )}
      </div>
    </div>
  );
}
