"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, type RefObject } from "react";

import { SoonBadge } from "@/components/ui/SoonBadge";
import { getProduct } from "@/data/menu";
import type { Locale } from "@/i18n/routing";
import { useCartStore } from "@/lib/cart-store";
import { orderChannel, orderTotal, submitOrder } from "@/lib/order/submit";
import { ORDER_GROUPS } from "@/lib/zone/order-rows";

/**
 * Sipariş tahtası (spec 6.3) — 15 satır, adet kontrolleri **mevcut `useCartStore`'a** yazar.
 * Zone'da eklenen ürün sitedeki sepette de görünür; iki ayrı sepet yok.
 *
 * Gönderme **`submitOrder` adaptörünün** arkasında (Kural 66): bu bileşen WhatsApp'ı bilmez,
 * düğmenin metnini bile adaptör söyler (`channel.labelKey`).
 */
export function OrderBoard({ scroller }: { scroller: RefObject<HTMLElement | null> }) {
  const t = useTranslations("Zone");
  const tMenu = useTranslations("Menu");
  const tAll = useTranslations();
  const locale = useLocale() as Locale;
  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const channel = orderChannel();
  const keepScroll = useRef(0);

  const qtyOf = (slug: string) => lines.find((l) => l.slug === slug)?.qty ?? 0;
  const total = orderTotal(lines);

  /**
   * **`scrollTop` korunur.** Adet değişince store güncelleniyor ve pano yeniden render
   * ediliyor; kaydırma kabı korunmazsa liste başa sarıyor, kullanıcı yerini kaybediyor
   * (prototipte bu hata yapılmıştı). Değer tıklamadan ÖNCE alınır, render'dan sonra geri yazılır.
   */
  const change = (slug: string, next: number) => {
    keepScroll.current = scroller.current?.scrollTop ?? 0;
    if (next <= 0) setQty(slug, 0);
    else if (qtyOf(slug) === 0) add(slug, next);
    else setQty(slug, next);
    requestAnimationFrame(() => {
      if (scroller.current) scroller.current.scrollTop = keepScroll.current;
    });
  };

  return (
    <div data-testid="order-board" className="flex flex-col gap-[1.2vw] max-md:gap-[4vw]">
      {/* Menü metinleri taslak — tahtanın üstünde de duyurulur */}
      <p className="font-ui text-[0.8vw] leading-[1.5] text-berry-dk max-md:text-[3vw]">
        {tMenu("disclaimer")}
      </p>

      {ORDER_GROUPS.map((group) => (
        <section key={group.key} className="flex flex-col gap-[0.5vw] max-md:gap-[2vw]">
          <h3 className="font-pixel text-[0.62vw] uppercase tracking-[0.2em] text-berry max-md:text-[2.4vw]">
            {t(`groups.${group.key}`)}
          </h3>
          <ul className="flex flex-col">
            {group.slugs.map((slug) => {
              const p = getProduct(slug);
              if (!p) return null;
              const qty = qtyOf(slug);
              /**
               * **Fiyatı bilinmeyen satır sipariş edilemez** (karar 2026-09-18).
               * Koşul VERİDEN türer (`price == null`) — kodda slug listesi yok. Fiyat
               * `menu.ts`'e girildiği an satır kendiliğinden normale döner, bu dosya
               * değişmez. Rozet Kural 54-A, toplama girmemesi `orderTotal` tarafında.
               */
              const orderable = p.price != null;
              return (
                <li
                  key={slug}
                  data-testid="order-row"
                  data-slug={slug}
                  data-qty={qty}
                  data-orderable={orderable}
                  className="flex items-center justify-between gap-[1vw] border-b border-berry/15 py-[0.5vw] max-md:gap-[3vw] max-md:py-[2vw]"
                >
                  <span className="min-w-0 flex-1 font-ui text-[1vw] text-ink max-md:text-[3.6vw]">
                    {p.name[locale]}
                  </span>
                  <span className="shrink-0 font-ui text-[0.95vw] text-berry max-md:text-[3.4vw]">
                    {orderable ? `${p.price} TL` : <SoonBadge />}
                  </span>
                  <span className="flex shrink-0 items-center gap-[0.4vw] max-md:gap-[2vw]">
                    <button
                      type="button"
                      data-testid="qty-minus"
                      aria-label={`${p.name[locale]} — ${t("less")}`}
                      disabled={qty === 0}
                      onClick={() => change(slug, qty - 1)}
                      // Kural 40: dokunma hedefi ≥ 24 px. 1.6vw (23 px) eşiğin altındaydı ve
                      // işaret dar bir yazı tipinde silik kalıyordu.
                      className="grid h-[2vw] min-h-[26px] w-[2vw] min-w-[26px] place-items-center rounded-full border-2 border-berry font-display text-[1.1vw] leading-none text-berry disabled:cursor-not-allowed disabled:border-berry/30 disabled:text-berry/30 max-md:h-[8vw] max-md:w-[8vw] max-md:text-[4vw]"
                    >
                      −
                    </button>
                    {/* Rakam: `font-ui` — gerekçe TOPLAM'ın üstündeki notta. */}
                    <span
                      data-testid="qty-value"
                      className="w-[1.8vw] min-w-[24px] text-center font-ui text-[1.35vw] leading-none text-ink max-md:w-[7vw] max-md:text-[4.8vw]"
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      data-testid="qty-plus"
                      aria-label={`${p.name[locale]} — ${orderable ? t("more") : t("priceSoon")}`}
                      disabled={!orderable}
                      aria-disabled={!orderable}
                      title={orderable ? undefined : t("priceSoon")}
                      onClick={() => (orderable ? change(slug, qty + 1) : undefined)}
                      className="grid h-[2vw] min-h-[26px] w-[2vw] min-w-[26px] place-items-center rounded-full border-2 border-berry bg-berry font-display text-[1.1vw] leading-none text-cream disabled:cursor-not-allowed disabled:border-berry/30 disabled:bg-berry/30 max-md:h-[8vw] max-md:w-[8vw] max-md:text-[4vw]"
                    >
                      +
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* Alt şerit sticky: uzun listede satırlar ALTINDAN akar, şerit onları kapatmaz */}
      <div className="sticky bottom-0 -mx-[1.4vw] -mb-[1.4vw] flex items-center justify-between gap-[1vw] border-t-[3px] border-ink bg-paper px-[1.4vw] py-[0.8vw] max-md:-mx-[4vw] max-md:-mb-[4vw] max-md:px-[4vw] max-md:py-[3vw]">
        <p className="font-ui text-[0.95vw] text-berry-dk max-md:text-[3.2vw]">
          {t("total")}{" "}
          {/* Rakamlar font-ui (Mouse Memoirs), Modak DEGIL (karar 2026-09-18, kullanici).
              Modak'in sifiri dolu bir elips: counter'i kapali, 40 px'te bile leke gibi okunuyor
              (1-9 sorunsuz, yalniz sifir). Tahta acildiginda 15 satirin adedi ve TOPLAM sifir
              oldugu icin ilk izlenim bir lekeydi. Satis ekraninda okunmayan rakam tipografi
              tercihi degil kusurdur; Modak basliklarda kalir, rakamlarda kalmaz. */}
          <span
            data-testid="order-total"
            aria-live="polite"
            className="font-ui text-[1.5vw] text-ink max-md:text-[5.4vw]"
          >
            {total} TL
          </span>
        </p>
        <button
          type="button"
          data-testid="order-submit"
          disabled={!channel.available || total === 0}
          onClick={() => submitOrder(lines, locale, tAll)}
          className="shrink-0 rounded-full border-2 border-berry-dk bg-mustard px-[1.2vw] py-[0.45vw] font-ui text-[0.9vw] uppercase tracking-[0.1em] text-berry-dk disabled:cursor-not-allowed disabled:opacity-40 max-md:px-[4vw] max-md:py-[1.6vw] max-md:text-[3.2vw]"
        >
          {tAll(channel.labelKey)}
        </button>
      </div>
    </div>
  );
}
