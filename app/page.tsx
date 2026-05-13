import { ConsoleShell } from "./console-shell";
import { ModuleShell } from "./module-shell";
import { DashboardProductsClient } from "./dashboard-products-client";
import { MetricsWindowPanel } from "./metrics-window-panel";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Product = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  created_at: string;
  users: { email: string } | null;
  price_checks?: { checked_at: string; price: number; currency: string }[];
  product_alert_settings?: {
    target_price: number | null;
    target_discount_percent: number | null;
    custom_message: string | null;
  }[];
};

export default async function Home() {
  const { data, error } = await supabase
    .from("tracked_products")
    .select(
      "id,name,url,active,created_at,users(email),price_checks(checked_at,price,currency),product_alert_settings(target_price,target_discount_percent,custom_message)",
    )
    .order("created_at", { ascending: false })
    .order("checked_at", { foreignTable: "price_checks", ascending: false })
    .limit(20, { foreignTable: "price_checks" });

  const fallback =
    error !== null
      ? await supabase
          .from("tracked_products")
          .select("id,name,url,active,created_at,users(email),price_checks(checked_at,price,currency)")
          .order("created_at", { ascending: false })
          .order("checked_at", { foreignTable: "price_checks", ascending: false })
          .limit(20, { foreignTable: "price_checks" })
      : null;

  const products = (((error ? fallback?.data : data) ?? []) as unknown) as Product[];

  const trendStats = products.flatMap((p) => {
    const checks = p.price_checks ?? [];
    const deltas = checks
      .map((check, index) => {
        const next = checks[index + 1];
        if (!next) return null;
        return check.price - next.price;
      })
      .filter((v): v is number => v !== null);
    return deltas;
  });

  const ups = trendStats.filter((d) => d > 0).length;
  const downs = trendStats.filter((d) => d < 0).length;
  const totalMoves = trendStats.length;
  const downRate = totalMoves ? Math.round((downs / totalMoves) * 100) : 0;
  const upRate = totalMoves ? Math.round((ups / totalMoves) * 100) : 0;


  return (
    <ConsoleShell>
    <main className="scanlines min-h-screen px-3 py-5 sm:px-4 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <ModuleShell
          title="PRICE WATCHER // OPS CONSOLE"
          description="Monitoreo automático con Inngest + Supabase, historial de precios y alertas por email."
        >
          <p className="text-xs text-cyan-300">$ init price-watcher --mode=stealth</p>
        </ModuleShell>

        <section className="mt-6 md:mt-8">
          <h2
            className="glitch-title neon-text text-xl font-bold"
            data-text="Productos monitoreados"
          >
            Productos monitoreados
          </h2>

          <div className="mt-4 grid gap-3 grid-cols-2 xl:grid-cols-4">
            <div className="neon-card rounded-xl p-4">
              <p className="text-xs uppercase text-emerald-300/80">Productos activos</p>
              <p className="neon-text mt-1 text-2xl font-bold">
                {products.filter((p) => p.active).length}
              </p>
            </div>
            <div className="neon-card rounded-xl p-4">
              <p className="text-xs uppercase text-emerald-300/80">Registros históricos</p>
              <p className="neon-text mt-1 text-2xl font-bold">
                {products.reduce((acc, p) => acc + (p.price_checks?.length ?? 0), 0)}
              </p>
            </div>
            <div className="neon-card rounded-xl p-4">
              <p className="text-xs uppercase text-emerald-300/80">Subidas</p>
              <p className="mt-1 text-2xl font-bold text-rose-600">{upRate}%</p>
            </div>
            <div className="neon-card rounded-xl p-4">
              <p className="text-xs uppercase text-emerald-300/80">Bajadas</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{downRate}%</p>
            </div>
          </div>

          <MetricsWindowPanel products={products} />

          <div className="mt-4">
            <DashboardProductsClient products={products} />
          </div>
        </section>
      </div>
    </main>
    </ConsoleShell>
  );
}
