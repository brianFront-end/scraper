import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";

export default function IntegrationsPage() {
  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen px-4 py-8 md:px-8">
        <ModuleShell
          title="INTEGRACIONES // STACK"
          description="Estado de integraciones principales para scraping, orquestación y notificaciones."
        >
          <ul className="terminal-log rounded-xl p-3 text-sm text-emerald-200/90">
            <li>- Supabase: conectado</li>
            <li>- Inngest: cron activo</li>
            <li>- Resend: envío operativo</li>
            <li>- Scrape.do: ruta Shein dedicada</li>
          </ul>
        </ModuleShell>
      </main>
    </ConsoleShell>
  );
}
