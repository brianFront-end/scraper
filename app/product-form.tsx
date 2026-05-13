"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProductForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/tracked-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, url }),
    });
    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error?.formErrors?.[0] ?? json.error ?? "Error guardando");
      setLoading(false);
      return;
    }

    setEmail("");
    setName("");
    setUrl("");
    setMessage("Producto agregado correctamente");
    setLoading(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="neon-card mt-8 space-y-4 rounded-2xl p-5"
    >
      <p className="text-sm font-medium text-emerald-200">Agregar producto a monitorear</p>
      <input
        className="w-full rounded-xl border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100 outline-none ring-emerald-500/40 placeholder:text-emerald-300/40 focus:ring"
        placeholder="Email del usuario"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full rounded-xl border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100 outline-none ring-emerald-500/40 placeholder:text-emerald-300/40 focus:ring"
        placeholder="Nombre del producto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="w-full rounded-xl border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100 outline-none ring-emerald-500/40 placeholder:text-emerald-300/40 focus:ring"
        placeholder="URL de books.toscrape.com, olimpica.com, shein.com.co, alkosto.com u oportunidades.com.co"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button
        className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Guardando..." : "Agregar producto"}
      </button>

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
    </form>
  );
}
