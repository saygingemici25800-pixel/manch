import clsx from "clsx";

export const INGREDIENTS = ["lettuce", "tomato", "cheddar", "patty", "pickle", "brioche"] as const;
export type Ingredient = (typeof INGREDIENTS)[number];

/**
 * Her malzemenin kendi rengi + koyu/açık zeminde kaybolmaması için hale rengi.
 * Renkler `@theme` tokenlarından okunur (Kural 22) — hex gömülmez.
 *
 * `halo`, rengin ZAYIF kaldığı zeminin karşıtıdır: imleç hem krem/sky hem berry/ink
 * zeminde geziyor ve gerçek malzeme renkleri orta tonlu olduğu için hiçbiri iki
 * uçta birden okunmuyor (ölçüldü). Koyu zeminde silinenler krem hale, açık zeminde
 * silinenler ink hale alır; hale her iki uçta 5.1–14.9:1 kontrast veriyor.
 */
export const INGREDIENT_INK: Record<Ingredient, { color: string; halo: string }> = {
  lettuce: { color: "var(--color-lettuce)", halo: "var(--color-cream)" },
  tomato: { color: "var(--color-tomato)", halo: "var(--color-cream)" },
  cheddar: { color: "var(--color-mustard)", halo: "var(--color-ink)" },
  patty: { color: "var(--color-patty)", halo: "var(--color-cream)" },
  pickle: { color: "var(--color-pickle)", halo: "var(--color-cream)" },
  brioche: { color: "var(--color-brioche)", halo: "var(--color-ink)" },
};

/** `public/icons/*.svg` CSS mask ile — rengi `currentColor`dan alır. */
export function IngredientIcon({ name, className }: { name: Ingredient; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx("inline-block bg-current", className)}
      style={{
        maskImage: `url(/icons/${name}.svg)`,
        WebkitMaskImage: `url(/icons/${name}.svg)`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
