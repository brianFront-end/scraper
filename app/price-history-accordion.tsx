"use client";

import { useState } from "react";

type Check = {
  checked_at: string;
  price: number;
  currency: string;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PriceHistoryAccordion({ productId, checks }: { productId: string; checks: Check[] }) {
  const [open, setOpen] = useState(false);

  const visibleChecks = open ? checks : checks.slice(0, 1);

  return (
    <div className="terminal-log mt-4 overflow-x-auto rounded-xl">
      <button
        className="flex w-full items-center justify-between border-b border-emerald-500/15 px-3 py-2 text-left text-xs uppercase tracking-wide text-emerald-300"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Histórico de precio ({checks.length})</span>
        <span>{open ? "▴" : "▾"}</span>
      </button>

      <div className="sm:hidden p-2 space-y-2">
        {visibleChecks.map((check, index) => {
          const next = visibleChecks[index + 1];
          const diff = next ? check.price - next.price : null;
          return (
            <div key={`${productId}-m-${check.checked_at}`} className="rounded-lg border border-emerald-500/20 p-2 text-xs">
              <p className="text-emerald-100">{new Date(check.checked_at).toLocaleString("es-CO")}</p>
              <p className="text-cyan-200">{formatMoney(check.price, check.currency)}</p>
              <p className={`${diff == null ? "text-emerald-200/60" : diff < 0 ? "text-emerald-500" : diff > 0 ? "text-rose-500" : "text-emerald-200/60"}`}>
                {diff == null ? "-" : diff === 0 ? "Sin cambio" : `${diff < 0 ? "↓" : "↑"} ${formatMoney(Math.abs(diff), check.currency)}`}
              </p>
            </div>
          );
        })}
      </div>

      <table className="hidden sm:table w-full min-w-[520px] text-sm">
        <thead className="bg-emerald-500/10 text-left text-xs uppercase tracking-wide text-emerald-300">
          <tr>
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Precio</th>
            <th className="px-3 py-2">Variación</th>
          </tr>
        </thead>
        <tbody>
          {visibleChecks.map((check, index) => {
            const next = visibleChecks[index + 1];
            const diff = next ? check.price - next.price : null;

            return (
              <tr key={`${productId}-${check.checked_at}`} className="border-t border-emerald-500/15">
                <td className="px-3 py-2 text-emerald-100">{new Date(check.checked_at).toLocaleString("es-CO")}</td>
                <td className="px-3 py-2 font-medium text-cyan-200">{formatMoney(check.price, check.currency)}</td>
                <td
                  className={`px-3 py-2 ${
                    diff == null
                      ? "text-emerald-200/60"
                      : diff < 0
                        ? "text-emerald-500"
                        : diff > 0
                          ? "text-rose-500"
                          : "text-emerald-200/60"
                  }`}
                >
                  {diff == null
                    ? "-"
                    : diff === 0
                      ? "Sin cambio"
                      : `${diff < 0 ? "↓" : "↑"} ${formatMoney(Math.abs(diff), check.currency)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
