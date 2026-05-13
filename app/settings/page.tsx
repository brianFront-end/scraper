import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";

export default function SettingsPage() {
  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen px-4 py-8 md:px-8">
        <ModuleShell
          title="SETTINGS // ADVANCED OPS"
          description="Opciones sugeridas para próximas fases: métricas avanzadas, prompting inteligente y RAG chat sobre base de datos."
        >
          <div className="terminal-log rounded-xl p-3 text-sm text-emerald-200/90">
            <p className="text-cyan-300">Métricas avanzadas (propuestas)</p>
            <p>- Volatilidad por producto (std dev).</p>
            <p>- Tiempo medio entre cambios de precio.</p>
            <p>- Ranking de productos con mayor caída semanal.</p>
            <p className="mt-2 text-cyan-300">Prompting inteligente (propuestas)</p>
            <p>- Plantillas por intención: resumen, anomalías, comparación.</p>
            <p>- Guardrails para consultas SQL seguras readonly.</p>
            <p className="mt-2 text-cyan-300">RAG simple (propuesta fase 2)</p>
            <p>- Embeddings de products/checks/notifications.</p>
            <p>- Chat con recuperación semántica + respuesta contextual.</p>
          </div>
        </ModuleShell>
      </main>
    </ConsoleShell>
  );
}
