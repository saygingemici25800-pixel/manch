import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  /** Hafif eğiklik (derece). 0 = düz. */
  tilt?: number;
  className?: string;
};

/**
 * Kraft kağıt menü kartı (ürün detay modalı, iletişim kartı).
 * Hafif eğik + yumuşak gölge + lif dokusu.
 */
export function KraftCard({ children, tilt = -1.2, className }: Props) {
  return (
    <div
      className={clsx(
        "relative bg-paper text-berry-dk shadow-[0_1.2vw_2.4vw_rgba(78,16,48,0.18)]",
        className,
      )}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      {/* kağıt lifi */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--color-berry-dk) 0 1px, transparent 1px 4px)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
