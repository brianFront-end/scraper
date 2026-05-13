"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const bootLines = [
  "> boot sequence initialized",
  "> loading kernel modules...ok",
  "> connecting inngest runtime...ok",
  "> mounting supabase datastore...ok",
  "> decrypting alert channels...ok",
  "> indexing product watchers...ok",
  "> tracing price-check jobs...ok",
  "> syncing command bus...ok",
  "> system ready",
];

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showBoot, setShowBoot] = useState(true);
  const [lineCount, setLineCount] = useState(1);
  const [openPanel, setOpenPanel] = useState(false);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openChatBubble, setOpenChatBubble] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLines, setChatLines] = useState<string[]>([
    "ai@pricewatcher:~$ help",
    "Comandos: help | ls | clear | query <texto>",
  ]);

  async function runTerminalCommand(rawInput: string) {
    const input = rawInput.trim();
    if (!input) return;

    setChatLines((prev) => [...prev, `ai@pricewatcher:~$ ${input}`]);

    if (input === "help") {
      setChatLines((prev) => [...prev, "Comandos: help | ls | clear | query <texto>"]);
      return;
    }

    if (input === "clear") {
      setChatLines([]);
      return;
    }

    if (input === "ls") {
      setChatLoading(true);
      const res = await fetch("/api/tracked-products", { cache: "no-store" });
      const json = await res.json();
      setChatLoading(false);

      if (!res.ok) {
        setChatLines((prev) => [...prev, `Error: ${json.error ?? "No se pudo listar productos"}`]);
        return;
      }

      const products = (json.data ?? []) as Array<{
        id: string;
        name: string;
        active: boolean;
        price_checks?: { price: number; currency: string; checked_at: string }[];
      }>;
      if (!products.length) {
        setChatLines((prev) => [...prev, "(sin productos)"]);
        return;
      }

      setChatLines((prev) => [
        ...prev,
        ...products.map((p) => {
          const latest = p.price_checks?.[0];
          const priceLabel = latest ? `${latest.currency} ${latest.price}` : "sin-price";
          return `${p.active ? "[up]" : "[pausado]"} ${p.name} | ${priceLabel} | ${p.id}`;
        }),
      ]);
      return;
    }

    const ragQuery = input.startsWith("query ") ? input.replace(/^query\s+/, "") : input;

    setChatLoading(true);
    const res = await fetch("/api/chat/rag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: ragQuery }),
    });
    const json = await res.json();
    setChatLoading(false);

    if (!res.ok) {
      setChatLines((prev) => [...prev, `Error: ${json.error ?? "No se pudo consultar AI"}`]);
      return;
    }

    const summary = (json?.context?.summary ?? []) as Array<{
      product: string;
      active: boolean;
      latestPrice: string;
      variation: string;
      notifications: number;
    }>;

    const summaryLines =
      summary.length > 0
        ? summary.flatMap((item) => [
            `- ${item.product} [${item.active ? "activo" : "pausado"}]`,
            `  precio: ${item.latestPrice} | variación: ${item.variation} | notifs: ${item.notifications}`,
          ])
        : ["(sin resumen para mostrar)"];

    setChatLines((prev) => [...prev, json.answer ?? "Sin respuesta", ...summaryLines]);
  }

  useEffect(() => {
    if (!showBoot) return;
    const timer = setInterval(() => {
      setLineCount((prev) => {
        if (prev >= bootLines.length) {
          clearInterval(timer);
          setTimeout(() => setShowBoot(false), 550);
          return prev;
        }
        return prev + 1;
      });
    }, 180);

    return () => clearInterval(timer);
  }, [showBoot]);

  const liveLines = useMemo(
    () => [
      "$ watch cron::check-products --interval=30m",
      "$ tail logs::inngest --follow",
      "$ query db::tracked_products --active",
      "$ trace pipeline::scrape->parse->notify",
      "$ status system::green",
    ],
    [],
  );

  const sidebarItems = [
    { label: "Dashboard", href: "/", icon: "⌂" },
    { label: "Productos", href: "/products", icon: "◫" },
    { label: "Comparación", href: "/comparisons", icon: "▤" },
    { label: "AI Chat", href: "/ai-chat", icon: "◎" },
    { label: "Alertas", href: "/alerts", icon: "⚑" },
    { label: "Cron Jobs", href: "/cron-jobs", icon: "⟳" },
    { label: "Resend Logs", href: "/resend-logs", icon: "✉" },
    { label: "Integraciones", href: "/integrations", icon: "⎇" },
    { label: "Configuración", href: "/settings", icon: "⚙" },
  ];

  return (
    <>
      <header className="neon-card sticky top-2 z-40 mx-auto mb-3 flex w-[min(1400px,98%)] items-center justify-between rounded-xl px-3 py-2 md:px-4">
        <div className="flex items-center gap-2">
          <button
            className="hacker-btn rounded-md px-2 py-1 text-xs lg:hidden"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? "Cerrar" : "Menú"}
          </button>
          <p className="neon-text text-xs font-semibold sm:text-sm">
            PRICE OPS by brianponce <span className="ml-2 hidden text-cyan-300 sm:inline">✦ Generated with AI</span>
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            className="hacker-btn rounded-md px-2 py-1"
            onClick={() => setOpenPanel((v) => !v)}
          >
            {openPanel ? "Cerrar Consola" : "Abrir Consola"}
          </button>
        </div>
      </header>

      {openPanel ? (
        <aside className="terminal-log fixed right-4 top-20 z-40 w-[360px] rounded-xl p-3 text-xs">
          <p className="mb-2 text-cyan-300">[ live-command-panel ]</p>
          {liveLines.map((line) => (
            <p key={line} className="leading-5 text-emerald-200">
              {line}
            </p>
          ))}
          <p className="mt-2 animate-pulse text-cyan-300">▋ listening...</p>
        </aside>
      ) : null}

      {mobileNavOpen ? (
        <div className="terminal-log mx-auto mb-3 w-[min(1400px,98%)] rounded-xl p-2 text-xs lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {sidebarItems.map((item) => (
              <Link
                key={`m-${item.href}`}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`rounded-lg border px-2 py-2 text-center ${
                  pathname === item.href
                    ? "border-cyan-300/50 bg-cyan-500/15 text-cyan-100"
                    : "border-emerald-400/20 bg-emerald-500/5 text-emerald-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={`mx-auto grid w-[min(1400px,98%)] grid-cols-1 gap-4 ${
          collapsedSidebar ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[20%_1fr]"
        }`}
      >
        <aside className="terminal-log hidden rounded-2xl px-3 py-4 text-xs lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)]">
          <div className="mb-3 flex items-center justify-between">
            {!collapsedSidebar ? (
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">navigation // ops</p>
            ) : (
              <span />
            )}
            <button
              onClick={() => setCollapsedSidebar((v) => !v)}
              className="hacker-btn rounded-md px-2 py-1 text-[10px]"
              aria-label="Colapsar sidebar"
            >
              {collapsedSidebar ? "»" : "«"}
            </button>
          </div>

          <div className="grid gap-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative block w-full rounded-lg border px-3 py-2 text-left transition duration-200 hover:backdrop-blur-sm ${
                  pathname === item.href
                    ? "border-cyan-300/50 bg-cyan-500/15 text-cyan-100 shadow-[0_0_16px_rgba(34,255,220,0.22)]"
                    : "border-emerald-400/20 bg-emerald-500/5 text-emerald-200 hover:border-cyan-300/40 hover:bg-emerald-400/15 hover:shadow-[0_0_14px_rgba(34,255,182,0.22)]"
                }`}
              >
                <span className="pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-lg bg-transparent transition group-hover:bg-cyan-300/40" />
                {collapsedSidebar ? (
                  <span className="flex items-center justify-center text-base leading-none">{item.icon}</span>
                ) : (
                  item.label
                )}
              </Link>
            ))}
          </div>

          <div className="mt-5 border-t border-emerald-400/20 pt-3">
            {!collapsedSidebar ? (
              <p className="text-[10px] uppercase tracking-wide text-cyan-300">system loader</p>
            ) : null}
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-black/30">
              <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-emerald-400 to-cyan-400" />
            </div>
            {!collapsedSidebar ? (
              <p className="mt-2 animate-pulse text-[11px] text-emerald-200/90">▋ running hacker diagnostics...</p>
            ) : null}
          </div>
        </aside>

        <div>{children}</div>
      </div>

      <p className="pointer-events-none fixed bottom-3 right-4 z-50 text-xs font-semibold tracking-[0.2em] text-emerald-300/35">
        BRIAN PONCE
      </p>

      <button
        onClick={() => setOpenChatBubble((v) => !v)}
        className="hacker-btn fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(34,255,220,0.35)] backdrop-blur hover:scale-105"
        aria-label="Abrir chat IA"
      >
        {openChatBubble ? "×" : "AI"}
      </button>

      {openChatBubble ? (
        <div className="terminal-log fixed bottom-20 right-3 z-50 w-[min(92vw,360px)] rounded-2xl p-3 text-xs">
          <p className="mb-2 text-cyan-300">[ ai::assistant ]</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await runTerminalCommand(chatQuery);
              setChatQuery("");
            }}
          >
            <input
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              className="w-full rounded-lg border border-emerald-400/30 bg-black/50 px-2 py-1.5 text-emerald-100"
              placeholder="help | ls | query xiaomi"
            />
            <button className="mt-2 rounded-md border border-emerald-400/40 px-2 py-1 text-emerald-200">
              {chatLoading ? "Consultando..." : "Consultar"}
            </button>
          </form>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-emerald-400/20 bg-black/35 p-2 text-emerald-100">
            {chatLines.map((line, idx) => (
              <p key={`${idx}-${line}`} className="leading-5">
                {line}
              </p>
            ))}
            {chatLoading ? <p className="animate-pulse text-cyan-300">▋ ejecutando...</p> : null}
          </div>
        </div>
      ) : null}

      {showBoot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="terminal-log w-full max-w-2xl rounded-2xl p-4">
            <p className="mb-3 text-cyan-300">Initializing command console...</p>
            {bootLines.slice(0, lineCount).map((line, idx) => (
              <p key={`${line}-${idx}`} className="leading-5 text-emerald-200">
                {line}
              </p>
            ))}
            <p className="mt-2 animate-pulse text-cyan-300">▋ booting...</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
