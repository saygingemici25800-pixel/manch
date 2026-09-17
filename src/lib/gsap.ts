// GSAP tek giriş noktası: eklentiler burada bir kez kayıt edilir.
// Sadece "use client" component'lerden import edilir (Kural 3).
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

// R11 kart bandı / jelly esnemesi için ortak ease (globals.css --ease-jelly ile aynı eğri)
export const JELLY_EASE = "jelly";
if (!CustomEase.get(JELLY_EASE)) CustomEase.create(JELLY_EASE, "0.4,1.6,0.7,0.95");

// Dev/QA: lab-check ana sayfada ScrollTrigger sayısını okur
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const w = window as Window & { __ST_COUNT?: () => number; __ST_DUMP?: () => unknown[]; __TICK?: () => number; __ST_REFRESH?: () => void };
  w.__ST_REFRESH = () => ScrollTrigger.refresh();
  w.__ST_COUNT = () => ScrollTrigger.getAll().length;
  w.__TICK = () => gsap.ticker.frame;
  w.__ST_DUMP = () =>
    ScrollTrigger.getAll().map((st) => ({
      trigger: (st.trigger as HTMLElement | null)?.className?.toString().slice(0, 30),
      pin: !!st.pin,
      start: Math.round(st.start),
      end: Math.round(st.end),
      active: st.isActive,
      enabled: (st as unknown as { enabled?: boolean }).enabled,
      scroll: Math.round(st.scroll()),
      progress: Number(st.progress.toFixed(3)),
    }));
}

// Lazy yüklendiğinde (Kural 46) — TransitionLink perde kararını buna göre verir
if (typeof window !== "undefined") {
  import("@/lib/motion-store").then((m) => m.useMotionStore.getState().setGsapReady());
}

export { gsap, ScrollTrigger, SplitText, CustomEase };
