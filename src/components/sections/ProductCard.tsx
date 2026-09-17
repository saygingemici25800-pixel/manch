"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import Placeholder from "@/components/ui/Placeholder";
import type { Product } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import { useCartStore } from "@/lib/cart-store";

/** R11 — beyaz kart, ortada 2×12 dama bandı (hover'da jelly esner + kayar + renk değişir), burger döner, quick details, hardal +. */
interface Props {
  product: Product;
  /** verilirse görsel + isim tıklanabilir → detay modalı */
  onSelect?: (slug: string) => void;
}

export default function ProductCard({ product, onSelect }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("Product");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const add = useCartStore((s) => s.add);
  const name = product.name[locale];

  return (
    <article
      data-testid="product-card"
      className="product-card group relative flex flex-col overflow-hidden rounded-[2vw] max-md:rounded-[6vw] bg-white text-berry-dk shadow-[0_1vw_2.5vw_-1vw_rgba(78,16,48,.35)]"
    >
      {/* görsel */}
      <div
        className={clsx("relative flex h-[19vw] max-md:h-[60vw] items-center justify-center overflow-hidden bg-cream", onSelect && "cursor-pointer")}
        onClick={onSelect ? () => onSelect(product.slug) : undefined}
      >
        <div className="h-[80%] w-[70%] transition-transform duration-500 ease-[var(--ease-jelly)] group-hover:rotate-6 group-hover:scale-105">
          <Placeholder tone={product.image ? "berry" : "sky"} label={name} ratio="1/1" className="h-full w-full" />
        </div>
        {product.tags.length > 0 && (
          <ul className="absolute left-[1vw] top-[1vw] max-md:left-[3vw] max-md:top-[3vw] flex gap-[0.4vw] max-md:gap-[1.5vw]">
            {product.tags.map((tag) => (
              <li key={tag} className={clsx("rounded-full px-[0.7vw] py-[0.2vw] max-md:px-[2.5vw] max-md:py-[0.8vw] font-pixel text-[0.6vw] max-md:text-[2.4vw] uppercase", tag === "spicy" ? "bg-berry text-cream" : tag === "new" ? "bg-mustard text-ink" : "bg-pink text-berry-dk")}>
                {t(`tags.${tag}`)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2×12 dama bandı — hover: jelly esne + kay + renk */}
      <div
        aria-hidden="true"
        className="band h-[calc(var(--s)*2)] w-full [--s:calc(100%/12)] [--a:var(--color-berry)] [--b:white] transition-[transform,background-position] duration-[440ms] ease-[var(--ease-jelly)] group-hover:[--a:var(--color-pink)] group-hover:scale-y-[1.35] group-hover:[background-position:var(--s)_0]"
        style={{
          backgroundImage: "repeating-conic-gradient(var(--a) 0 25%, var(--b) 0 50%)",
          backgroundSize: "calc(var(--s) * 2) calc(var(--s) * 2)",
          // --s yüzde olduğu için yükseklik: kart genişliğinin 2/12'si
          height: "calc(100% / 12 * 0)",
          aspectRatio: "12 / 2",
        }}
      />

      {/* alt */}
      <div className="flex flex-1 flex-col gap-[0.8vw] max-md:gap-[3vw] p-[1.4vw] max-md:p-[5vw]">
        <div className="flex items-start justify-between gap-[1vw]">
          <div className="flex flex-col">
            <h3 className="font-display text-[1.8vw] max-md:text-[6.5vw] leading-none text-berry">
              {onSelect ? (
                <button type="button" data-testid="open-product" onClick={() => onSelect(product.slug)} className="text-left hover:underline underline-offset-4 decoration-[0.08em]">
                  {name}
                </button>
              ) : (
                name
              )}
            </h3>
            <p className="mt-[0.3vw] font-pixel text-[0.7vw] max-md:text-[2.8vw] uppercase tracking-wide opacity-70">
              {product.price !== null ? `${product.price} ₺` : t("priceTodo")}
            </p>
          </div>
          <button
            type="button"
            data-cursor-hide
            data-testid="add-to-cart"
            aria-label={`${tc("addToCart")}: ${name}`}
            onClick={() => add(product.slug)}
            className="grid h-[2.8vw] w-[2.8vw] max-md:h-[11vw] max-md:w-[11vw] shrink-0 place-items-center rounded-full bg-mustard font-display text-[1.8vw] max-md:text-[7vw] leading-none text-ink transition-transform duration-300 hover:scale-110 active:scale-95"
          >
            +
          </button>
        </div>
        <p className="text40 text-[1.05vw] max-md:text-[3.8vw] normal-case tracking-normal opacity-80">{product.desc[locale]}</p>

        <div className="mt-auto">
          <button
            type="button"
            data-testid="quick-toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between border-t border-berry/15 pt-[0.7vw] max-md:pt-[2.5vw] text40 text-[0.95vw] max-md:text-[3.4vw]"
          >
            <span>{tc("quickDetails")}</span>
            <span aria-hidden="true" className={clsx("transition-transform duration-300", open && "rotate-45")}>+</span>
          </button>
          <dl className={clsx("grid grid-cols-2 gap-x-[1vw] gap-y-[0.3vw] max-md:gap-y-[1.2vw] overflow-hidden text40 text-[0.85vw] max-md:text-[3vw] transition-[max-height,opacity,margin] duration-400", open ? "mt-[0.7vw] max-md:mt-[2.5vw] max-h-[12vw] max-md:max-h-[40vw] opacity-100" : "max-h-0 opacity-0")}>
            <dt className="opacity-60">{t("time")}</dt><dd>{t("minutes", { n: product.quick.time })}</dd>
            <dt className="opacity-60">{t("bun")}</dt><dd>{product.quick.bun[locale]}</dd>
            <dt className="opacity-60">{t("patty")}</dt><dd>{product.quick.patty[locale]}</dd>
            <dt className="opacity-60">{t("spice")}</dt><dd>{t(`spiceLevel.${product.quick.spice}`)}</dd>
          </dl>
        </div>
      </div>
    </article>
  );
}
