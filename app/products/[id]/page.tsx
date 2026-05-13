import Link from "next/link";
import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";
import { ProductActions } from "@/app/product-actions";
import { supabase } from "@/lib/supabase";

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

function formatMoney(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await supabase
    .from("tracked_products")
    .select(
      "id,name,url,active,users(email),price_checks(checked_at,price,currency),product_alert_settings(target_price,target_discount_percent,custom_message)",
    )
    .eq("id", id)
    .single();

  if (!data) {
    return (
      <ConsoleShell>
        <main className="scanlines min-h-screen px-4 py-8 md:px-8">
          <ModuleShell title="PRODUCTO NO ENCONTRADO" description="No hay datos para el producto solicitado." />
        </main>
      </ConsoleShell>
    );
  }

  const checks = (data.price_checks ?? []).slice().reverse();
  const values = checks.map((c) => c.price);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const latest = (data.price_checks ?? [])[0];
  const currency = latest?.currency ?? "COP";
  const settings = data.product_alert_settings?.[0] ?? {
    target_price: null,
    target_discount_percent: null,
    custom_message: null,
  };

  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen space-y-4 px-4 py-8 md:px-8">
        <Link href="/products" className="text-xs text-cyan-300 underline">
          ← Volver a productos
        </Link>

        <ModuleShell title={`DETALLE // ${data.name}`} description="Vista avanzada del producto monitoreado.">
          <p className="text-sm text-emerald-200/80">{data.url}</p>
          <p className="text-sm text-emerald-200/80">Owner: {(data as { users?: { email?: string } }).users?.email ?? "n/a"}</p>
          <div className="mt-3">
            <ProductActions
              productId={data.id}
              active={data.active}
              initialSettings={{
                targetPrice: settings.target_price,
                targetDiscountPercent: settings.target_discount_percent,
                customMessage: settings.custom_message,
              }}
            />
          </div>
        </ModuleShell>

        <section className="grid gap-3 md:grid-cols-4">
          <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">Último: {latest ? formatMoney(latest.price, currency) : "n/a"}</div>
          <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">Promedio: {formatMoney(avg, currency)}</div>
          <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">Mínimo: {formatMoney(min, currency)}</div>
          <div className="neon-card rounded-xl p-3 text-sm text-emerald-100">Máximo: {formatMoney(max, currency)}</div>
        </section>

        <section className="neon-card rounded-xl p-4">
          <p className="mb-2 text-xs uppercase text-cyan-300">Gráfica tipo trading (tendencia + escala)</p>
          <div className="grid gap-2 md:grid-cols-[84px_1fr]">
            <div className="text-[11px] text-emerald-200/80">
              <p>MAX: {formatMoney(max, currency)}</p>
              <p className="mt-6">AVG: {formatMoney(avg, currency)}</p>
              <p className="mt-6">MIN: {formatMoney(min, currency)}</p>
            </div>
            <div className="terminal-log rounded-lg p-2">
              <svg viewBox="0 0 100 34" className="h-28 w-full">
                <line x1="0" y1="4" x2="100" y2="4" stroke="rgba(49,245,200,0.25)" strokeDasharray="1.5 1.5" />
                <line x1="0" y1="17" x2="100" y2="17" stroke="rgba(49,245,200,0.2)" strokeDasharray="1.5 1.5" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(49,245,200,0.25)" strokeDasharray="1.5 1.5" />
                <path d={sparklinePath(values)} fill="none" stroke="#31f5c8" strokeWidth="1.9" />
                {values.map((value, idx) => {
                  if (values.length < 2) return null;
                  const x = (idx / (values.length - 1)) * 100;
                  const y = 32 - ((value - min) / ((max - min || 1))) * 28;
                  return <circle key={`${value}-${idx}`} cx={x} cy={y} r="0.8" fill="#7cf7e0" />;
                })}
              </svg>
            </div>
          </div>
        </section>

        <section className="neon-card rounded-xl p-4">
          <p className="mb-2 text-xs uppercase text-cyan-300">Fluctuación por vela (últimos 12 checks)</p>
          <div className="flex h-36 items-end gap-1">
            {checks.slice(-12).map((check, idx, arr) => {
              const localValues = arr.map((x) => x.price);
              const localMax = Math.max(...localValues, 1);
              const height = Math.max(8, (check.price / localMax) * 120);
              const prev = idx > 0 ? arr[idx - 1] : null;
              const isUp = prev ? check.price >= prev.price : true;
              return (
                <div key={`${check.checked_at}-${idx}`} className="group flex-1" title={`${new Date(check.checked_at).toLocaleString("es-CO")} | ${formatMoney(check.price, check.currency)}`}>
                  <div
                    className={`w-full rounded-t ${isUp ? "bg-emerald-400/80" : "bg-rose-400/80"}`}
                    style={{ height }}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-emerald-200/70">
            Verde = subió o mantuvo, Rojo = bajó. Pasá el mouse por cada vela para ver precio y fecha.
          </p>
        </section>
      </main>
    </ConsoleShell>
  );
}
