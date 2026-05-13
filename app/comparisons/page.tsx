import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";
import { ComparisonManager } from "./comparison-manager";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  canonical_product_id: string;
  canonical_name: string;
  offer_id: string;
  store: string;
  url: string;
  price: number | null;
  currency: string | null;
  checked_at: string | null;
};

function fmt(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ComparisonsPage() {
  const { data: canonicals } = await supabase
    .from("canonical_products")
    .select("id,canonical_name,brand,model")
    .order("created_at", { ascending: false });

  const { data: tracked } = await supabase
    .from("tracked_products")
    .select("id,name,url")
    .order("created_at", { ascending: false });

  const { data, error } = await supabase
    .from("canonical_offer_latest_prices")
    .select("canonical_product_id,canonical_name,offer_id,store,url,price,currency,checked_at")
    .order("canonical_name", { ascending: true });

  const rows = ((data ?? []) as unknown) as Row[];

  const grouped = rows.reduce<Record<string, Row[]>>((acc, row) => {
    const key = `${row.canonical_product_id}::${row.canonical_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen px-4 py-8 md:px-8">
        <ModuleShell
          title="COMPARACIONES // MULTI-STORE"
          description="Comparación del mismo producto entre tiendas, con mejor precio y spread de diferencia."
        >
          <ComparisonManager
            canonicals={(canonicals ?? []) as Array<{ id: string; canonical_name: string; brand: string; model: string }>}
            tracked={(tracked ?? []) as Array<{ id: string; name: string; url: string }>}
          />

          {error ? (
            <p className="terminal-log rounded-xl p-3 text-sm text-rose-300">
              Error leyendo vista de comparación. Ejecutá primero `supabase/canonical-comparison.sql`.
            </p>
          ) : null}

          {Object.keys(grouped).length === 0 ? (
            <p className="terminal-log rounded-xl p-3 text-sm text-emerald-200/80">
              No hay datos para comparar todavía. Cargá productos canónicos y ofertas por tienda.
            </p>
          ) : null}

          <div className="space-y-4">
            {Object.entries(grouped).map(([key, offers]) => {
              const canonicalName = key.split("::")[1];
              const validPrices = offers.filter((o) => typeof o.price === "number") as Array<Row & { price: number }>;
              const best = validPrices.length
                ? validPrices.reduce((a, b) => (a.price <= b.price ? a : b))
                : null;
              const worst = validPrices.length
                ? validPrices.reduce((a, b) => (a.price >= b.price ? a : b))
                : null;
              const spread =
                best && worst && best.price > 0
                  ? (((worst.price - best.price) / best.price) * 100).toFixed(2)
                  : null;

              return (
                <section key={key} className="neon-card rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="neon-text text-lg font-semibold">{canonicalName}</h3>
                    <div className="flex items-center gap-3">
                      {best ? (
                        <p className="text-sm text-emerald-200">
                          Mejor precio: <strong>{best.store}</strong> · {fmt(best.price, best.currency ?? "COP")}
                          {spread ? ` · spread ${spread}%` : ""}
                        </p>
                      ) : (
                        <p className="text-sm text-amber-200">Sin precios disponibles todavía</p>
                      )}
                      <Link
                        href={`/comparisons/${offers[0]?.canonical_product_id}`}
                        className="hacker-btn rounded-lg px-3 py-1 text-xs"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>

                  <div className="terminal-log mt-3 rounded-xl p-2 sm:p-0">
                    <div className="sm:hidden space-y-2">
                      {offers.map((offer) => (
                        <div key={`m-${offer.offer_id}`} className="rounded-lg border border-emerald-500/20 p-2 text-xs">
                          <p className="text-emerald-100">{offer.store}</p>
                          <p className="text-cyan-200">{typeof offer.price === "number" ? fmt(offer.price, offer.currency ?? "COP") : "sin precio"}</p>
                          <p className="text-emerald-200/70">{offer.checked_at ? new Date(offer.checked_at).toLocaleString("es-CO") : "-"}</p>
                        </div>
                      ))}
                    </div>
                    <table className="hidden sm:table w-full min-w-[760px] text-sm">
                      <thead className="bg-emerald-500/10 text-left text-xs uppercase tracking-wide text-emerald-300">
                        <tr>
                          <th className="px-3 py-2">Tienda</th>
                          <th className="px-3 py-2">Precio</th>
                          <th className="px-3 py-2">Último check</th>
                          <th className="px-3 py-2">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offers.map((offer) => (
                          <tr key={offer.offer_id} className="border-t border-emerald-500/15">
                            <td className="px-3 py-2 text-emerald-100">{offer.store}</td>
                            <td className="px-3 py-2 text-cyan-200">
                              {typeof offer.price === "number" ? fmt(offer.price, offer.currency ?? "COP") : "sin precio"}
                            </td>
                            <td className="px-3 py-2 text-emerald-200/80">
                              {offer.checked_at ? new Date(offer.checked_at).toLocaleString("es-CO") : "-"}
                            </td>
                            <td className="px-3 py-2">
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
              );
            })}
          </div>
        </ModuleShell>
      </main>
    </ConsoleShell>
  );
}
