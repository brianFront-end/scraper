"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Canonical = { id: string; canonical_name: string; brand: string; model: string };
type Tracked = { id: string; name: string; url: string };

export function ComparisonManager({ canonicals, tracked }: { canonicals: Canonical[]; tracked: Tracked[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [selectedCanonical, setSelectedCanonical] = useState(canonicals[0]?.id ?? "");
  const [selectedTracked, setSelectedTracked] = useState(tracked[0]?.id ?? "");
  const [store, setStore] = useState("");
  const [message, setMessage] = useState("");

  function suggestCanonicalFromTracked() {
    const selected = tracked.find((t) => t.id === selectedTracked);
    if (!selected) return;

    const clean = selected.name.replace(/\s+/g, " ").trim();
    const tokens = clean.split(" ");
    const inferredBrand = tokens[0] ?? "";
    const inferredModel = tokens.slice(1, 4).join(" ") || clean;

    setName(clean);
    setBrand(inferredBrand);
    setModel(inferredModel);
    setMessage("Sugerencia aplicada desde producto trackeado");
  }

  async function createCanonical() {
    const res = await fetch("/api/canonical-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canonicalName: name, brand, model }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error?.formErrors?.[0] ?? "No se pudo crear producto canónico");
      return;
    }
    setMessage("Producto canónico creado");
    setName("");
    setBrand("");
    setModel("");
    router.refresh();
  }

  async function linkOffer() {
    const trackedRow = tracked.find((t) => t.id === selectedTracked);
    if (!trackedRow) return;

    const res = await fetch(`/api/canonical-products/${selectedCanonical}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackedProductId: selectedTracked,
        store,
        url: trackedRow.url,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error?.formErrors?.[0] ?? "No se pudo vincular oferta");
      return;
    }
    setMessage("Oferta vinculada al canónico");
    setStore("");
    router.refresh();
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="terminal-log rounded-xl p-3">
        <p className="mb-2 text-xs text-cyan-300">Crear producto canónico (manual)</p>
        <button className="mb-2 hacker-btn rounded-lg px-3 py-1.5 text-xs" onClick={suggestCanonicalFromTracked}>
          ✦ Sugerir con IA (heurística)
        </button>
        <input className="mb-2 w-full rounded-lg border border-emerald-400/30 bg-black/50 px-2 py-1.5" placeholder="Nombre canónico" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="mb-2 w-full rounded-lg border border-emerald-400/30 bg-black/50 px-2 py-1.5" placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input className="mb-2 w-full rounded-lg border border-emerald-400/30 bg-black/50 px-2 py-1.5" placeholder="Modelo" value={model} onChange={(e) => setModel(e.target.value)} />
        <button className="hacker-btn rounded-lg px-3 py-1.5 text-xs" onClick={createCanonical}>
          Crear canónico
        </button>
      </div>

      <div className="terminal-log rounded-xl p-3">
        <p className="mb-2 text-xs text-cyan-300">Vincular oferta de tienda a canónico</p>
        <select className="mb-2 w-full rounded-lg border border-emerald-400/30 bg-black/50 px-2 py-1.5" value={selectedCanonical} onChange={(e) => setSelectedCanonical(e.target.value)}>
          {canonicals.map((c) => (
            <option key={c.id} value={c.id}>{c.canonical_name}</option>
          ))}
        </select>
        <select className="mb-2 w-full rounded-lg border border-emerald-400/30 bg-black/50 px-2 py-1.5" value={selectedTracked} onChange={(e) => setSelectedTracked(e.target.value)}>
          {tracked.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input className="mb-2 w-full rounded-lg border border-emerald-400/30 bg-black/50 px-2 py-1.5" placeholder="Store label (ej: alkosto)" value={store} onChange={(e) => setStore(e.target.value)} />
        <button className="hacker-btn rounded-lg px-3 py-1.5 text-xs" onClick={linkOffer}>
          Vincular oferta
        </button>
      </div>

      {message ? <p className="text-xs text-emerald-200 md:col-span-2">{message}</p> : null}
    </div>
  );
}
