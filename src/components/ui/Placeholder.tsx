import clsx from "clsx";

type Props = {
  /** Kutu içinde görünen kısa etiket (görsel adı / TODO notu). */
  label?: string;
  /** Zemin tonu. */
  tone?: "berry" | "sky" | "pink" | "paper";
  className?: string;
};

const TONES = {
  berry: "bg-berry text-cream",
  sky: "bg-sky text-berry-dk",
  pink: "bg-pink text-berry-dk",
  paper: "bg-paper text-berry-dk",
} as const;

/**
 * Kural 7: görsel yoksa kırık görsel yok — renkli blok.
 * Kural 37: `className`'de `absolute` varsa base `relative` eklenmez.
 */
export function Placeholder({ label, tone = "berry", className }: Props) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        !className?.includes("absolute") && "relative",
        "flex items-center justify-center overflow-hidden",
        TONES[tone],
        className,
      )}
    >
      {/* çapraz tarama deseni */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 10px)",
        }}
      />
      {label ? (
        <span className="relative px-[2vw] text-center font-ui text-[1.1vw] uppercase tracking-[0.12em] max-md:text-[3.2vw]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
