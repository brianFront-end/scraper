"use client";

import { useMemo, useState } from "react";
import { ProductActions } from "./product-actions";
import { PriceHistoryAccordion } from "./price-history-accordion";

type Product = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  users: { email: string } | null;
  price_checks?: { checked_at: string; price: number; currency: string }[];
  product_alert_settings?: {
    target_price: number | null;
    target_discount_percent: number | null;
    custom_message: string | null;
  }[];
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

export function DashboardProductsClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paused">("all");
  const [store, setStore] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");

  const stores = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => hostFromUrl(p.url))))],
    [products],
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const bySearch =
        search.trim().length === 0 ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.url.toLowerCase().includes(search.toLowerCase());
      const byStatus = status === "all" || (status === "active" ? p.active : !p.active);
      const byStore = store === "all" || hostFromUrl(p.url) === store;
      return bySearch && byStatus && byStore;
    });
  }, [products, search, status, store]);

  if (products.length === 0) {
    return (
      <p className="neon-card rounded-2xl p-4 text-sm text-emerald-200/80">
        No hay productos cargados todavía. Andá a <strong>/products</strong> para crear el primero.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="neon-card grid gap-2 rounded-xl p-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o URL"
          className="rounded-lg border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | "active" | "paused")}
          className="rounded-lg border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Solo activos</option>
          <option value="paused">Solo pausados</option>
        </select>
        <select
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="rounded-lg border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100"
        >
          {stores.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Todas las tiendas" : s}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("cards")}
            className={`hacker-btn flex-1 rounded-lg px-3 py-2 text-xs ${
              viewMode === "cards" ? "bg-cyan-500/20" : ""
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={`hacker-btn flex-1 rounded-lg px-3 py-2 text-xs ${
              viewMode === "compact" ? "bg-cyan-500/20" : ""
            }`}
          >
            Compacto
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {search ? (
          <button className="hacker-btn rounded-full px-3 py-1" onClick={() => setSearch("")}>
            búsqueda: {search} ✕
          </button>
        ) : null}
        {status !== "all" ? (
          <button className="hacker-btn rounded-full px-3 py-1" onClick={() => setStatus("all")}>
            estado: {status} ✕
          </button>
        ) : null}
        {store !== "all" ? (
          <button className="hacker-btn rounded-full px-3 py-1" onClick={() => setStore("all")}>
            tienda: {store} ✕
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="terminal-log rounded-xl p-4 text-sm text-amber-200">
          No hay resultados con esos filtros. Probá cambiando tienda/estado o limpiando búsqueda.
        </p>
      ) : null}

      <div className="grid gap-3">
        {filtered.map((p) => {
          const latest = p.price_checks?.[0];
          const previous = p.price_checks?.[1];
          const delta = latest && previous ? latest.price - previous.price : null;
          const settings = p.product_alert_settings?.[0] ?? {
            target_price: null,
            target_discount_percent: null,
            custom_message: null,
          };

          if (viewMode === "compact") {
            return (
              <article key={p.id} className="terminal-log rounded-xl p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="neon-text text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-emerald-200/80">{hostFromUrl(p.url)} · {p.active ? "activo" : "pausado"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-cyan-200">{latest ? formatMoney(latest.price, latest.currency) : "-"}</p>
                    <p className="text-[11px] text-emerald-200/70">
                      {latest ? new Date(latest.checked_at).toLocaleString("es-CO") : "sin checks"}
                    </p>
                  </div>
                </div>
              </article>
            );
          }

          return (
            <article key={p.id} className="neon-card rounded-2xl p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="neon-text text-base font-semibold sm:text-lg">{p.name}</h3>
                  <p className="text-sm text-emerald-200/80">{p.users?.email ?? "sin email"}</p>
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 hover:underline">
                    Ver producto
                  </a>
                  <ProductActions
                    productId={p.id}
                    active={p.active}
                    initialSettings={{
                      targetPrice: settings.target_price,
                      targetDiscountPercent: settings.target_discount_percent,
                      customMessage: settings.custom_message,
                    }}
                  />
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs uppercase tracking-wide text-emerald-300/80">Último precio</p>
                  <p className="neon-text text-xl font-bold">{latest ? formatMoney(latest.price, latest.currency) : "-"}</p>
                  <p className={`text-xs font-medium ${delta == null ? "text-emerald-200/60" : delta < 0 ? "text-emerald-500" : delta > 0 ? "text-rose-500" : "text-emerald-200/60"}`}>
                    {delta == null ? "Sin comparación" : delta === 0 ? "Sin cambio" : `${delta < 0 ? "↓" : "↑"} ${formatMoney(Math.abs(delta), latest?.currency ?? "GBP")}`}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-emerald-200/70">
                Último monitoreo: {latest ? new Date(latest.checked_at).toLocaleString("es-CO") : "todavía sin monitoreo"}
              </p>

              <PriceHistoryAccordion productId={p.id} checks={p.price_checks ?? []} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
