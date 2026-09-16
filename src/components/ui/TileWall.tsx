import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

/** Açık mavi karo duvar (CSS grid + derz). About/Zone zemini. */
export default function TileWall({ children, className }: Props) {
  return (
    <div
      className={clsx(
        "relative bg-tile [--t:4vw] max-md:[--t:12vw]",
        className,
      )}
      style={{
        backgroundImage: [
          // derz çizgileri
          "linear-gradient(rgba(255,255,255,.55) 2px, transparent 2px)",
          "linear-gradient(90deg, rgba(255,255,255,.55) 2px, transparent 2px)",
          // karo üstü hafif parlama
          "linear-gradient(160deg, rgba(255,255,255,.18), transparent 55%)",
        ].join(","),
        backgroundSize:
          "var(--t) var(--t), var(--t) var(--t), var(--t) var(--t)",
      }}
    >
      {children}
    </div>
  );
}
