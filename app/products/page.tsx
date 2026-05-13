import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";
import { ProductForm } from "@/app/product-form";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductsPage() {
  const { data } = await supabase
    .from("tracked_products")
    .select("id,name,url,active,users(email)")
    .order("created_at", { ascending: false });

  const products = data ?? [];

  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen px-4 py-8 md:px-8">
        <div className="space-y-4">
          <ModuleShell
            title="PRODUCTOS // ALTA Y GESTIÓN"
            description="Pantalla única para registrar nuevos productos y ver el inventario monitoreado."
          >
            <ProductForm />
          </ModuleShell>

          <section className="neon-card rounded-2xl p-4">
            <h2 className="neon-text text-lg font-semibold">Inventario monitoreado</h2>
            <div className="mt-3 space-y-2 text-sm">
              {products.map((p) => (
                <div key={p.id} className="terminal-log rounded-lg p-2">
                  <p className="text-emerald-200">{p.name}</p>
                  <p className="text-emerald-200/70">{(p as { users?: { email?: string } }).users?.email ?? "sin email"}</p>
                  <p className="text-cyan-300">{p.active ? "activo" : "pausado"}</p>
                  <Link className="text-xs text-cyan-200 underline" href={`/products/${p.id}`}>
                    Ver detalle
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </ConsoleShell>
  );
}
