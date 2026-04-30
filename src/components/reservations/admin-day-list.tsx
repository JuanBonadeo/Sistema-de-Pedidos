"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";

import { updateReservationStatus } from "@/lib/reservations/booking-actions";
import type { Reservation, ReservationStatus } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

type Row = Reservation & { tables: { label: string } | null };

const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmed: "Confirmada",
  seated: "En mesa",
  completed: "Completada",
  no_show: "No vino",
  cancelled: "Cancelada",
};

const STATUS_DOT: Record<ReservationStatus, string> = {
  confirmed: "bg-blue-500",
  seated: "bg-emerald-500",
  completed: "bg-zinc-400",
  no_show: "bg-amber-500",
  cancelled: "bg-rose-500",
};

const STATUS_RING: Record<ReservationStatus, string> = {
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  seated: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  no_show: "bg-amber-50 text-amber-700 ring-amber-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

type Filter = "all" | "upcoming" | "seated" | "past";

/* ─── inline icons ────────────────────────────────────────────────────── */

const Ic = {
  arrow: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  chevL: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  chevR: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  square: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  ),
  cog: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  phone: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  user: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

/* ─── helpers ─────────────────────────────────────────────────────────── */

function buildDateStrip(centerIso: string) {
  const [y, m, d] = centerIso.split("-").map(Number);
  const out: { iso: string; weekday: string; day: number }[] = [];
  for (let i = -3; i <= 6; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const iso = dt.toISOString().slice(0, 10);
    const weekday = new Intl.DateTimeFormat("es-AR", {
      weekday: "short",
      timeZone: "UTC",
    }).format(dt);
    out.push({
      iso,
      weekday: weekday.replace(".", ""),
      day: dt.getUTCDate(),
    });
  }
  return out;
}

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/* ─── component ───────────────────────────────────────────────────────── */

export function AdminDayList({
  slug,
  date,
  rows,
  timezone,
}: {
  slug: string;
  date: string;
  rows: Row[];
  timezone: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");

  function setDate(next: string) {
    const params = new URLSearchParams(searchParams);
    params.set("date", next);
    router.push(`/${slug}/admin/reservas?${params.toString()}`);
  }

  function changeStatus(id: string, status: ReservationStatus) {
    start(async () => {
      const result = await updateReservationStatus({
        business_slug: slug,
        id,
        status,
      });
      if (result.ok) {
        toast.success("Estado actualizado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  /* KPIs */
  const stats = useMemo(() => {
    const now = Date.now();
    const total = rows.length;
    const guests = rows.reduce(
      (s, r) =>
        s + (r.status !== "cancelled" && r.status !== "no_show" ? r.party_size : 0),
      0,
    );
    const seated = rows.filter((r) => r.status === "seated").length;
    const upcoming = rows
      .filter((r) => r.status === "confirmed" && new Date(r.starts_at).getTime() > now)
      .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))[0];
    const nextLabel = upcoming
      ? formatInTimeZone(new Date(upcoming.starts_at), timezone, "HH:mm")
      : "—";
    return { total, guests, seated, nextLabel };
  }, [rows, timezone]);

  /* Filter */
  const filteredRows = useMemo(() => {
    const now = Date.now();
    return rows.filter((r) => {
      switch (filter) {
        case "upcoming":
          return r.status === "confirmed" && new Date(r.starts_at).getTime() > now - 5 * 60_000;
        case "seated":
          return r.status === "seated";
        case "past":
          return ["completed", "no_show", "cancelled"].includes(r.status);
        default:
          return true;
      }
    });
  }, [rows, filter]);

  const dateStrip = buildDateStrip(date);

  return (
    <div className="space-y-6">
      {/* ── KPI row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Reservas" value={String(stats.total)} />
        <KpiCard label="Comensales" value={String(stats.guests)} />
        <KpiCard label="En mesa ahora" value={String(stats.seated)} accent={stats.seated > 0} />
        <KpiCard label="Próxima" value={stats.nextLabel} mono />
      </div>

      {/* ── Date navigator + actions ──────────────────────────────────── */}
      <div
        className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200/70"
        style={{
          boxShadow:
            "0 1px 0 rgba(24, 24, 27, 0.02), 0 6px 14px -8px rgba(24, 24, 27, 0.06)",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDate(shiftDate(date, -1))}
              className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-zinc-100 hover:text-zinc-900 active:scale-95"
              aria-label="Día anterior"
            >
              <Ic.chevL />
            </button>
            <button
              type="button"
              onClick={() => setDate(shiftDate(date, 1))}
              className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-zinc-100 hover:text-zinc-900 active:scale-95"
              aria-label="Día siguiente"
            >
              <Ic.chevR />
            </button>
          </div>

          <div className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1">
            {dateStrip.map((d) => {
              const active = d.iso === date;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setDate(d.iso)}
                  className={cn(
                    "relative flex min-w-[52px] flex-col items-center rounded-xl px-2.5 py-2 ring-1 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]",
                    active
                      ? "bg-zinc-900 text-white ring-zinc-900"
                      : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
                  )}
                >
                  <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">
                    {d.weekday}
                  </span>
                  <span className="font-mono text-base font-semibold tabular-nums">
                    {d.day}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <span className="inline-flex h-8 cursor-pointer items-center rounded-full bg-zinc-100 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600 hover:bg-zinc-200">
              Saltar
            </span>
          </label>

          <div className="hidden h-6 w-px bg-zinc-200 sm:block" />

          <Link
            href={`/${slug}/admin/reservas/plano`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
          >
            <Ic.square /> Plano
          </Link>
          <Link
            href={`/${slug}/admin/reservas/configuracion`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
          >
            <Ic.cog /> Config
          </Link>
        </div>
      </div>

      {/* ── Filter segmented control ──────────────────────────────────── */}
      <div
        className="inline-flex rounded-full bg-zinc-100/80 p-1 ring-1 ring-zinc-200/60"
        role="tablist"
      >
        {(
          [
            { v: "all", l: `Todas (${rows.length})` },
            { v: "upcoming", l: "Próximas" },
            { v: "seated", l: "En mesa" },
            { v: "past", l: "Pasadas" },
          ] as { v: Filter; l: string }[]
        ).map((opt) => {
          const active = filter === opt.v;
          return (
            <button
              key={opt.v}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(opt.v)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                active
                  ? "bg-white text-zinc-900 shadow-[0_1px_2px_rgba(24,24,27,0.06),0_4px_10px_-6px_rgba(24,24,27,0.18)]"
                  : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              {opt.l}
            </button>
          );
        })}
      </div>

      {/* ── List ──────────────────────────────────────────────────────── */}
      {filteredRows.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul className="space-y-2.5">
          {filteredRows.map((r) => (
            <ReservationRow
              key={r.id}
              row={r}
              timezone={timezone}
              pending={pending}
              onChangeStatus={changeStatus}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── pieces ──────────────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-zinc-200/70",
      )}
      style={{
        boxShadow:
          "0 1px 0 rgba(24, 24, 27, 0.02), 0 6px 14px -8px rgba(24, 24, 27, 0.06)",
      }}
    >
      {accent ? (
        <span className="absolute right-3 top-3 grid h-2 w-2 place-items-center">
          <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-500/40" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      ) : null}
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-3xl font-semibold tracking-tight text-zinc-900",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ReservationRow({
  row,
  timezone,
  pending,
  onChangeStatus,
}: {
  row: Row;
  timezone: string;
  pending: boolean;
  onChangeStatus: (id: string, s: ReservationStatus) => void;
}) {
  const time = formatInTimeZone(new Date(row.starts_at), timezone, "HH:mm");
  const isSoftClosed = ["completed", "no_show", "cancelled"].includes(row.status);

  return (
    <li
      className={cn(
        "group relative rounded-2xl bg-white p-4 ring-1 ring-zinc-200/70 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-zinc-300",
        isSoftClosed && "opacity-65 hover:opacity-90",
      )}
      style={{
        boxShadow:
          "0 1px 0 rgba(24, 24, 27, 0.02), 0 4px 10px -6px rgba(24, 24, 27, 0.05)",
      }}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {/* Big time */}
        <div className="flex w-20 flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Hora
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
            {time}
          </span>
        </div>

        <div className="h-10 w-px bg-zinc-200/80" />

        {/* Customer */}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-zinc-900">
            <Ic.user />
            <span className="truncate">{row.customer_name}</span>
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span className="font-medium text-zinc-700">
              {row.party_size}p{row.tables ? ` · ${row.tables.label}` : ""}
            </span>
            {row.customer_phone ? (
              <a
                href={`tel:${row.customer_phone}`}
                className="inline-flex items-center gap-1 hover:text-zinc-900 hover:underline"
              >
                <Ic.phone />
                {row.customer_phone}
              </a>
            ) : null}
            {row.notes ? (
              <span className="truncate italic text-zinc-500">— {row.notes}</span>
            ) : null}
          </p>
        </div>

        {/* Status */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
            STATUS_RING[row.status],
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[row.status])} />
          {STATUS_LABEL[row.status]}
        </span>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {row.status === "confirmed" ? (
            <ActionPill
              onClick={() => onChangeStatus(row.id, "seated")}
              disabled={pending}
              tone="primary"
            >
              Sentar
            </ActionPill>
          ) : null}
          {row.status === "seated" ? (
            <ActionPill
              onClick={() => onChangeStatus(row.id, "completed")}
              disabled={pending}
              tone="primary"
            >
              Completar
            </ActionPill>
          ) : null}
          {row.status === "confirmed" ? (
            <>
              <ActionPill
                onClick={() => onChangeStatus(row.id, "no_show")}
                disabled={pending}
              >
                No vino
              </ActionPill>
              <ActionPill
                onClick={() => onChangeStatus(row.id, "cancelled")}
                disabled={pending}
                tone="danger"
              >
                Cancelar
              </ActionPill>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function ActionPill({
  children,
  onClick,
  disabled,
  tone = "ghost",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "ghost" | "primary" | "danger";
}) {
  const styles =
    tone === "primary"
      ? "bg-zinc-900 text-white ring-zinc-900 hover:bg-zinc-800"
      : tone === "danger"
        ? "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50"
        : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-[11px] font-medium uppercase tracking-[0.12em] ring-1 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] disabled:opacity-50",
        styles,
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const message =
    filter === "all"
      ? "No hay reservas para esta fecha."
      : filter === "upcoming"
        ? "No hay reservas próximas."
        : filter === "seated"
          ? "Nadie sentado en este momento."
          : "Sin reservas pasadas hoy.";
  return (
    <div
      className="rounded-2xl bg-white p-12 text-center ring-1 ring-dashed ring-zinc-300"
      style={{
        boxShadow: "0 1px 0 rgba(24, 24, 27, 0.02)",
      }}
    >
      <div
        className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200"
        aria-hidden
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-700">{message}</p>
      <p className="mt-1 text-xs text-zinc-500">
        Probá saltar a otra fecha o cambiar el filtro.
      </p>
    </div>
  );
}
