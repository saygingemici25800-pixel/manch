"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import ProductGrid from "@/components/sections/ProductGrid";
import type { Category, Product, Tag } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useUiStore } from "@/lib/ui-store";
import ProductModal from "./ProductModal";

const TAGS: Tag[] = ["spicy", "new", "signature"];

interface Props {
  categories: Category[];
  products: Product[];
}

/** /menu — sticky kategori sekmeleri, tag filtresi, kategori blokları, ?p=slug ile detay modalı. */
export default function MenuClient({ categories, products }: Props) {
  const t = useTranslations("Menu");
  const tp = useTranslations("Product");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navHidden = useUiStore((s) => s.navHidden);
  const [filter, setFilter] = useState<Tag | null>(null);

  // URL tek kaynak (Kural 34)
  const selectedSlug = searchParams.get("p");
  const selected = useMemo(() => products.find((p) => p.slug === selectedSlug) ?? null, [products, selectedSlug]);

  const open = useCallback(
    (slug: string) => router.replace(`${pathname}?p=${slug}`, { scroll: false }),
    [router, pathname],
  );
  const close = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  const visible = useMemo(() => (filter ? products.filter((p) => p.tags.includes(filter)) : products), [products, filter]);
  // Kural 36: türetilmiş diziler memo — aksi halde her render (scroll → navHidden) ProductGrid'in useGSAP'ını revert edip kartları gizliyordu
  const blocks = useMemo(
    () => categories.map((c) => ({ category: c, items: visible.filter((p) => p.category === c.id) })).filter((b) => b.items.length > 0),
    [categories, visible],
  );

  return (
    <div className="flex flex-col gap-[3vw] max-md:gap-[8vw]">
      {/* sticky sekme + filtre bandı — top: nav görünürse nav yüksekliği, gizliyse 0 */}
      <div
        data-testid="menu-tabs"
        data-nav-hidden={navHidden}
        className={clsx(
          "sticky z-40 -mx-[2.5vw] max-md:-mx-[5vw] flex flex-wrap items-center gap-[0.6vw] max-md:gap-[2vw] bg-cream/90 px-[2.5vw] py-[0.8vw] max-md:px-[5vw] max-md:py-[2.5vw] backdrop-blur-md transition-[top] duration-500",
          navHidden ? "top-0" : "top-[4.6vw] max-md:top-[14vw]",
        )}
      >
        <nav aria-label={t("categories")} className="flex flex-wrap gap-[0.5vw] max-md:gap-[1.5vw]">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              data-cursor-hide
              className="rounded-full border-[0.12vw] max-md:border-[0.4vw] border-berry px-[1.1vw] py-[0.35vw] max-md:px-[3.2vw] max-md:py-[1.2vw] text40 text-[0.95vw] max-md:text-[3.2vw] text-berry transition-[background-color,color] duration-300 hover:bg-berry hover:text-cream"
            >
              {c.name[locale]}
            </a>
          ))}
        </nav>
        <div role="group" aria-label={t("filters")} className="ml-auto flex gap-[0.4vw] max-md:gap-[1.5vw]">
          {TAGS.map((tag) => {
            const active = filter === tag;
            return (
              <button
                key={tag}
                type="button"
                data-testid={`filter-${tag}`}
                aria-pressed={active}
                onClick={() => setFilter(active ? null : tag)}
                className={clsx(
                  "rounded-full px-[1vw] py-[0.35vw] max-md:px-[3vw] max-md:py-[1.2vw] font-pixel text-[0.65vw] max-md:text-[2.4vw] uppercase transition-[background-color,color,transform] duration-300 hover:scale-105",
                  active ? "bg-ink text-cream" : tag === "spicy" ? "bg-berry text-cream" : tag === "new" ? "bg-mustard text-ink" : "bg-pink text-berry-dk",
                )}
              >
                {tp(`tags.${tag}`)}
              </button>
            );
          })}
        </div>
      </div>

      {blocks.length === 0 && <p className="text40 text-[1.4vw] max-md:text-[4.5vw] text-berry-dk">{t("empty")}</p>}

      {blocks.map(({ category, items }) => (
        <section key={category.id} id={`cat-${category.id}`} data-testid="menu-category" className="scroll-mt-[10vw] max-md:scroll-mt-[26vw] flex flex-col gap-[1.5vw] max-md:gap-[5vw]">
          <h2 className="font-display text-[2.6vw] max-md:text-[8vw] leading-none text-berry">{category.name[locale]}</h2>
          <ProductGrid products={items} onSelect={open} />
        </section>
      ))}

      <ProductModal product={selected} onClose={close} />
    </div>
  );
}
