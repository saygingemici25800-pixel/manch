import clsx from "clsx";
import Float from "@/components/motion/Float";

// SmashAnatomy ile aynı katman dili — statik, büyük, hafif idle (karar 2026-09-17: fotoğraf Faz 7'de next/image)
const LAYERS = [
  { key: "bunTop", w: 92, h: 22, color: "var(--color-paper)", radius: "50% 50% 16% 16% / 85% 85% 22% 22%" },
  { key: "sauce", w: 86, h: 5, color: "var(--color-pink)", radius: "999px" },
  { key: "cheddar", w: 96, h: 6, color: "var(--color-mustard)", radius: "8%" },
  { key: "patty1", w: 88, h: 10, color: "#6B3F2A", radius: "999px" },
  { key: "patty2", w: 88, h: 10, color: "#5A3222", radius: "999px" },
  { key: "pickle", w: 74, h: 5, color: "#7CBF6A", radius: "999px" },
  { key: "lettuce", w: 100, h: 7, color: "#9BD38A", radius: "45%" },
  { key: "bunBottom", w: 92, h: 12, color: "var(--color-paper)", radius: "16% 16% 50% 50% / 22% 22% 85% 85%" },
] as const;

/** Hero görseli yerine CSS katmanlı burger; Float ile idle. */
export default function HeroBurger({ className }: { className?: string }) {
  return (
    <Float duration={4} className={className}>
      <div aria-hidden="true" className="flex w-[34vw] max-md:w-[70vw] flex-col items-center gap-[0.5vw] max-md:gap-[1.2vw] drop-shadow-[0_2vw_3vw_rgba(78,16,48,.5)]">
        {LAYERS.map((l) => (
          <div
            key={l.key}
            className={clsx("shrink-0")}
            style={{ width: `${l.w}%`, height: `${l.h * 0.28}vw`, background: l.color, borderRadius: l.radius }}
          />
        ))}
      </div>
    </Float>
  );
}
