import clsx from "clsx";

interface Props {
  eyebrow: string;
  title: string;
  /** sağdaki sayaç metni, ör. "6 ÜRÜN" */
  counter?: string;
  className?: string;
  tone?: "berry" | "cream";
}

/** R10 — küçük Modak üst başlık + büyük berry başlık + sağda sayaç. */
export default function SectionHeader({ eyebrow, title, counter, className, tone = "berry" }: Props) {
  const main = tone === "berry" ? "text-berry" : "text-cream";
  return (
    <header className={clsx("flex items-end justify-between gap-[2vw] max-md:flex-col max-md:items-start max-md:gap-[2vw]", className)}>
      <div className="flex flex-col gap-[0.3vw] max-md:gap-[1vw]">
        <p className={clsx("font-display text-[1.3vw] max-md:text-[4.5vw] leading-none", tone === "berry" ? "text-berry" : "text-mustard")}>{eyebrow}</p>
        <h2 className={clsx("text40 text-[4.5vw] max-md:text-[11vw] leading-[0.95]", main)}>{title}</h2>
      </div>
      {counter && <p className={clsx("font-pixel text-[0.9vw] max-md:text-[3.2vw] uppercase tracking-widest", main)}>{counter}</p>}
    </header>
  );
}
