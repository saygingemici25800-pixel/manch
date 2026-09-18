import clsx from "clsx";

import { SplitReveal } from "@/components/motion/SplitReveal";

type Props = {
  eyebrow: string;
  title: string;
  /** Sağdaki sayaç, ör. "6 ÜRÜN". */
  counter?: string;
  className?: string;
};

/** R10 — küçük Modak üst başlık + büyük berry başlık + sağda sayaç. */
export function SectionHeader({ eyebrow, title, counter, className }: Props) {
  return (
    <header className={clsx("mb-[2vw] max-md:mb-[6vw]", className)}>
      <p className="font-display text-[1vw] uppercase tracking-[0.2em] text-berry max-md:text-[3.4vw]">
        {eyebrow}
      </p>
      <div className="flex items-end justify-between gap-[2vw]">
        <SplitReveal as="h2" type="lines" className="text40 text-[3.2vw] text-berry max-md:text-[8vw]">
          {title}
        </SplitReveal>
        {counter ? (
          <span className="shrink-0 font-ui text-[1vw] uppercase tracking-[0.15em] text-berry-dk max-md:text-[3.2vw]">
            {counter}
          </span>
        ) : null}
      </div>
    </header>
  );
}
