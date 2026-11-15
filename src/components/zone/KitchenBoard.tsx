"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { usePrices } from "@/components/PriceProvider";
import { Placeholder } from "@/components/ui/Placeholder";
import { SoonBadge } from "@/components/ui/SoonBadge";
import { getProduct, type Product } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import { useCartStore } from "@/lib/cart-store";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { stationProducts } from "@/lib/zone/kitchen-stations";
import { useZoneStore } from "@/store/zone";
import { action, disabledAction } from "@/styles/emphasis";

/**
 * Açık mutfak panosu — `FrameBoard` ile aynı kabuk (ortada kart, kenarlarda sahne görünür,
 * sticky bordo şerit, z-75), iki görünüm:
 *
 * · **liste** — istasyonun bütün ürünleri (menüden türetilir, 28/28 ürün bir istasyonda)
 * · **ürün** — görsel, açıklama, fiyat, malzemeler, hızlı detaylar, sepete ekle
 *
 * Sepete ekleme **mevcut `useCartStore`'a** yazar (Zone'un sipariş tahtası ve site sepetiyle
 * tek sepet). Fiyat etkin tablodan (`usePrices`, Kural 80) — `p.price` OKUNMAZ; fiyatsız ürün
 * eklenemez (koşul veriden: `price == null`).
 */
export function KitchenBoard() {
  const t = useTranslations("Zone");
  const tp = useTranslations("Product");
  const tc = useTranslations("Common");
  const tm = useTranslations("Menu");
  const locale = useLocale() as Locale;
  const reduced = useReducedMotion();
  const state = useZoneStore((s) => s.state);
  const kitchen = useZoneStore((s) => s.kitchen);
  const closeFrame = useZoneStore((s) => s.closeFrame);
  const setKitchenProduct = useZoneStore((s) => s.setKitchenProduct);
  const prices = usePrices();
  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const card = useRef<HTMLDivElement>(null);
  /**
   * Son eklenen ürün — "✓ Sepete eklendi" yalnız o ürünün BU açılışında yazar. `kitchen`
   * nesnesi her açılışta / her görünüm geçişinde yenilenir; kimliği eşleşmeyen kayıt bayattır
   * (effect'te sıfırlamak yerine türetilmiş değer — Kural 25).
   */
  const [added, setAdded] = useState<{ k: object; slug: string } | null>(null);

  const open = state === "pov" && kitchen !== null;
  const product = kitchen?.product ? getProduct(kitchen.product) ?? null : null;
  const view = product ? "product" : "list";

  /** Görünüm değişince odak kartın başına: ekran okuyucu yeni başlığı okur, kaydırma başa. */
  useEffect(() => {
    if (!open) return;
    const el = card.current;
    if (!el) return;
    el.scrollTop = 0;
    el.focus({ preventScroll: true });
  }, [open, view, kitchen?.product]);

  if (!open || !kitchen) return null;
  const items = stationProducts(kitchen.station);
  const title = product ? product.name[locale] : t(`groups.${kitchen.station}`);

  return (
    <div className="pointer-events-none absolute inset-0 z-75 grid place-items-center p-[2vw] max-md:p-[4vw]">
      <div
        ref={card}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid="kitchen-board"
        data-station={kitchen.station}
        data-view={view}
        data-product={product?.slug ?? ""}
        style={reduced ? undefined : { animation: "zone-board-in .45s cubic-bezier(.4,1.4,.7,.95) both" }}
        className="pointer-events-auto flex w-[min(92vw,880px)] max-h-[min(88vh,940px)] flex-col overflow-y-auto border-[14px] border-ink bg-cream shadow-[0_40px_90px_rgba(27,27,27,0.45)] outline outline-[6px] outline-ink/25"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-[2vw] bg-berry px-[1.4vw] py-[0.9vw] max-md:px-[4vw] max-md:py-[3vw]">
          <div className="min-w-0">
            <p className="font-pixel text-[0.75vw] uppercase tracking-[0.2em] text-cream max-md:text-[2.6vw]">
              {product ? `${t("kitchen.kicker")} · ${t(`groups.${kitchen.station}`)}` : t("kitchen.kicker")}
            </p>
            <h2 className="line-clamp-2 font-display text-[2.4vw] leading-[1.1] text-cream max-md:text-[6.6vw]">{title}</h2>
          </div>
          <button
            type="button"
            data-testid="kitchen-board-back"
            onClick={closeFrame}
            className={`shrink-0 rounded-full px-[1.1vw] py-[0.4vw] font-ui text-[1.1vw] uppercase tracking-[0.12em] max-md:px-[4vw] max-md:py-[1.4vw] max-md:text-[3.6vw] ${action("dark")}`}
          >
            {t("back")}
          </button>
        </div>

        <div className="p-[1.4vw] max-md:p-[4vw]">
          {product ? (
            <ProductView
              product={product}
              price={prices[product.slug] ?? null}
              inCart={lines.find((l) => l.slug === product.slug)?.qty ?? 0}
              added={added?.k === kitchen && added.slug === product.slug}
              onAdd={() => {
                add(product.slug);
                setAdded({ k: kitchen, slug: product.slug });
              }}
              onList={() => setKitchenProduct(null)}
              locale={locale}
              t={t}
              tp={tp}
              tc={tc}
              disclaimer={tm("disclaimer")}
            />
          ) : (
            <div className="flex flex-col gap-[1vw] max-md:gap-[4vw]">
              <p className="font-ui text-[1.25vw] uppercase tracking-[0.08em] text-berry max-md:text-[4vw]">{t("kitchen.listHint")}</p>
              <ul data-testid="kitchen-list" className="grid grid-cols-2 gap-[0.8vw] max-md:grid-cols-1 max-md:gap-[2.5vw]">
                {items.map((p) => {
                  const price = prices[p.slug] ?? null;
                  return (
                    <li key={p.slug}>
                      <button
                        type="button"
                        data-testid="kitchen-item"
                        data-slug={p.slug}
                        onClick={() => setKitchenProduct(p.slug)}
                        className="flex w-full items-center gap-[0.8vw] rounded-[0.9vw] border-2 border-berry bg-white p-[0.5vw] text-left transition-transform duration-300 hover:-translate-y-[2px] max-md:gap-[3vw] max-md:rounded-[3vw] max-md:p-[2vw]"
                      >
                        <Thumb product={p} locale={locale} className="size-[3.6vw] shrink-0 max-md:size-[14vw]" sizes="(max-width: 768px) 14vw, 4vw" />
                        <span className="flex min-w-0 flex-col gap-[0.2vw] max-md:gap-[1vw]">
                          <span className="font-display text-[1.55vw] leading-[1.05] text-ink max-md:text-[5.2vw]">{p.name[locale]}</span>
                          <span className="font-ui text-[1.15vw] uppercase tracking-[0.06em] text-berry max-md:text-[3.8vw]">
                            {price != null ? `${price} TL` : <SoonBadge />}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Thumb({ product, locale, className, sizes }: { product: Product; locale: Locale; className: string; sizes: string }) {
  if (!product.image) return <Placeholder tone="sky" className={`rounded-[0.6vw] max-md:rounded-[2vw] ${className}`} />;
  const cutout = product.image.endsWith(".png");
  return (
    <span className={`relative block overflow-hidden rounded-[0.6vw] max-md:rounded-[2vw] ${cutout ? "bg-berry" : ""} ${className}`}>
      <Image src={product.image} alt={product.name[locale]} fill sizes={sizes} className={cutout ? "object-contain p-[6%]" : "object-cover"} />
    </span>
  );
}

type T = ReturnType<typeof useTranslations>;

function ProductView({
  product,
  price,
  inCart,
  added,
  onAdd,
  onList,
  locale,
  t,
  tp,
  tc,
  disclaimer,
}: {
  product: Product;
  price: number | null;
  inCart: number;
  added: boolean;
  onAdd: () => void;
  onList: () => void;
  locale: Locale;
  t: T;
  tp: T;
  tc: T;
  disclaimer: string;
}) {
  const ingredients = product.ingredients[locale];
  return (
    <div className="flex flex-col gap-[1vw] max-md:gap-[4vw]">
      <button
        type="button"
        data-testid="kitchen-to-list"
        onClick={onList}
        className={`self-start rounded-full px-[1vw] py-[0.3vw] font-ui text-[1.1vw] uppercase tracking-[0.12em] max-md:px-[3.5vw] max-md:py-[1.2vw] max-md:text-[3.6vw] ${action("light", "secondary")}`}
      >
        {t("kitchen.toList")}
      </button>

      <div className="grid grid-cols-[1fr_1.2fr] gap-[1.6vw] max-md:grid-cols-1 max-md:gap-[4vw]">
        <Thumb product={product} locale={locale} className="aspect-square w-full self-start max-md:aspect-[16/10]" sizes="(max-width: 768px) 80vw, 300px" />

        <div className="flex flex-col gap-[0.8vw] max-md:gap-[3vw]">
          <p className="text40 text-[1.45vw] normal-case tracking-normal max-md:text-[4.6vw]">{product.desc[locale]}</p>
          <p data-testid="kitchen-price" className="font-pixel text-[1.05vw] uppercase tracking-wide max-md:text-[3.6vw]">
            {price != null ? `${price} TL` : <SoonBadge />}
          </p>
          <p className="font-ui text-[0.95vw] normal-case text-berry max-md:text-[3.2vw]">{disclaimer}</p>

          {ingredients.length > 0 && (
            <>
              <h3 className="mt-[0.3vw] font-display text-[1.6vw] max-md:text-[5.6vw]">{tp("ingredients")}</h3>
              <ul data-testid="kitchen-ingredients" className="flex flex-col gap-[0.3vw] text40 text-[1.3vw] max-md:gap-[1vw] max-md:text-[4.4vw]">
                {ingredients.map((i) => (
                  <li key={i}>· {i}</li>
                ))}
              </ul>
            </>
          )}

          <dl className="mt-[0.3vw] grid grid-cols-2 gap-x-[1vw] gap-y-[0.3vw] border-t border-berry/15 pt-[0.8vw] text40 text-[1.2vw] max-md:gap-y-[1.2vw] max-md:pt-[3vw] max-md:text-[3.8vw]">
            <dt className="text-berry">{tp("time")}</dt>
            <dd>{tp("minutes", { n: product.quick.time })}</dd>
            {product.category === "burgers" && (
              <>
                <dt className="text-berry">{tp("bun")}</dt>
                <dd>{product.quick.bun[locale]}</dd>
                <dt className="text-berry">{tp("patty")}</dt>
                <dd>{product.quick.patty[locale]}</dd>
              </>
            )}
            <dt className="text-berry">{tp("spice")}</dt>
            <dd>{tp(`spiceLevel.${product.quick.spice}`)}</dd>
          </dl>

          {price != null ? (
            <button
              type="button"
              data-testid="kitchen-add"
              onClick={onAdd}
              className={`mt-[0.3vw] rounded-full px-[1.6vw] py-[0.7vw] font-ui text-[1.3vw] uppercase tracking-[0.1em] max-md:px-[5vw] max-md:py-[3vw] max-md:text-[4.2vw] ${action("light")}`}
            >
              {tc("addToCart")}
            </button>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              data-testid="kitchen-add"
              title={tc("priceSoon")}
              className={`mt-[0.3vw] cursor-not-allowed rounded-full px-[1.6vw] py-[0.7vw] font-ui text-[1.3vw] uppercase tracking-[0.1em] max-md:px-[5vw] max-md:py-[3vw] max-md:text-[4.2vw] ${disabledAction("light")}`}
            >
              {tc("addToCart")}
            </button>
          )}
          <p role="status" data-testid="kitchen-status" className="min-h-[1.2em] font-ui text-[1.1vw] uppercase tracking-[0.08em] text-berry max-md:text-[3.8vw]">
            {added ? t("kitchen.added") : ""}
            {inCart > 0 ? `${added ? " · " : ""}${t("kitchen.inCart", { n: inCart })}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
