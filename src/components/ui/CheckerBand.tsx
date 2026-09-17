import clsx from "clsx";

type Props = {
  /** Satır sayısı (R11 kartında 2). */
  rows?: number;
  /** Satır başına kare sayısı (R11 kartında 12). */
  cols?: number;
  className?: string;
};

/**
 * Bordo-beyaz dama bandı (R11 / section ayırıcı).
 * Kareler CSS grid; hover jelly animasyonu Faz 5'te ProductCard tarafından verilir.
 */
export function CheckerBand({ rows = 2, cols = 12, className }: Props) {
  return (
    <div
      aria-hidden="true"
      className={clsx("grid w-full overflow-hidden bg-cream", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        return (
          <span
            key={i}
            className={(r + c) % 2 === 0 ? "bg-berry" : "bg-cream"}
          />
        );
      })}
    </div>
  );
}
