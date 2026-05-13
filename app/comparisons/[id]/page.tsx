import Link from "next/link";
import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";
import { supabase } from "@/lib/supabase";

type OfferRow = {
  offer_id: string;
  store: string;
  url: string;
  price: number | null;
  currency: string | null;
  checked_at: string | null;
  tracked_product_id: string | null;
  canonical_name: string;
};

function fmt(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function sparklinePath(values: number[]) {
  if (values.length < 2) return "M0 32 L100 32";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 32 - ((value - min) / range) * 28;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export default async function ComparisonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data } = await supabase
    .from("canonical_offer_latest_prices")
    .select("canonical_product_id,canonical_name,offer_id,store,url,price,currency,checked_at")
    .eq("canonical_product_id", id)
    .order("price", { ascending: true });

  const offers = ((data ?? []) as unknown) as OfferRow[];
  const canonicalName = offers[0]?.canonical_name ?? "Comparación";

  const { data: offerLinks } = await supabase
    .from("product_offers")
    .select("id,tracked_product_id,store")
    .eq("canonical_product_id", id);

  const trackedIds = (offerLinks ?? []).map((o) => o.tracked_product_id).filter(Boolean) as string[];
  const { data: checks } = trackedIds.length
    ? await supabase
        .from("price_checks")
        .select("tracked_product_id,price,currency,checked_at")
        .in("tracked_product_id", trackedIds)
        .order("checked_at", { ascending: false })
        .limit(120)
    : { data: [] as Array<{ tracked_product_id: string; price: number; currency: string; checked_at: string }> };

  const validOffers = offers.filter((o) => typeof o.price === "number") as Array<OfferRow & { price: number }>;
  const best = validOffers.length ? validOffers.reduce((a, b) => (a.price <= b.price ? a : b)) : null;
  const worst = validOffers.length ? validOffers.reduce((a, b) => (a.price >= b.price ? a : b)) : null;
  const spread = best && worst && best.price > 0 ? (((worst.price - best.price) / best.price) * 100).toFixed(2) : null;
  const minPrice = validOffers.length ? Math.min(...validOffers.map((v) => v.price)) : 0;
  const maxPrice = validOffers.length ? Math.max(...validOffers.map((v) => v.price)) : 0;
  const priceRange = maxPrice - minPrice || 1;
  const versusPair = validOffers.slice(0, 2);

  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen space-y-4 px-4 py-8 md:px-8">
        <Link href="/comparisons" className="text-xs text-cyan-300 underline">
          ← Volver a comparaciones
        </Link>

        <ModuleShell
          title={`DETALLE VS // ${canonicalName}`}
          description="Vista avanzada del versus entre tiendas para el mismo producto canónico."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">
              Mejor: {best ? `${best.store} · ${fmt(best.price, best.currency ?? "COP")}` : "n/a"}
            </div>
            <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">
              Peor: {worst ? `${worst.store} · ${fmt(worst.price, worst.currency ?? "COP")}` : "n/a"}
            </div>
            <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">Spread: {spread ? `${spread}%` : "n/a"}</div>
          </div>
        </ModuleShell>

        <section className="neon-card rounded-xl p-4">
          <p className="mb-2 text-xs uppercase text-cyan-300">Versus actual por tienda (barras tipo trading normalizadas)</p>

          {versusPair.length === 2 ? (
            <div className="terminal-log mb-5 rounded-xl p-3">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-cyan-300">Duelo directo</p>
              <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
                {[versusPair[0], versusPair[1]].map((offer, idx) => {
                  const normalizedHeight = 40 + ((offer.price - minPrice) / priceRange) * 120;
                  const isBest = best?.offer_id === offer.offer_id;
                  return (
                    <div key={offer.offer_id} className={`flex flex-col items-center ${idx === 1 ? "md:order-3" : "md:order-1"}`}>
                      <div
                        className={`w-24 rounded-t ${isBest ? "bg-emerald-400/90" : "bg-cyan-400/80"}`}
                        style={{ height: `${normalizedHeight}px` }}
                        title={`${offer.store} · ${fmt(offer.price, offer.currency ?? "COP")}`}
                      />
                      <p className="mt-2 text-xs text-emerald-200">{offer.store}</p>
                      <p className="text-xs text-cyan-200">{fmt(offer.price, offer.currency ?? "COP")}</p>
                    </div>
                  );
                })}

                <div className="md:order-2 flex items-center justify-center">
                  <span className="neon-text text-2xl font-extrabold tracking-widest text-emerald-300">VS</span>
                </div>
              </div>
            </div>
          ) : null}

          <p className="mb-2 text-[11px] uppercase tracking-wide text-cyan-300">Comparación global tiendas</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {validOffers.map((offer) => {
              const normalized = (offer.price - minPrice) / priceRange;
              const height = Math.max(28, normalized * 160 + 12);
              const isBest = best?.offer_id === offer.offer_id;
              return (
                <div key={offer.offer_id} className="terminal-log min-w-0 overflow-hidden rounded-lg p-2">
                  <div className="flex h-36 items-end justify-center">
                  <div
                    title={`${offer.store} · ${fmt(offer.price, offer.currency ?? "COP")}`}
                    className={`w-16 rounded-t ${isBest ? "bg-emerald-400/90" : "bg-cyan-400/70"}`}
                    style={{ height }}
                  />
                  </div>
                  <p className="truncate text-[11px] text-emerald-200" title={offer.store}>{offer.store}</p>
                  <p className="truncate text-[11px] text-cyan-200" title={fmt(offer.price, offer.currency ?? "COP")}>{fmt(offer.price, offer.currency ?? "COP")}</p>
                  <p className="text-[10px] text-emerald-200/70">{((offer.price - minPrice) / (minPrice || 1) * 100).toFixed(2)}% vs min</p>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-emerald-200/70">Escala normalizada para comparar visualmente diferencias entre tiendas aunque los valores sean cercanos.</p>
        </section>

        <section className="neon-card rounded-xl p-4">
          <p className="mb-2 text-xs uppercase text-cyan-300">Tendencia por tienda (linea)</p>
          <div className="grid gap-3 md:grid-cols-2">
            {(offerLinks ?? []).map((offer) => {
              const history = (checks ?? [])
                .filter((c) => c.tracked_product_id === offer.tracked_product_id)
                .slice(0, 20)
                .reverse();
              const values = history.map((h) => h.price);
              return (
                <div key={offer.id} className="terminal-log rounded-lg p-2">
                  <p className="mb-1 text-xs text-emerald-200">{offer.store}</p>
                  <svg viewBox="0 0 100 34" className="h-20 w-full">
                    <path d={sparklinePath(values)} fill="none" stroke="#31f5c8" strokeWidth="1.8" />
                  </svg>
                </div>
              );
            })}
          </div>
        </section>

        <section className="terminal-log rounded-xl p-3">
          <div className="sm:hidden space-y-2">
            {offers.map((offer) => (
              <div key={`m-${offer.offer_id}`} className="rounded-lg border border-emerald-500/20 p-2 text-xs">
                <p className="text-emerald-100">{offer.store}</p>
                <p className="text-cyan-200">
                  {typeof offer.price === "number" ? fmt(offer.price, offer.currency ?? "COP") : "sin precio"}
                </p>
                <p className="text-emerald-200/70">
                  {offer.checked_at ? new Date(offer.checked_at).toLocaleString("es-CO") : "-"}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-emerald-300">
              <tr>
                <th className="px-2 py-2">Tienda</th>
                <th className="px-2 py-2">Precio</th>
                <th className="px-2 py-2">Último check</th>
                <th className="px-2 py-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.offer_id} className="border-t border-emerald-500/20">
                  <td className="px-2 py-2 text-emerald-100">{offer.store}</td>
                  <td className="px-2 py-2 text-cyan-200">
                    {typeof offer.price === "number" ? fmt(offer.price, offer.currency ?? "COP") : "sin precio"}
                  </td>
                  <td className="px-2 py-2 text-emerald-200/70">
                    {offer.checked_at ? new Date(offer.checked_at).toLocaleString("es-CO") : "-"}
                  </td>
                  <td className="px-2 py-2">
                    <a href={offer.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">
                      abrir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      </main>
    </ConsoleShell>
  );
}
