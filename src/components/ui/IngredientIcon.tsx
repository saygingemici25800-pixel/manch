import clsx from "clsx";

export const INGREDIENTS = ["lettuce", "tomato", "cheddar", "patty", "pickle", "brioche"] as const;
export type Ingredient = (typeof INGREDIENTS)[number];

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
