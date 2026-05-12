"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { Notification } from "@/lib/notifications/queries";
import {
  NOTI_TONE_STYLES,
  formatNotificationTime,
  viewForNotification,
} from "@/lib/notifications/view";
import { cn } from "@/lib/utils";

// ─── API global ─────────────────────────────────────────────────────────────
//
// El host vive una sola vez en cada layout (admin + mozo) y escucha un
// CustomEvent global. Cualquier consumidor que detecte una notificación
// nueva (realtime, polling, etc.) dispara el evento — el host se encarga
// del resto (slide-in, stack, auto-dismiss).

const NOTI_TOAST_EVENT = "noti:toast";

export function dispatchNotificationToast(noti: Notification) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<Notification>(NOTI_TOAST_EVENT, { detail: noti }),
  );
}

// ─── State del stack ────────────────────────────────────────────────────────

type ToastEntry = {
  /** Id estable, derivado del id de la notificación + un sufijo si llega
   *  duplicada (no debería pasar pero por las dudas). */
  key: string;
  noti: Notification;
  /** Marca de tiempo en la que se enqueueó — para hidratar el "ahora" sin
   *  depender de `created_at` del server (que puede tener clock skew). */
  enqueuedAt: number;
  /** "entering" / "open" / "leaving" — data-state para CSS. */
  state: "entering" | "open" | "leaving";
};

const TOAST_DURATION_MS = 5000;
const TOAST_MAX_STACK = 4;

// ─── Componente ─────────────────────────────────────────────────────────────

export function NotificationsToastHost({
  onToastClick,
}: {
  /** Callback cuando el usuario toca un toast — típicamente abre el drawer. */
  onToastClick?: (n: Notification) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  // El portal monta a `document.body` pero React hydration corre primero —
  // esperamos a que `window` exista.
  useEffect(() => setMounted(true), []);

  const remove = useCallback((key: string) => {
    // Marcamos leaving primero (animación) y borramos después de 280ms.
    setToasts((cur) =>
      cur.map((t) => (t.key === key ? { ...t, state: "leaving" } : t)),
    );
    window.setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.key !== key));
    }, 280);
  }, []);

  // Listener del evento global.
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<Notification>;
      const noti = ce.detail;
      if (!noti?.id) return;
      const key = `${noti.id}-${Date.now()}`;
      setToasts((cur) => {
        // Evitar duplicar exactamente el mismo id en un instante.
        if (cur.some((t) => t.noti.id === noti.id)) return cur;
        const next = [
          ...cur,
          { key, noti, enqueuedAt: Date.now(), state: "entering" as const },
        ];
        // Capamos el stack — drop el más viejo si nos pasamos.
        return next.slice(-TOAST_MAX_STACK);
      });
      // Tras un frame, pasar de "entering" a "open" para activar transición.
      requestAnimationFrame(() => {
        setToasts((cur) =>
          cur.map((t) =>
            t.key === key && t.state === "entering"
              ? { ...t, state: "open" }
              : t,
          ),
        );
      });
      // Auto-dismiss.
      window.setTimeout(() => remove(key), TOAST_DURATION_MS);
    };
    window.addEventListener(NOTI_TOAST_EVENT, handler);
    return () => window.removeEventListener(NOTI_TOAST_EVENT, handler);
  }, [remove]);

  if (!mounted) return null;

  return createPortal(
    <div
      // Stack en el top centro (estilo iOS dynamic island / banners).
      // pointer-events-none en el wrapper → clicks pasan al contenido salvo
      // sobre los toasts (cada uno re-activa pointer events).
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-3 pt-3 sm:pt-4"
    >
      {toasts.map((t) => (
        <ToastCard
          key={t.key}
          entry={t}
          onClick={() => {
            onToastClick?.(t.noti);
            remove(t.key);
          }}
          onDismiss={() => remove(t.key)}
        />
      ))}
    </div>,
    document.body,
  );
}

// ─── Toast individual ───────────────────────────────────────────────────────

function ToastCard({
  entry,
  onClick,
  onDismiss,
}: {
  entry: ToastEntry;
  onClick: () => void;
  onDismiss: () => void;
}) {
  const view = viewForNotification(entry.noti);
  const Icon = view.icon;
  const tone = NOTI_TONE_STYLES[view.tone];

  // ── Swipe-to-dismiss (touch) ──────────────────────────────────────────────
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Solo dejamos arrastrar hacia arriba (estilo iOS).
    setDragY(Math.min(0, dy));
  };
  const onTouchEnd = () => {
    if (dragY < -40) {
      onDismiss();
    } else {
      setDragY(0);
    }
    touchStartY.current = null;
    touchStartX.current = null;
  };

  return (
    <button
      type="button"
      data-state={entry.state}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform:
          entry.state === "entering"
            ? "translateY(-120%) scale(0.96)"
            : entry.state === "leaving"
              ? "translateY(-120%) scale(0.96)"
              : `translateY(${dragY}px) scale(1)`,
        opacity: entry.state === "open" ? 1 : 0,
        transition:
          "transform 280ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        backdropFilter: "blur(20px) saturate(180%)",
      }}
      className={cn(
        "pointer-events-auto group flex w-full max-w-md items-start gap-3 rounded-2xl px-3 py-2.5 text-left",
        "bg-white/85 ring-1 ring-zinc-900/5",
        "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.20),0_4px_10px_-4px_rgba(0,0,0,0.08)]",
        "transition active:scale-[0.985]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-9 flex-shrink-0 items-center justify-center rounded-full ring-1",
          tone.iconBg,
          tone.iconText,
          tone.ring,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[13px] font-semibold tracking-tight text-zinc-900">
            {view.title}
          </p>
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            {formatNotificationTime(entry.noti.created_at)}
          </span>
        </div>
        {view.body && (
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-zinc-600">
            {view.body}
          </p>
        )}
      </div>
    </button>
  );
}
