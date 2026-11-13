/**
 * Çalışma saati penceresi — SAF fonksiyon (sunucu + istemci + test aynı kodu kullanır).
 *
 * Saat her zaman **Europe/Istanbul** olarak okunur. Cihazın kendi saat dilimi önemsizdir:
 * `Intl` cihazın UTC saatini İstanbul'a çevirir, yani yurt dışından bakan biri de doğru
 * cevabı alır. (Türkiye 2016'dan beri sabit UTC+3, yaz saati yok — yine de elle +3
 * eklemek yerine `Intl` kullanılır ki kural değişirse kod değişmesin.)
 *
 * `site.hours` biçimi schema.org ile aynı: `closes: "00:00"` gece yarısı demektir ve
 * kapanış açılıştan küçük/eşitse aralık ertesi güne taşar.
 *
 * Bu dosya `@/` takma adı KULLANMAZ — `scripts/hours-check.mjs` onu doğrudan Node ile
 * içe aktarıyor (tip silme, Node 24).
 */

export const TIME_ZONE = "Europe/Istanbul";

export interface HoursSpec {
  dayOfWeek: readonly string[];
  opens: string;
  closes: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export interface HoursWindow {
  /** Şu an çalışma saatinin içinde miyiz? */
  withinHours: boolean;
  /** İçerideysek: bugünkü kapanış ("23:30" / "00:00"). */
  closesAt: string | null;
  /** Dışarıdaysak: sıradaki açılış saati. */
  opensAt: string | null;
  /** Sıradaki açılış bugün mü (false → yarın ya da sonrası). */
  opensToday: boolean;
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** İstanbul'da gün (0 = Pazar) ve gece yarısından beri geçen dakika. */
function istanbulClock(date: Date): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23", // "24:05" değil "00:05" — bazı motorlar hour12:false ile 24 basar
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    day: DAYS.indexOf(get("weekday") as (typeof DAYS)[number]),
    minute: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Bir günün açık aralığı [başlangıç, bitiş) dakika olarak; gece yarısını aşarsa bitiş > 1440. */
function span(day: number, hours: readonly HoursSpec[]) {
  const spec = hours.find((h) => h.dayOfWeek.includes(DAYS[day]));
  if (!spec) return null;
  const o = minutes(spec.opens);
  let c = minutes(spec.closes);
  if (c <= o) c += 1440;
  return { o, c, spec };
}

/**
 * `hours` yoksa (null/boş) saat ENGELLEMEZ — her zaman "içeride" sayılır. Saat verisi
 * gelmeden önceki durumda sipariş saatle kapanmıyordu; veri silinirse aynı davranışa döner,
 * kapatma işi o zaman yalnız paneldeki düğmede kalır.
 */
export function hoursWindow(date: Date, hours: readonly HoursSpec[] | null): HoursWindow {
  if (!hours || hours.length === 0) return { withinHours: true, closesAt: null, opensAt: null, opensToday: false };
  const { day, minute } = istanbulClock(date);

  const today = span(day, hours);
  if (today && minute >= today.o && minute < today.c) {
    return { withinHours: true, closesAt: today.spec.closes, opensAt: null, opensToday: false };
  }
  // Dünün aralığı gece yarısını aştıysa bugünün başına sarkar (ör. 02:00'ye kadar açık).
  const yesterday = span((day + 6) % 7, hours);
  if (yesterday && yesterday.c > 1440 && minute < yesterday.c - 1440) {
    return { withinHours: true, closesAt: yesterday.spec.closes, opensAt: null, opensToday: false };
  }

  if (today && minute < today.o) {
    return { withinHours: false, closesAt: null, opensAt: today.spec.opens, opensToday: true };
  }
  for (let i = 1; i <= 7; i++) {
    const next = span((day + i) % 7, hours);
    if (next) return { withinHours: false, closesAt: null, opensAt: next.spec.opens, opensToday: false };
  }
  return { withinHours: false, closesAt: null, opensAt: null, opensToday: false };
}

/** İstanbul takvim günü "YYYY-MM-DD" — günlük sipariş sayacı ve "bugün" hesabı için. */
export function istanbulDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
