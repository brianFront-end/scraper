import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";

export default function AlertsPage() {
  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen px-4 py-8 md:px-8">
        <ModuleShell
          title="ALERTAS // RULE ENGINE"
          description="Configura reglas por precio objetivo, descuento objetivo y mensajes personalizados por producto."
        >
          <ul className="terminal-log rounded-xl p-3 text-sm text-emerald-200/90">
            <li>- Regla 1: enviar si precio menor o igual al objetivo.</li>
            <li>- Regla 2: enviar si descuento {">="} objetivo porcentual.</li>
            <li>- Fallback: sin reglas, envío cada 30 minutos.</li>
          </ul>
        </ModuleShell>
      </main>
    </ConsoleShell>
  );
}
