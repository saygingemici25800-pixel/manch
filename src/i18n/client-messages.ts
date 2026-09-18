import { pick } from "@/lib/pick";
import type { Locale } from "@/i18n/routing";

/**
 * Kural 44 — client'a giden mesajlar yalnızca client component'lerin kullandığı namespace'ler.
 * Temel (layout): Nav, Cart, Modal, Transition, Preloader, Common, Product. Sayfa bazlı ekler sayfa
 * layout'unda/sayfasında nested NextIntlClientProvider ile (mesajlar birleştirilerek verilir).
 */
// Layout'ta mount edilen client component'lerin kullandığı namespace'ler —
// denetim: Nav/MenuOverlay→Nav · Cart→Cart,Common · InfoModal→Modal,Common ·
// CookieBanner→Cookie · Preloader→Preloader · PageTransition→Transition ·
// ProductCard/ProductModal→Product,Common (sayfa gridlerinde).
export const BASE_CLIENT_NAMESPACES = [
  "Nav",
  "Cart",
  "Modal",
  "Cookie",
  "Transition",
  "Preloader",
  "Common",
  "Product",
  "Order",
] as const;

type Messages = Record<string, unknown>;

export function clientMessages(all: Messages, extra: readonly string[] = []): Messages {
  return pick(all, [...BASE_CLIENT_NAMESPACES, ...extra]);
}

export type { Locale };
