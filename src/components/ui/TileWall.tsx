import clsx from "clsx";

type Props = {
  /** Karo kenarı (px). Mobilde otomatik küçülür. */
  size?: number;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Açık mavi karo duvar (R13 Zone zemini). Derz çizgileri CSS gradient —
 * görsel dosyası yok, her ölçüde net.
 */
export function TileWall({ size = 64, children, className }: Props) {
  return (
    <div
      className={clsx("relative bg-tile", className)}
      style={
        {
          "--tile-size": `${size}px`,
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--color-cream) 55%, transparent) 0 2px, transparent 2px), " +
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-cream) 55%, transparent) 0 2px, transparent 2px)",
          backgroundSize: "var(--tile-size) var(--tile-size)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
