import { readFile } from "node:fs/promises";
import { join } from "node:path";

import clsx from "clsx";

/**
 * Çıplak line-art sticker (ana sayfa, 3 adet).
 *
 * Mevcut `public/icons/*.svg` setinin büyütülmüş, döndürülmüş, renklendirilmiş hâli:
 * **yeni görsel dosyası yok, yeni token yok.** Arka plan / kontur / gölge / hale YOK —
 * bu yüzden okunurluk tamamen zemin eşleşmesine bağlı ve eşleşme **tip düzeyinde**
 * zorunlu kılınıyor (aşağıdaki ayrık birleşim): açık zeminde ancak koyu malzemeler,
 * koyu zeminde ancak açık malzemeler yazılabilir; yanlış çift **derlenmez**.
 * Çalışma zamanı bekçisi ayrıca `lab-check`'te (bölümün gerçek zeminini okur — bir
 * bölümün rengi sonradan değişirse tip sistemi bunu göremez, o kontrol görür).
 *
 * Sunucu bileşeni: SVG dosyadan okunup satır içine gömülür → **istemci paketine sıfır
 * bayt**, tek doğruluk kaynağı hâlâ `public/icons/`. `stroke-width` CSS ile 1.7'ye
 * çekilir (öznitelik 1.5; büyük ölçekte çizgi cılız kalmasın).
 */
type Ortak = {
  /** Konum sınıfları — kenardan taşsın ki kesik görünsün (örn. `-top-[3vw] -right-[2vw]`). */
  place: string;
  className?: string;
};
type Props = Ortak &
  (
    | { tone: "light"; name: "tomato" | "lettuce" | "pickle" | "patty" }
    | { tone: "dark"; name: "cheddar" | "brioche" }
  );

const RENK = {
  tomato: "text-tomato",
  lettuce: "text-lettuce",
  pickle: "text-pickle",
  patty: "text-patty",
  cheddar: "text-mustard", // cheddar ayrı token almaz (karar 2026-09-20)
  brioche: "text-brioche",
} as const;

export async function Sticker({ name, place, className }: Props) {
  const svg = await readFile(join(process.cwd(), "public", "icons", `${name}.svg`), "utf8");
  return (
    /* Kırpma katmanı: sticker kenardan taşar ama BELGE taşmaz (Kural 8 — yatay taşma yok).
       `-z-10` + bölümdeki `isolate`: üst öğenin zemininin ÜSTÜNE, içeriğin ALTINA boyanır;
       böylece hiçbir bölümün içeriğine `relative z-*` eklemek gerekmiyor. */
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span
        data-sticker={name}
        className={clsx(
          "absolute block aspect-square w-[9vw] max-md:w-[24vw]",
          "[&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:[stroke-width:1.7]",
          RENK[name],
          place,
          className,
        )}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

export default Sticker;
