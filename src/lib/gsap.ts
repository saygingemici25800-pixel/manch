// GSAP tek giriş noktası: eklentiler burada bir kez kayıt edilir (Kural 26).
// Kural 46: bu modül HİÇBİR yerde statik import EDİLMEZ — sadece useLazyGsap/useGsapModule
// içinden `import()` ile gelir, böylece ilk yükleme JS'ine girmez.
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

/** globals.css `--ease-jelly` ile aynı eğri. */
export const JELLY_EASE = "jelly";
if (!CustomEase.get(JELLY_EASE)) CustomEase.create(JELLY_EASE, "0.4,1.6,0.7,0.95");

// Dev/QA kancaları — lab-check ve sızıntı testi bunları okur.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const w = window as Window & {
    __ST_COUNT?: () => number;
    __ST_REFRESH?: () => void;
    __ST_KILL__?: () => void;
    __TWEEN_COUNT?: () => number;
    __TICK?: () => number;
  };
  w.__ST_COUNT = () => ScrollTrigger.getAll().length;
  w.__ST_REFRESH = () => ScrollTrigger.refresh();
  w.__ST_KILL__ = () => ScrollTrigger.getAll().forEach((st) => st.kill());
  w.__TWEEN_COUNT = () => gsap.globalTimeline.getChildren(true, true, true).length;
  w.__TICK = () => gsap.ticker.frame;
}

// Yüklendiğini store'a bildir (Faz 4 PageTransition buna bakacak).
if (typeof window !== "undefined") {
  void import("@/lib/motion-store").then((m) => m.useMotionStore.getState().setGsapReady());
}

export { gsap, ScrollTrigger, SplitText, CustomEase };
