import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";

export default function CronJobsPage() {
  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen px-4 py-8 md:px-8">
        <ModuleShell
          title="CRON JOBS // INNGEST"
          description="Vista operativa para el cron principal y disparos manuales por producto."
        >
          <div className="terminal-log rounded-xl p-3 text-sm text-emerald-200/90">
            <p>$ schedule: */30 * * * *</p>
            <p>$ function: check-products-cron</p>
            <p>$ mode: active</p>
          </div>
        </ModuleShell>
      </main>
    </ConsoleShell>
  );
}
