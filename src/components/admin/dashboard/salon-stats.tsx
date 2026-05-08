import { ArmchairIcon, Clock, UtensilsCrossed } from "lucide-react";

import { formatCurrency } from "@/lib/currency";
import type { SalonStats } from "@/lib/admin/reports-query";

function formatMinutes(m: number): string {
  if (m === 0) return "—";
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m - h * 60);
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

export function SalonStatsSection({ data }: { data: SalonStats }) {
  if (data.totalTables === 0) return null;

  const ticketDelta =
    data.todayDeliveryAverageTicketCents > 0
      ? ((data.todayDineInAverageTicketCents -
          data.todayDeliveryAverageTicketCents) /
          data.todayDeliveryAverageTicketCents) *
        100
      : null;

  const occupancyPct =
    data.totalTables > 0
      ? Math.round((data.openTables / data.totalTables) * 100)
      : 0;

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Salón · hoy
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Cómo va la operación en mesa
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-500" />
          {data.openTables} de {data.totalTables} mesas activas · {occupancyPct}%
        </span>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-zinc-50 p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <UtensilsCrossed className="size-3.5" strokeWidth={1.75} />
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em]">
              Pedidos en mesa
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-zinc-900">
            {data.todayDineInCount}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Ingresos en salón
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-zinc-900">
            {formatCurrency(data.todayDineInRevenueCents)}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Ticket promedio en mesa
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-zinc-900">
            {formatCurrency(data.todayDineInAverageTicketCents)}
          </p>
          {ticketDelta !== null ? (
            <p
              className={
                "mt-1 text-[0.65rem] font-semibold tabular-nums " +
                (ticketDelta > 0
                  ? "text-emerald-600"
                  : ticketDelta < 0
                    ? "text-rose-600"
                    : "text-zinc-500")
              }
            >
              {ticketDelta > 0 ? "+" : ""}
              {ticketDelta.toFixed(0)}% vs delivery
            </p>
          ) : null}
        </div>
        <div className="rounded-xl bg-zinc-50 p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="size-3.5" strokeWidth={1.75} />
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em]">
              Estadía promedio
            </p>
          </div>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-zinc-900">
            {formatMinutes(data.averageStayMinutes)}
          </p>
        </div>
      </div>

      {data.tableTurnover.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            <ArmchairIcon className="size-3.5" strokeWidth={1.75} />
            Mesas más rotadas hoy
          </p>
          <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {data.tableTurnover.map((t) => (
              <li
                key={t.tableLabel}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-zinc-900">
                  {t.tableLabel}
                  <span className="ml-1 text-xs text-zinc-500">
                    · {t.seats} sillas
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-zinc-900">
                  {t.turns}{" "}
                  <span className="text-xs font-medium text-zinc-500">
                    {t.turns === 1 ? "turno" : "turnos"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
