"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  active: boolean;
  initialSettings: {
    targetPrice: number | null;
    targetDiscountPercent: number | null;
    customMessage: string | null;
  };
};

export function ProductActions({ productId, active, initialSettings }: Props) {
  const router = useRouter();
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [targetPrice, setTargetPrice] = useState(initialSettings.targetPrice?.toString() ?? "");
  const [targetDiscountPercent, setTargetDiscountPercent] = useState(
    initialSettings.targetDiscountPercent?.toString() ?? "",
  );
  const [customMessage, setCustomMessage] = useState(initialSettings.customMessage ?? "");
  const [commandLog, setCommandLog] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isBusy = loadingCheck || loadingToggle || loadingDelete;

  useEffect(() => {
    if (!isBusy) return;

    const script = [
      "$ auth --token ****",
      "$ fetch target::product",
      "$ run scrape --stealth",
      "$ parse --price --currency",
      "$ commit db::price_checks",
      "$ notify --channel=email",
    ];

    let index = 1;
    const timer = setInterval(() => {
      if (index >= script.length) {
        clearInterval(timer);
        return;
      }
      setCommandLog((prev) => [...prev, script[index]]);
      index += 1;
    }, 350);

    return () => clearInterval(timer);
  }, [isBusy]);

  async function checkNow() {
    setCommandLog(["$ auth --token ****"]);
    setLoadingCheck(true);
    setMessage("");
    const res = await fetch(`/api/tracked-products/${productId}/check`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "No se pudo ejecutar chequeo manual");
      setLoadingCheck(false);
      return;
    }

    setMessage("Chequeo manual ejecutado");
    setLoadingCheck(false);
    router.refresh();
  }

  async function toggleActive() {
    setCommandLog(["$ auth --token ****"]);
    setLoadingToggle(true);
    setMessage("");
    const res = await fetch(`/api/tracked-products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error ?? "No se pudo actualizar estado");
      setLoadingToggle(false);
      return;
    }

    setMessage(!active ? "Producto activado" : "Producto pausado");
    setLoadingToggle(false);
    router.refresh();
  }

  async function removeProduct() {
    const confirmed = window.confirm("¿Eliminar este producto monitoreado?");
    if (!confirmed) return;

    setCommandLog(["$ auth --token ****"]);
    setLoadingDelete(true);
    setMessage("");

    const res = await fetch(`/api/tracked-products/${productId}`, {
      method: "DELETE",
    });
    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error ?? "No se pudo eliminar el producto");
      setLoadingDelete(false);
      return;
    }

    setMessage("Producto eliminado");
    setLoadingDelete(false);
    router.refresh();
  }

  async function saveSettings() {
    setSavingSettings(true);
    setMessage("");

    const res = await fetch(`/api/tracked-products/${productId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetPrice: targetPrice.trim() ? Number(targetPrice) : null,
        targetDiscountPercent: targetDiscountPercent.trim() ? Number(targetDiscountPercent) : null,
        customMessage: customMessage.trim() ? customMessage : null,
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error ?? "No se pudo guardar configuración");
      setSavingSettings(false);
      return;
    }

    setSavingSettings(false);
    setShowSettings(false);
    setMessage("Configuración guardada");
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
      <button
        onClick={checkNow}
        disabled={loadingCheck || !active}
        className="rounded-lg border border-cyan-400/50 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingCheck ? "Chequeando..." : "Chequear ahora"}
      </button>

      <button
        onClick={toggleActive}
        disabled={loadingToggle || loadingDelete}
        className="rounded-lg border border-emerald-400/50 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingToggle ? "Actualizando..." : active ? "Pausar" : "Activar"}
      </button>

      <button
        onClick={() => setShowSettings(true)}
        disabled={isBusy}
        className="rounded-lg border border-violet-400/50 px-3 py-1.5 text-xs font-medium text-violet-300 transition hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Configurar alerta
      </button>

      <button
        onClick={removeProduct}
        disabled={loadingDelete || loadingCheck || loadingToggle}
        className="rounded-lg border border-rose-400/50 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingDelete ? "Eliminando..." : "Eliminar"}
      </button>

      <span
        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
          active
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-amber-500/20 text-amber-300"
        }`}
      >
        {active ? "activo" : "pausado"}
      </span>
      </div>

      <div className="sm:hidden">
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="hacker-btn rounded-lg px-3 py-1.5 text-xs"
        >
          ⚙ Opciones
        </button>
        {mobileMenuOpen ? (
          <div className="terminal-log mt-2 grid gap-2 rounded-lg p-2">
            <button
              onClick={checkNow}
              disabled={loadingCheck || !active}
              className="hacker-btn rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {loadingCheck ? "Chequeando..." : "Chequear ahora"}
            </button>
            <button
              onClick={toggleActive}
              disabled={loadingToggle || loadingDelete}
              className="hacker-btn rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {loadingToggle ? "Actualizando..." : active ? "Pausar" : "Activar"}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              disabled={isBusy}
              className="hacker-btn rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Configurar alerta
            </button>
            <button
              onClick={removeProduct}
              disabled={loadingDelete || loadingCheck || loadingToggle}
              className="rounded-lg border border-rose-400/50 px-3 py-1.5 text-xs text-rose-300 disabled:opacity-50"
            >
              {loadingDelete ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        ) : null}
      </div>

      {isBusy ? (
        <div className="terminal-log rounded-lg p-2 text-[10px]">
          {commandLog.map((line, index) => (
            <p key={`${line}-${index}`} className="leading-4">{line}</p>
          ))}
          <p className="animate-pulse text-cyan-300">▋ ejecutando...</p>
        </div>
      ) : null}

      {message ? <p className="text-xs text-emerald-200">{message}</p> : null}

      {showSettings ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="neon-card w-full max-w-md rounded-2xl p-4">
            <h4 className="neon-text text-lg font-semibold">Configuración de alerta</h4>
            <p className="mt-1 text-xs text-emerald-200/80">
              Si no configuras objetivo, se enviará email cada 30 minutos.
            </p>

            <div className="mt-3 space-y-3">
              <input
                className="w-full rounded-lg border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100"
                placeholder="Precio objetivo (ej: 1200000)"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100"
                placeholder="Descuento objetivo % (ej: 15)"
                value={targetDiscountPercent}
                onChange={(e) => setTargetDiscountPercent(e.target.value)}
              />
              <textarea
                className="w-full rounded-lg border border-emerald-400/30 bg-black/50 px-3 py-2 text-sm text-emerald-100"
                placeholder="Mensaje personalizado para Resend"
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-lg border border-zinc-500/50 px-3 py-1.5 text-xs text-zinc-200"
                onClick={() => setShowSettings(false)}
                disabled={savingSettings}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
                onClick={saveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
