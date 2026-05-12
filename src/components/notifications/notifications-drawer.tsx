"use client";

import { Bell, CheckCircle2, Clock, X } from "lucide-react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { Notification } from "@/lib/notifications/queries";
import {
  NOTI_TONE_STYLES,
  formatNotificationTime,
  viewForNotification,
} from "@/lib/notifications/view";
import { cn } from "@/lib/utils";

// ─── Trigger (campana con badge) ────────────────────────────────────────────

export function NotificationsBell({
  unreadCount,
  onClick,
  variant = "default",
}: {
  unreadCount: number;
  onClick: () => void;
  /** "default": chip blanco con ring (para fondos claros).
   *  "ghost": sin background (para sidebars / headers oscuros). */
  variant?: "default" | "ghost";
}) {
  const isGhost = variant === "ghost";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex size-10 flex-shrink-0 items-center justify-center rounded-full transition active:scale-95",
        isGhost
          ? "text-zinc-700 hover:bg-zinc-100"
          : "bg-zinc-900 text-white shadow-lg shadow-zinc-900/15 ring-1 ring-zinc-900/10 hover:bg-zinc-800",
      )}
      aria-label={
        unreadCount > 0
          ? `Notificaciones (${unreadCount} sin leer)`
          : "Notificaciones"
      }
    >
      <Bell className="size-[18px]" strokeWidth={2} />
      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold tabular-nums text-white",
            isGhost ? "ring-2 ring-zinc-50" : "ring-2 ring-white",
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

// ─── Drawer ─────────────────────────────────────────────────────────────────

export function NotificationsDrawer({
  open,
  onOpenChange,
  notifications,
  onItemClick,
  onMarkAllRead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  /** El padre decide qué hacer al tocar (marcar como leído + deep-link).
   *  Permite separar mocks (solo local) de notifs reales (server action). */
  onItemClick: (n: Notification) => void;
  onMarkAllRead: () => void;
}) {
  const unread = notifications.filter((n) => !n.read_at).length;

  const handleMarkAll = () => {
    onMarkAllRead();
  };

  const handleClick = (n: Notification) => {
    onItemClick(n);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <header className="border-border/60 flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-zinc-600" />
            <SheetTitle className="text-base font-bold tracking-tight">
              Notificaciones
            </SheetTitle>
            {unread > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold tabular-nums text-white">
                {unread}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="hover:bg-muted -mr-2 inline-flex size-8 items-center justify-center rounded-md transition-colors"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
              <CheckCircle2 className="size-8 text-zinc-300" />
              <p className="text-sm font-semibold text-zinc-700">
                Sin novedades
              </p>
              <p className="text-xs text-zinc-500">
                Cuando algo amerite tu atención, va a aparecer acá.
              </p>
            </div>
          ) : (
            <ul className="divide-border/60 divide-y">
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  noti={n}
                  onClick={() => handleClick(n)}
                />
              ))}
            </ul>
          )}
        </div>

        <footer className="border-border/60 flex items-center justify-between border-t px-5 py-3">
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={unread === 0}
            className="text-xs font-semibold text-zinc-600 transition hover:text-zinc-900 disabled:opacity-40"
          >
            Marcar todas como leídas
          </button>
          <span className="text-[11px] text-zinc-400">
            {notifications.length} en total
          </span>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function NotificationRow({
  noti,
  onClick,
}: {
  noti: Notification;
  onClick: () => void;
}) {
  const view = viewForNotification(noti);
  const Icon = view.icon;
  const t = NOTI_TONE_STYLES[view.tone];
  const read = !!noti.read_at;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full gap-3 px-5 py-3 text-left transition hover:bg-zinc-50",
          read ? "bg-zinc-50/40" : "bg-white",
        )}
      >
        <span
          className={cn(
            "mt-0.5 inline-flex size-8 flex-shrink-0 items-center justify-center rounded-full ring-1",
            t.iconBg,
            t.iconText,
            t.ring,
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "truncate text-sm",
                read ? "font-medium text-zinc-600" : "font-semibold text-zinc-900",
              )}
            >
              {view.title}
            </p>
            <span className="inline-flex flex-shrink-0 items-center gap-1 text-[11px] tabular-nums text-zinc-400">
              <Clock className="size-3" />
              {formatNotificationTime(noti.created_at)}
            </span>
          </div>
          {view.body && (
            <p
              className={cn(
                "mt-0.5 text-xs",
                read ? "text-zinc-500" : "text-zinc-600",
              )}
            >
              {view.body}
            </p>
          )}
        </div>
        {!read && (
          <span
            aria-hidden
            className="mt-2 size-2 flex-shrink-0 rounded-full bg-rose-500"
          />
        )}
      </button>
    </li>
  );
}
