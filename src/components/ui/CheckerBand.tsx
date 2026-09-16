import clsx from "clsx";

type Tone = "berry" | "pink" | "ink";

const tones: Record<Tone, string> = {
  berry: "[--a:var(--color-berry)] [--b:white]",
  pink: "[--a:var(--color-pink)] [--b:white]",
  ink: "[--a:var(--color-ink)] [--b:var(--color-cream)]",
};

interface Props {
  tone?: Tone;
  /** kare sayısı (yükseklik) */
  rows?: number;
  className?: string;
}

/** Dama bandı: section ayırıcı / kart bandı. Kare boyu --s (vw), mobilde büyür. */
export default function CheckerBand({ tone = "berry", rows = 2, className }: Props) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "w-full [--s:2vw] max-md:[--s:6vw]",
        tones[tone],
        className,
      )}
      style={{
        height: `calc(var(--s) * ${rows})`,
        backgroundImage:
          "repeating-conic-gradient(var(--a) 0 25%, var(--b) 0 50%)",
        backgroundSize: "calc(var(--s) * 2) calc(var(--s) * 2)",
      }}
    />
  );
}
