import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";
import { supabase } from "@/lib/supabase";

export default async function ResendLogsPage() {
  const { data } = await supabase
    .from("notifications")
    .select("id,email,sent_at,delivery_status,provider_message_id,status_updated_at,payload")
    .order("sent_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];

  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen px-4 py-8 md:px-8">
        <ModuleShell
          title="RESEND LOGS // DELIVERY"
          description="Panel para ver estado de entregas y trazabilidad de notificaciones enviadas."
        >
          <div className="terminal-log overflow-x-auto rounded-xl p-3 text-sm text-emerald-200/90">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="text-cyan-300">
                <tr>
                  <th className="px-2 py-2 text-left">Email</th>
                  <th className="px-2 py-2 text-left">Estado</th>
                  <th className="px-2 py-2 text-left">Mensaje ID</th>
                  <th className="px-2 py-2 text-left">Enviado</th>
                  <th className="px-2 py-2 text-left">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-emerald-400/20">
                    <td className="px-2 py-2">{row.email}</td>
                    <td className="px-2 py-2">{row.delivery_status ?? "unknown"}</td>
                    <td className="px-2 py-2">{row.provider_message_id ?? "n/a"}</td>
                    <td className="px-2 py-2">{new Date(row.sent_at).toLocaleString("es-CO")}</td>
                    <td className="px-2 py-2">
                      {row.status_updated_at ? new Date(row.status_updated_at).toLocaleString("es-CO") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModuleShell>
      </main>
    </ConsoleShell>
  );
}
