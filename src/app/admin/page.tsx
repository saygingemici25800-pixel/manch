import { categories, getProductsByCategory } from "@/data/menu";
import { requireAdmin } from "@/lib/admin/auth";
import { getOrderStatus } from "@/lib/order/status";
import { mergePrices } from "@/lib/prices";
import { site } from "@/lib/site";
import { getStore, type StoredOrder } from "@/lib/store";
import { istanbulDay, TIME_ZONE } from "@/lib/hours";

import { logout } from "./actions";
import { AutoRefresh } from "./AutoRefresh";
import { OrderingToggle } from "./OrderingToggle";
import { PriceRow } from "./PriceRow";

/** Her açılışta güncel: sipariş akışı ve durum önbelleğe alınmaz. */
export const dynamic = "force-dynamic";

const saat = new Intl.DateTimeFormat("tr-TR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const gunAy = new Intl.DateTimeFormat("tr-TR", { timeZone: TIME_ZONE, day: "numeric", month: "short" });
const gunAnahtari = istanbulDay;

export default async function AdminPage() {
  await requireAdmin();

  const store = getStore();
  const now = new Date();
  /* Panel ezmeleri DOĞRUDAN okunur (önbelleksiz) — sahip az önce girdiği fiyatı görmeli. */
  const bugun = gunAnahtari(now);
  /* Okuma hataları YUTULMAZ: ezmeler okunamazsa menu.ts fiyatlarını "güncel" diye göstermek
     sahibin yanlış rakamla kaydetmesine yol açardı (inceleme 2026-11-13) → uyarı + formlar kapalı. */
  const [status, manual, overrides, orders, gunluk] = await Promise.all([
    getOrderStatus(now),
    store.getOrderingEnabled().catch(() => true),
    store.getPrices().catch(() => null),
    store.listOrders(60).catch((): StoredOrder[] | null => null),
    store.getDayStats(bugun).catch(() => null),
  ]);
  const okunamadi = overrides === null || orders === null;
  const prices = mergePrices(overrides ?? {});

  const durumMetni = status.open
    ? `Siparişler AÇIK${status.closesAt ? ` · ${status.closesAt}'da otomatik kapanacak` : ""}`
    : status.reason === "manual"
      ? "Siparişler KAPALI · panelden durduruldu"
      : `Siparişler KAPALI · çalışma saati dışında${status.opensAt ? ` · ${status.opensToday ? "bugün" : "yarın"} ${status.opensAt}'da açılacak` : ""}`;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pb-16 pt-6">
      <AutoRefresh seconds={30} />

      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl leading-none text-berry">MANCH Panel</h1>
        <form action={logout}>
          <button type="submit" className="rounded-full border-2 border-berry px-4 py-2 text-sm font-semibold text-berry">
            Çıkış
          </button>
        </form>
      </header>

      {okunamadi && store.kind !== "none" && (
        <p role="alert" className="rounded-xl border-2 border-berry px-4 py-3 text-sm font-semibold text-berry">
          Veritabanı şu an okunamadı — fiyatlar ve sipariş listesi güncel olmayabilir, fiyat kaydı kapatıldı.
          Birkaç saniye sonra sayfayı yenileyin.
        </p>
      )}

      {store.kind === "none" && (
        <p role="alert" className="rounded-xl border-2 border-berry px-4 py-3 text-sm font-semibold text-berry">
          Veritabanı bağlı değil — değişiklikler kaydedilemez. Vercel → Storage → Upstash Redis bağlanmalı.
        </p>
      )}

      {/* ---------------- Sipariş durumu ---------------- */}
      <section aria-labelledby="durum" className="flex flex-col gap-4 rounded-2xl border-2 border-berry bg-white p-5">
        <h2 id="durum" className="text-lg font-bold">Sipariş durumu</h2>
        <p data-testid="admin-status" data-open={status.open} className="text-base font-semibold text-berry">
          {status.open ? "● " : "○ "}
          {durumMetni}
        </p>
        <OrderingToggle enabled={manual} />
        <p className="text-sm">
          Çalışma saati dışında siparişler <strong>kendiliğinden kapalıdır</strong>; sepet görünür, yalnız
          gönderme kapanır. Saatler: {site.hours?.map((h) => `${h.label.tr} ${h.opens}–${h.closes}`).join(" · ")}
        </p>
      </section>

      {/* ---------------- Sipariş akışı ---------------- */}
      <section aria-labelledby="akis" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="akis" className="text-lg font-bold">Sipariş akışı</h2>
          <p data-testid="admin-today" className="text-sm font-semibold">
            {/* Sayaçtan — listeden türetilmez (liste son 60 kayıtta kesiliyor). */}
            Bugün {gunluk ? `${gunluk.count} sipariş · ${gunluk.total} TL` : "—"}
          </p>
        </div>
        <p className="text-sm">
          Siteden gönderilen sepetler. Sipariş WhatsApp&apos;tan yürür — mesajdaki <strong>sipariş no</strong> ile
          eşleştirin. Ödeme ve teslimat teyidi WhatsApp&apos;ta yapılır.
        </p>
        {!orders || orders.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-berry px-4 py-6 text-center text-sm">Henüz sipariş yok.</p>
        ) : (
          <ol data-testid="admin-orders" className="flex flex-col gap-2">
            {orders.map((o) => {
              const at = new Date(o.at);
              return (
                <li key={o.id} data-order-id={o.id} className="rounded-xl border-2 border-berry/30 bg-white px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-sm font-bold">#{o.id}</span>
                    <span className="text-sm">
                      {gunAnahtari(at) === bugun ? saat.format(at) : `${gunAy.format(at)} ${saat.format(at)}`}
                    </span>
                  </div>
                  <ul className="mt-1 text-sm">
                    {o.items.map((i) => (
                      <li key={i.slug}>
                        {i.qty}× {i.name} <span className="text-ink">— {i.unit * i.qty} TL</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-right text-base font-bold text-berry">{o.total} TL</p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ---------------- Fiyatlar ---------------- */}
      <section aria-labelledby="fiyat" className="flex flex-col gap-4">
        <h2 id="fiyat" className="text-lg font-bold">Menü fiyatları</h2>
        <p className="text-sm">
          Kaydet&apos;e basınca sitede hemen güncellenir. <strong>Boş bırakılan</strong> ürün &quot;YAKINDA&quot;
          görünür ve sipariş edilemez.
        </p>
        {categories.map((c) => {
          const items = getProductsByCategory(c.id);
          if (!items.length) return null;
          return (
            <div key={c.id} className="flex flex-col gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-berry">{c.name.tr}</h3>
              {items.map((p) => (
                <PriceRow key={p.slug} slug={p.slug} name={p.name.tr} price={prices[p.slug]} base={p.price} disabled={okunamadi || store.kind === "none"} />
              ))}
            </div>
          );
        })}
      </section>
    </main>
  );
}
