/**
 * FAZ B-2 — CTA / rozet sistemi (karar 2026-11-13, kullanıcı; TARTIŞMAYA KAPALI).
 *
 * Kural 79-A'nın doğrudan karşılığı: rol devri tek yönlü bir eşleme değildir.
 * `mustard → cream` devri varış zeminini sormadığı için altı öğe 1.00–1.05
 * kontrastla canlıya çıktı. Bu modül "B nerede duruyor?" sorusunu **imzaya**
 * taşıyor: bir sınıf üretmek için zemini vermek ZORUNLU.
 *
 * SİSTEM
 * ① Dolgu zemine göre terslenir:
 *    koyu zemin (bordo/ink) → krem dolgu + bordo metin
 *    açık zemin (krem/beyaz/mavi) → bordo dolgu + krem metin
 * ② Dolgu = eylem, kontur = etiket.
 *    CTA/düğme → dolu · rozet/etiket → konturlu, metin kontur rengiyle aynı.
 * ③ Hover = dolgu↔kontur takası. Hue DEĞİŞMEZ.
 * ④ Devre dışı = konturlu + %50 opaklık. Etkin = dolu.
 * ⑤ Mavi dolgu açık zeminde KULLANILAMAZ (sky/cream = 1.27 — Kural 40 yasak çifti).
 *    Bu modül mavi dolgu üretmez; üretemediği için de o çift doğamaz.
 *
 * Yeni token yok: yalnız `berry` · `cream` · `ink`.
 *
 * TİP DÜZEYİNDE ZORLAMA (2026-09-20 dersi: tip, çalışma anı bekçisinden üstündür).
 * `action()` ve `label()` **markalı** tip döndürür. İkisi birbirinin yerine
 * geçemez: bir CTA'nın sınıfını `ActionClass` olarak tipleyen her çağrı yerinde
 * oraya `label(...)` yazmak **derlenmez**. Bekçiye yalnız tipin göremediği şey
 * kalır — öğenin fiilen üstünde durduğu gerçek `background-color`.
 */

/** Öğenin fiilen ÜSTÜNDE durduğu yüzey — DOM atası değil, görünen zemin. */
export type Ground = "dark" | "light";

declare const roleBrand: unique symbol;
type Branded<R extends string> = string & { readonly [roleBrand]: R };

/** Dolgu = eylem. Bir CTA/düğme yalnızca bunu alabilir. */
export type ActionClass = Branded<"action">;
/** Kontur = etiket. Bir rozet/çip dinlenme hâli yalnızca bunu alabilir. */
export type LabelClass = Branded<"label">;

/**
 * Her ikisinde de ortak: kenarlık her zaman var, çünkü hover takası onu kullanıyor.
 * Geçiş BURADA tanımlı ve `transform`'u da kapsıyor — çağrı yerleri kendi
 * `transition-*` sınıfını EKLEMEZ. İki `transition-property` yan yana gelirse
 * hangisinin kazandığı CSS sırasına kalır (Kural 37'nin kardeşi).
 *
 * `emph-*` Tailwind utility DEĞİL — bekçi kancası. Sınıf dizgisiyle birlikte
 * taşındığı için çağrı yerlerine ayrıca `data-*` eklemek gerekmiyor ve yeni bir
 * CTA eklendiğinde bekçi onu kendiliğinden görüyor (Kural 74: bayat bekçi doğmaz).
 */
const BASE = "emph border-[0.12vw] max-md:border-[0.4vw] transition-[background-color,color,border-color,transform] duration-300";

/**
 * CTA / düğme.
 * `primary` dolu başlar, hover'da kontura düşer; `secondary` tersi.
 * İkisi de ActionClass — ikincil olmak onu etiket yapmaz.
 */
export function action(ground: Ground, weight: "primary" | "secondary" = "primary"): ActionClass {
  const filled =
    ground === "light"
      ? "border-berry bg-berry text-cream hover:bg-transparent hover:text-berry"
      : "border-cream bg-cream text-berry hover:bg-transparent hover:text-cream";
  const outlined =
    ground === "light"
      ? "border-berry bg-transparent text-berry hover:bg-berry hover:text-cream"
      : "border-cream bg-transparent text-cream hover:bg-cream hover:text-berry";
  return `${BASE} emph-action ${weight === "primary" ? "emph-filled " + filled : "emph-outlined " + outlined}` as ActionClass;
}

/**
 * Rozet / etiket — `SoonBadge`, filtre hapının dinlenme hâli.
 * Konturlu ve metin kontur rengiyle AYNI; eylemle yarışmaz.
 */
export function label(ground: Ground): LabelClass {
  return `${BASE} emph-label emph-outlined ${
    ground === "light" ? "border-berry bg-transparent text-berry" : "border-cream bg-transparent text-cream"
  }` as LabelClass;
}

/**
 * Devre dışı eylem: konturlu + %50 opaklık.
 * Etkin dolu olduğu için ayrım gözle okunur (eskiden 1.03'tü — görünmezdi).
 * Hover tamamen kapanır: devre dışı düğme tepki vermez.
 */
export function disabledAction(ground: Ground): ActionClass {
  /* Hover sınıfı YAZILMAZ. Devre dışı düğmenin tepki vermemesi, `hover:` varyantını
     tabanla aynı değere set ederek değil, **hiç yazmayarak** sağlanır — aynısını yazmak
     `tautoloji-check`'in avladığı ölü sınıfı doğurur (bu modülün kendisi yakalandı). */
  return `${BASE} emph-action emph-outlined emph-disabled opacity-50 ${
    ground === "light" ? "border-berry bg-transparent text-berry" : "border-cream bg-transparent text-cream"
  }` as ActionClass;
}
