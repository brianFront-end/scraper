"use client";

import { useMemo, useState } from "react";

type Check = { checked_at: string; price: number; currency: string };
type W = "24h" | "7d" | "30d";
const MS: Record<W, number> = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 };

function fmt(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
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

export function DetailWindowCharts({ checks }: { checks: Check[] }) {
  const [w, setW] = useState<W>("7d");
  const [nowTs] = useState(() => Date.now());
  const filtered = useMemo(() => {
    const cutoff = nowTs - MS[w];
    return checks.filter((c) => new Date(c.checked_at).getTime() >= cutoff).slice().reverse();
  }, [checks, w, nowTs]);

  const values = filtered.map((c) => c.price);
  const currency = filtered[0]?.currency ?? checks[0]?.currency ?? "COP";
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  return (
    <>
      <div className="mb-3 flex gap-2">
        {(["24h", "7d", "30d"] as W[]).map((k) => (
          <button key={k} onClick={() => setW(k)} className={`hacker-btn rounded-lg px-3 py-1 text-xs ${w === k ? "bg-cyan-500/20" : ""}`}>
            {k}
          </button>
        ))}
      </div>
      <section className="grid gap-3 md:grid-cols-4">
        <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">Window: {w}</div>
        <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">Promedio: {fmt(avg, currency)}</div>
        <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">Mínimo: {fmt(min, currency)}</div>
        <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">Máximo: {fmt(max, currency)}</div>
      </section>
      <section className="neon-card mt-3 rounded-xl p-4">
        <p className="mb-2 text-xs uppercase text-cyan-300">Tendencia ({w})</p>
        <svg viewBox="0 0 100 34" className="h-24 w-full">
          <path d={sparklinePath(values)} fill="none" stroke="#31f5c8" strokeWidth="1.8" />
        </svg>
      </section>
    </>
  );
}
