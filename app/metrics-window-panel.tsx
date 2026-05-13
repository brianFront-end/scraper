"use client";

import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  price_checks?: { checked_at: string; price: number; currency: string }[];
};

type WindowKey = "24h" | "7d" | "30d";

const WINDOW_MS: Record<WindowKey, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function MetricsWindowPanel({ products }: { products: Product[] }) {
  const [windowKey, setWindowKey] = useState<WindowKey>("7d");

  const analytics = useMemo(() => {
    const now = Date.now();
    const cutoff = now - WINDOW_MS[windowKey];

    const filteredByProduct = products.map((p) => {
      const checks = (p.price_checks ?? []).filter((c) => new Date(c.checked_at).getTime() >= cutoff);
      return { ...p, checks };
    });

    const productVolatility = filteredByProduct.map((p) => {
      const values = p.checks.map((c) => c.price);
      if (values.length < 2) return { id: p.id, name: p.name, volatility: 0 };
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
      const std = Math.sqrt(variance);
      const cv = mean > 0 ? (std / mean) * 100 : 0;
      return { id: p.id, name: p.name, volatility: cv };
    });

    const avgVolatility = productVolatility.length
      ? productVolatility.reduce((acc, row) => acc + row.volatility, 0) / productVolatility.length
      : 0;

    const topDrops = filteredByProduct
      .map((p) => {
        const latest = p.checks[0];
        const previous = p.checks[1];
        if (!latest || !previous || previous.price <= 0) return null;
        const dropPct = ((previous.price - latest.price) / previous.price) * 100;
        return { id: p.id, name: p.name, dropPct };
      })
      .filter((row): row is { id: string; name: string; dropPct: number } => !!row && row.dropPct > 0)
      .sort((a, b) => b.dropPct - a.dropPct)
      .slice(0, 5);

    return { avgVolatility, topDrops };
  }, [products, windowKey]);

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <div className="neon-card rounded-xl p-4 md:col-span-2">
        <p className="mb-2 text-xs uppercase text-emerald-300/80">Ventana de análisis</p>
        <div className="flex gap-2">
          {(["24h", "7d", "30d"] as WindowKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setWindowKey(key)}
              className={`hacker-btn rounded-lg px-3 py-1.5 text-xs ${windowKey === key ? "bg-cyan-500/20" : ""}`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="neon-card rounded-xl p-4">
        <p className="text-xs uppercase text-emerald-300/80">Volatilidad promedio</p>
        <p className="neon-text mt-1 text-2xl font-bold">{analytics.avgVolatility.toFixed(2)}%</p>
        <p className="mt-1 text-[11px] text-emerald-200/70">Coeficiente de variación en ventana {windowKey}.</p>
      </div>

      <div className="neon-card rounded-xl p-4">
        <p className="text-xs uppercase text-emerald-300/80">Top bajadas ({windowKey})</p>
        {analytics.topDrops.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-200/70">Aún no hay bajadas detectadas.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {analytics.topDrops.map((drop) => (
              <li key={drop.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-emerald-100">{drop.name}</span>
                <span className="font-semibold text-emerald-400">-{drop.dropPct.toFixed(2)}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
