import clsx from "clsx";

interface Props {
  tone?: "berry" | "sky";
  /** aria-label; görünen küçük etiket olarak da basılır */
  label: string;
  /** CSS aspect-ratio, ör. "4/3" */
  ratio?: string;
  className?: string;
}

/** Kural 7: görsel yoksa kırık görsel yok — çapraz çizgili renkli blok. */
export default function Placeholder({
  tone = "berry",
  label,
  ratio = "4/3",
  className,
}: Props) {
  const isBerry = tone === "berry";
  return (
    <div
      role="img"
      aria-label={label}
      className={clsx(
        // className "absolute" içeriyorsa relative ekleme (Tailwind CSS'te relative sonra geldiği için override'ı ezer)
        !className?.includes("absolute") && "relative",
        "flex items-end overflow-hidden rounded-[1vw] max-md:rounded-[3vw]",
        isBerry ? "bg-berry text-cream" : "bg-sky text-berry",
        className,
      )}
      style={{
        aspectRatio: ratio,
        backgroundImage:
          "repeating-linear-gradient(-45deg, rgba(255,255,255,.08) 0 1.2vw, transparent 1.2vw 2.4vw)",
      }}
    >
      <span className="font-pixel text-[0.7vw] max-md:text-[2.6vw] uppercase tracking-wider p-[1vw] max-md:p-[3vw] opacity-80">
        {label}
      </span>
    </div>
  );
}
