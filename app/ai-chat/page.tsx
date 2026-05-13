import { ConsoleShell } from "@/app/console-shell";
import { ModuleShell } from "@/app/module-shell";
import { ChatConsole } from "./chat-console";

export default function AiChatPage() {
  return (
    <ConsoleShell>
      <main className="scanlines min-h-screen px-4 py-8 md:px-8">
        <ModuleShell
          title="AI CHAT // SIMPLE RAG"
          description="Consulta productos, precios y notificaciones usando recuperación de contexto desde Supabase."
        >
          <ChatConsole />
        </ModuleShell>
      </main>
    </ConsoleShell>
  );
}
