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
  (window as Window & { __ST_COUNT?: () => number }).__ST_COUNT = () => ScrollTrigger.getAll().length;
}

export { gsap, ScrollTrigger, SplitText, CustomEase };
