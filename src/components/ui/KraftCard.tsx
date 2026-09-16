import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** derece; varsayılan hafif sola eğik */
  tilt?: number;
  className?: string;
}

/** Kraft kağıt menü kartı: paper zemin, grain, hafif eğik, yumuşak gölge. */
export default function KraftCard({ children, tilt = -1.5, className }: Props) {
  return (
    <div
      className={clsx(
        "grain bg-paper text-berry-dk rounded-[0.6vw] max-md:rounded-[2vw]",
        "p-[2vw] max-md:p-[6vw] shadow-[0_1.2vw_2.4vw_-0.8vw_rgba(78,16,48,.45)]",
        className,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </div>
  );
}
