"use client";

import { FormEvent, useState } from "react";

type RagResponse = {
  answer: string;
  context: {
    summary: Array<{
      product: string;
      active: boolean;
      email: string;
      latestPrice: string;
      variation: string;
      notifications: number;
    }>;
  };
};

export function ChatConsole() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagResponse | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/chat/rag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "No se pudo consultar RAG");
      setLoading(false);
      return;
    }

    setResult(json as RagResponse);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="terminal-log rounded-xl p-3">
        <p className="mb-2 text-cyan-300">Consulta inteligente sobre tu DB</p>
        <input
          className="w-full rounded-lg border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100"
          placeholder="Ej: xiaomi, olímpica, producto con más cambios"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button className="mt-3 rounded-lg border border-cyan-400/40 px-3 py-1.5 text-xs text-cyan-300">
          {loading ? "Consultando..." : "Ejecutar consulta"}
        </button>
      </form>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {result ? (
        <div className="terminal-log rounded-xl p-3 text-sm text-emerald-100">
          <p className="text-cyan-300">{result.answer}</p>
          <div className="mt-3 space-y-2">
            {result.context.summary.map((item) => (
              <div key={`${item.product}-${item.email}`} className="rounded-lg border border-emerald-400/20 p-2">
                <p className="font-semibold">{item.product}</p>
                <p>Estado: {item.active ? "activo" : "pausado"}</p>
                <p>Último precio: {item.latestPrice}</p>
                <p>Variación: {item.variation}</p>
                <p>Notificaciones: {item.notifications}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
