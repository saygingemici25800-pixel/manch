import clsx from "clsx";

export type Ingredient = "lettuce" | "tomato" | "cheddar" | "patty" | "pickle" | "brioche";
export const INGREDIENTS: Ingredient[] = ["lettuce", "tomato", "cheddar", "patty", "pickle", "brioche"];

interface Props {
  name: Ingredient;
  className?: string;
  /** boş bırakılırsa dekoratif (aria-hidden) */
  label?: string;
}

/**
 * public/icons/*.svg (berry tek çizgi, 24×24, currentColor) — CSS mask ile boyanır,
 * böylece <img>'de kaybolan currentColor tekrar ebeveynin rengini alır.
 */
export default function IngredientIcon({ name, className, label }: Props) {
  const mask = `url(/icons/${name}.svg) center / contain no-repeat`;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={clsx("inline-block bg-current", className)}
      style={{ WebkitMask: mask, mask }}
    />
  );
}
