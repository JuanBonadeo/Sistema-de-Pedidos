"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import { markAllRead, markRead } from "@/lib/notifications/actions";
import type { Notification } from "@/lib/notifications/queries";

type Props = {
  businessSlug: string;
  initialNotifications: Notification[];
  initialUnreadCount: number;
};

function relativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function describe(n: Notification): string {
  if (n.type === "mesa.transferred") {
    const p = n.payload as {
      tableLabel?: string;
      fromName?: string | null;
      toName?: string | null;
    };
    return `Mesa ${p.tableLabel ?? "?"} transferida${p.fromName ? ` de ${p.fromName}` : ""}${p.toName ? ` a ${p.toName}` : ""}`;
  }
  if (n.type === "mesa.cancelled") {
    const p = n.payload as { tableLabel?: string };
    return `Mesa ${p.tableLabel ?? "?"} anulada`;
  }
  if (n.type === "order.pending") {
    const p = n.payload as {
      orderNumber?: number;
      customerName?: string;
      deliveryType?: string;
    };
    const tipo =
      p.deliveryType === "delivery"
        ? "delivery"
        : p.deliveryType === "take_away"
          ? "take-away"
          : "pedido";
    return `Pedido nuevo · #${p.orderNumber ?? "?"} ${tipo}${p.customerName ? ` de ${p.customerName}` : ""}`;
  }
  return n.type;
}

export function NotificationBell({
  businessSlug,
  initialNotifications,
  initialUnreadCount,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = initialUnreadCount;

  const onMarkAll = async () => {
    const result = await markAllRead(businessSlug);
    if (!result.ok) return;
    router.refresh();
  };

  const onClickItem = async (n: Notification) => {
    if (!n.read_at) {
      await markRead(n.id, businessSlug);
    }
    // Navegación según tipo. Cerramos el dropdown.
    setOpen(false);
    if (n.type === "order.pending") {
      router.push(`/${businessSlug}/admin/local?tab=pedidos`);
      return;
    }
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 hover:bg-zinc-100"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5 text-zinc-700" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <p className="text-sm font-semibold">Notificaciones</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-xs font-medium text-sky-600 hover:underline"
              >
                Marcar todo leído
              </button>
            )}
          </div>

          {initialNotifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin notificaciones
            </p>
          ) : (
            <ul className="max-h-96 divide-y overflow-auto">
              {initialNotifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onClickItem(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 ${n.read_at ? "" : "bg-sky-50/40"}`}
                  >
                    {!n.read_at && (
                      <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-800">{describe(n)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {relativeTime(n.created_at)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
