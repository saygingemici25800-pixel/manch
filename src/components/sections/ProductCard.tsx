"use client";

import clsx from "clsx";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { CheckerBand } from "@/components/ui/CheckerBand";
import { Placeholder } from "@/components/ui/Placeholder";
import type { Product } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import { useCartStore } from "@/lib/cart-store";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type Props = {
  product: Product;
  /** Kural 47: yalnızca gerçek LCP adayına `priority` (filtresiz ilk kart). */
  priority?: boolean;
  /** Verilirse "quick details" yerine detay modalını açar (/menu). */
  onSelect?: (slug: string) => void;
};

/** R11 — dama bandı, kesit PNG, quick details, hardal "+" sepete ekle. */
export function ProductCard({ product: p, priority, onSelect }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("Common");
  const tp = useTranslations("Product");
  const add = useCartStore((s) => s.add);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  return (
    <article
      data-product-card={p.slug}
      className="group/card relative flex flex-col overflow-hidden rounded-[2vw] bg-white max-md:rounded-[5vw]"
    >
      {/* görsel + dama bandı */}
      <div className="relative h-[20vw] overflow-hidden bg-berry max-md:h-[56vw]">
        <CheckerBand
          className={clsx(
            "absolute inset-x-0 top-1/2 h-[3vw] -translate-y-1/2 max-md:h-[8vw]",
            !reduced &&
              "transition-transform duration-[440ms] ease-jelly group-hover/card:scale-x-110",
          )}
        />
        {p.image ? (
          <Image
            src={p.image}
            alt={p.name[locale]}
            width={600}
            height={600}
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
            quality={70}
            sizes="(min-width: 768px) 30vw, 88vw"
            className={clsx(
              "relative mx-auto h-full w-auto object-contain p-[1.5vw] max-md:p-[5vw]",
              !reduced && "transition-transform duration-500 group-hover/card:rotate-6 group-hover/card:scale-105",
            )}
          />
        ) : (
          <Placeholder tone="sky" label={p.name[locale]} className="absolute inset-0" />
        )}
      </div>

      {/* gövde */}
      <div className="flex flex-1 flex-col gap-[0.5vw] p-[1.2vw] max-md:gap-[2vw] max-md:p-[4vw]">
        <div className="flex items-baseline justify-between gap-[1vw]">
          <h3 className="font-display text-[1.4vw] leading-tight text-berry max-md:text-[5vw]">
            {p.name[locale]}
          </h3>
          <span className="shrink-0 font-ui text-[1.1vw] text-berry-dk max-md:text-[4vw]">
            {p.price == null ? t("priceOnRequest") : `${p.price} TL`}
          </span>
        </div>
        <p className="font-ui text-[0.95vw] leading-snug text-ink max-md:text-[3.4vw]">
          {p.desc[locale]}
        </p>

        <div className="mt-auto flex items-center justify-between gap-[1vw] pt-[0.6vw] max-md:pt-[2vw]">
          <button
            type="button"
            data-cursor-hide
            data-open-detail={onSelect ? p.slug : undefined}
            aria-expanded={onSelect ? undefined : open}
            onClick={() => (onSelect ? onSelect(p.slug) : setOpen((v) => !v))}
            className="font-ui text-[0.9vw] uppercase tracking-[0.1em] text-berry underline underline-offset-4 max-md:text-[3.2vw]"
          >
            {t("quickDetails")}
          </button>
          <button
            type="button"
            data-cursor-hide
            data-add-to-cart={p.slug}
            onClick={() => add(p.slug)}
            aria-label={`${t("addToCart")} — ${p.name[locale]}`}
            className="grid h-[2.4vw] w-[2.4vw] place-items-center rounded-full bg-mustard text-[1.2vw] text-ink transition-transform duration-300 hover:scale-110 max-md:h-[9vw] max-md:w-[9vw] max-md:text-[4.5vw]"
          >
            +
          </button>
        </div>

        {open && !onSelect ? (
          <dl className="grid grid-cols-2 gap-x-[1vw] gap-y-[0.2vw] border-t border-berry/15 pt-[0.6vw] font-ui text-[0.85vw] text-ink max-md:gap-y-[1vw] max-md:pt-[2vw] max-md:text-[3.2vw]">
            <dt className="text-berry">{tp("time")}</dt>
            <dd>{tp("minutes", { n: p.quick.time })}</dd>
            <dt className="text-berry">{tp("bun")}</dt>
            <dd>{p.quick.bun[locale]}</dd>
            <dt className="text-berry">{tp("patty")}</dt>
            <dd>{p.quick.patty[locale]}</dd>
            <dt className="text-berry">{tp("spice")}</dt>
            <dd>{tp(`spiceLevel.${p.quick.spice}`)}</dd>
          </dl>
        ) : null}
      </div>
    </article>
  );
}
