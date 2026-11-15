import { getTranslations } from "next-intl/server";

import { JellyWave } from "@/components/motion/JellyWave";
import { site } from "@/lib/site";

/**
 * Açılış karesi Zone'un içinden (2026-11-15, kullanıcı): geniş açı — arka duvardaki künye
 * yazısı, iki maskot (oyuncu önde, NPC salonun dibinde) ve tabaklı burger tezgâhı.
 * Üreteç `scripts/zone-still.mjs` (komutlar dosyanın başında); maskot çizimleri gelince
 * aynı komutla yeniden üretilir, bu dosya değişmez.
 */
const MOBILE = "/images/hero-zone-m.jpg";
const DESKTOP = "/images/hero-zone.jpg";
/** next/image `deviceSizes` varsayılanından seçilmiş genişlikler. */
const MOBILE_W = [640, 750, 1080] as const;
const DESKTOP_W = [1200, 1920] as const;

/** next/image optimizasyon uç noktası (Kural 47: quality 70 `images.qualities` listesinde). */
const opt = (src: string, w: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=70`;
const srcSet = (src: string, widths: readonly number[]) =>
  widths.map((w) => `${opt(src, w)} ${w}w`).join(", ");

/**
 * R9 — tam ekran fotoğraf + hardal Modak başlık + dönen Misu&Miyu rozeti + alt kenarda jöle dalga.
 *
 * Kural 47: H1 **SplitText'e sokulmaz** (LCP adayı, animasyon LCP'yi geciktirir).
 * İki görsel, tek `<picture>`: mobilde dikey `hero-zone-m`, ≥768 px'de yatay `hero-zone`.
 * İkisi de `priority` — her kırılımda yalnızca biri indirilir (media query ile seçilir),
 * bu yüzden iki formda da LCP bütçede kalır.
 */
export async function Hero() {
  const t = await getTranslations("Home");

  return (
    <section
      data-nav-dark=""
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-berry"
    >
      {/* fotoğraf — <picture> + <source media>: her kırılımda **yalnızca bir** dosya iner.
          İki ayrı <Image> denendi (md:hidden / hidden md:block) ama ikisi de indiriliyordu
          (CSS gizleme isteği durdurmaz) → mobilde 20+15 KB, masaüstünde 16+32 KB israf.
          Optimizasyon yine next/image uç noktasından (AVIF/WebP + quality 70, Kural 47). */}
      <div className="absolute inset-0 -z-10">
        <picture>
          <source media="(min-width: 768px)" sizes="100vw" srcSet={srcSet(DESKTOP, DESKTOP_W)} />
          <img
            src={opt(MOBILE, 750)}
            srcSet={srcSet(MOBILE, MOBILE_W)}
            sizes="100vw"
            alt={t("hero.imageAlt")}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </picture>
        {/* Zone karesi fotoğraftan AÇIK (krem tavan, mavi duvar): düz %45 bordo perde krem
            başlığı ve rozeti okutmuyordu. Ortası (künye + maskotlar + tezgâh) açık kalır,
            metnin durduğu üst ve alt şeritler koyulaşır. */}
        <div className="absolute inset-0 bg-berry/10" />
        <div className="absolute inset-x-0 top-0 h-[34%] bg-linear-to-b from-berry/80 via-berry/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-linear-to-t from-berry/95 via-berry/85 via-60% to-transparent" />
      </div>

      {/* dönen rozet */}
      <div className="absolute right-[3vw] top-[9vw] h-[10vw] w-[10vw] max-md:right-[6vw] max-md:top-[26vw] max-md:h-[26vw] max-md:w-[26vw]">
        <svg viewBox="0 0 100 100" className="h-full w-full animate-[spin_18s_linear_infinite] motion-reduce:animate-none">
          <defs>
            <path id="badge" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" fill="none" />
          </defs>
          <text className="fill-cream font-ui text-[9px] uppercase tracking-[0.18em]">
            <textPath href="#badge">{t("hero.badge").repeat(2)}</textPath>
          </text>
        </svg>
        <span className="absolute inset-[26%] grid place-items-center rounded-full bg-sky text-center font-display text-[1.1vw] leading-none text-berry max-md:text-[3vw]">
          {site.mascots.names.join(" & ")}
        </span>
      </div>

      {/* başlık — Kural 47: statik, animasyonsuz */}
      {/* Mobilde blok yukarı kayar: alttaki çerez şeridinin üstüne binmesin.
          Hero `min-h-[100svh]` + `justify-end` olduğu için bu dolgu sayfa yüksekliğini
          DEĞİŞTİRMEZ — blok kendi içinde yukarı kayar, banner `fixed`, CLS riski yok. */}
      <div className="relative px-[3vw] pb-[7.5vw] max-md:px-[5vw] max-md:pb-[28vw]">
        <h1 className="heading180 max-w-[16ch] text-cream">{t("hero.title")}</h1>
        <p className="mt-[1vw] max-w-[46ch] text40 text-[1.2vw] text-cream max-md:mt-[4vw] max-md:text-[4vw]">
          {t("hero.sub")}
        </p>
      </div>

      <JellyWave fillClass="fill-cream" className="absolute inset-x-0 bottom-0" />
    </section>
  );
}
