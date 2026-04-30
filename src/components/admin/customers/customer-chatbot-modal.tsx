import Image from "next/image";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { ChevronRight, MessageCircle } from "lucide-react";

import type { CustomerChatbotConversation } from "@/lib/admin/customers-query";
import { cn } from "@/lib/utils";

// Card de preview que linkea a la vista WhatsApp dedicada del cliente.
// El componente se sigue llamando "modal" por compat con imports existentes,
// pero ya no abre un modal: navega a /clientes/[id]/chatbot.
export function CustomerChatbotSection({
  conversation,
  businessName,
  businessLogoUrl,
  customerName,
  customerPhone,
  customerId,
  slug,
  timezone,
}: {
  conversation: CustomerChatbotConversation | null;
  businessName: string;
  businessLogoUrl: string | null;
  customerName: string | null;
  customerPhone: string;
  customerId: string;
  slug: string;
  timezone: string;
}) {
  const lastMessage = conversation?.messages.at(-1);
  const lastPreview = lastMessage
    ? truncate(lastMessage.content, 80)
    : "Sin mensajes todavía";
  const lastTime = lastMessage
    ? formatInTimeZone(lastMessage.created_at, timezone, "d MMM · HH:mm", {
        locale: es,
      })
    : null;
  const messageCount = conversation?.messages.length ?? 0;
  const initials = getInitials(businessName);

  const href = `/${slug}/admin/clientes/${customerId}/chatbot`;
  const enabled = Boolean(conversation);

  const RowContent = (
    <>
      <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-bold text-zinc-700">
        {businessLogoUrl ? (
          <Image
            src={businessLogoUrl}
            alt={businessName}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {businessName}
        </p>
        <p className="truncate text-xs text-zinc-500">{lastPreview}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {lastTime && (
          <span className="text-[0.65rem] tabular-nums text-zinc-400">
            {lastTime}
          </span>
        )}
        {enabled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-700">
            <MessageCircle className="size-3" />
            Abrir chat
          </span>
        ) : (
          <span className="text-[0.6rem] text-zinc-400">Sin chat aún</span>
        )}
      </div>
      {enabled && <ChevronRight className="size-4 shrink-0 text-zinc-300" />}
    </>
  );

  return (
    <section className="rounded-2xl bg-white ring-1 ring-zinc-200/70">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Chatbot
          </h2>
          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-wider text-zinc-500">
            Pedidos
          </span>
          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-wider text-amber-600">
            Reservas próximamente
          </span>
        </div>
        <span className="text-xs text-zinc-500">
          {messageCount === 0
            ? "Sin conversación"
            : messageCount === 1
              ? "1 mensaje"
              : `${messageCount} mensajes`}
        </span>
      </header>

      {enabled ? (
        <Link
          href={href}
          className={cn(
            "flex items-center gap-4 px-5 py-4 text-left transition hover:bg-zinc-50/80",
          )}
          title={`Ver el chat de ${customerName ?? customerPhone} con el bot`}
        >
          {RowContent}
        </Link>
      ) : (
        <div
          className="flex cursor-not-allowed items-center gap-4 px-5 py-4 text-left opacity-60"
          title="Este cliente todavía no chateó con el bot"
        >
          {RowContent}
        </div>
      )}
    </section>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getInitials(s: string): string {
  return (
    s
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}
