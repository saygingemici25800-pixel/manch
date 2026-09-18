/**
 * Sipariş tahtasının 15 satırı (spec 6.3).
 *
 * **Kapsam kararı: 15 satır, 25 değil.** Çerçeve içinde 25 satır mobilde kullanılamaz;
 * tahta bir "hızlı sipariş" yüzeyi, menünün kopyası değil. Tam liste `/menu`'de.
 *
 * `chicken-manch` burada YOK: tavuk burger, grup başlığı "SMASH BURGERS".
 */
import type { CategoryId } from "@/data/menu";

export interface OrderGroup {
  /** `Zone.groups.*` anahtarı. */
  key: "burgers" | "sides" | "drinks";
  slugs: readonly string[];
}

export const ORDER_GROUPS: readonly OrderGroup[] = [
  {
    key: "burgers",
    slugs: ["classic-manch", "truffle-manch", "chilli-manch", "fig-jam", "manch-tiftik", "guacamole", "morel"],
  },
  { key: "sides", slugs: ["classic-fries", "truffle-fries", "chicken-tenders", "mushroom-arancini"] },
  { key: "drinks", slugs: ["limonata", "soft-drink", "ayran", "tiramisu"] },
] as const;

export const ORDER_ROW_COUNT = ORDER_GROUPS.reduce((n, g) => n + g.slugs.length, 0);

/** Yalnızca tip kullanımı: kategori kimliği menü verisiyle senkron kalsın. */
export type { CategoryId };
