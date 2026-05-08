"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw, Wallet } from "lucide-react";

import {
  Surface,
  SurfaceHeader,
} from "@/components/admin/shell/page-shell";
import type { ActiveTurnoView, TurnoLiveStats } from "@/lib/caja/types";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  initialTurnos: ActiveTurnoView[];
  cerradosHoy: ActiveTurnoView[];
};

export function CajaAdminBoard({ slug, initialTurnos, cerradosHoy }: Props) {
  const [turnos] = useState(initialTurnos);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statsByTurno, setStatsByTurno] = useState<
    Record<string, TurnoLiveStats | null>
  >({});

  // Polling global de stats (cada 30s, refrescando todos los turnos abiertos
  // a la vez). Cuando uno cambia, actualizamos los KPIs agregados.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        turnos.map(async (t) => {
          try {
            const res = await fetch(`/api/caja/stats?turno=${t.id}`);
            const data = await res.json();
            return [t.id, data?.stats ?? null] as const;
          } catch {
            return [t.id, null] as const;
          }
        }),
      );
      if (!cancelled) {
        setStatsByTurno(Object.fromEntries(entries));
      }
    };
    load();
    const i = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [turnos, refreshKey]);

  // KPIs agregados del día (abiertos + cerrados).
  const kpis = useMemo(() => {
    const liveVentas = Object.values(statsByTurno).reduce(
      (acc, s) => acc + (s?.total_ventas_cents ?? 0),
      0,
    );
    const livePropinas = Object.values(statsByTurno).reduce(
      (acc, s) => acc + (s?.total_propinas_cents ?? 0),
      0,
    );
    const liveCobros = Object.values(statsByTurno).reduce(
      (acc, s) => acc + (s?.cobros_count ?? 0),
      0,
    );

    // Para los cerrados: usamos closing_cash_cents − opening_cash_cents como
    // proxy de "movimiento neto" si no tenemos breakdown. Diferencia se
    // muestra agregada también.
    const closedDiff = cerradosHoy.reduce(
      (acc, t) => acc + (t.difference_cents ?? 0),
      0,
    );

    return {
      ventasHoy: liveVentas,
      propinasHoy: livePropinas,
      cobrosHoy: liveCobros,
      turnosAbiertos: turnos.length,
      turnosCerrados: cerradosHoy.length,
      diferenciaAcumulada: closedDiff,
    };
  }, [statsByTurno, turnos.length, cerradosHoy]);

  return (
    <div className="space-y-5">
      {/* KPIs del día */}
      <Surface tone="subtle" padding="default" className="space-y-4">
        <div className="flex items-center justify-between">
          <SurfaceHeader
            eyebrow="Hoy"
            title="Resumen de caja"
            description={
              kpis.turnosAbiertos > 0
                ? `${kpis.turnosAbiertos} ${kpis.turnosAbiertos === 1 ? "turno abierto" : "turnos abiertos"} · ${kpis.turnosCerrados} cerrados`
                : kpis.turnosCerrados > 0
                  ? `${kpis.turnosCerrados} ${kpis.turnosCerrados === 1 ? "turno cerrado" : "turnos cerrados"} hoy`
                  : "Todavía no hay actividad de caja hoy"
            }
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex size-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Refrescar"
            >
              <RefreshCw className="size-3.5" />
            </button>
            <Link
              href={`/${slug}/caja`}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
            >
              <ExternalLink className="size-3.5" />
              Operar caja
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCell
            label="Ventas"
            value={formatCurrency(kpis.ventasHoy)}
            hint="acumulado en abiertos"
          />
          <KpiCell
            label="Propinas"
            value={formatCurrency(kpis.propinasHoy)}
            hint="acumulado en abiertos"
          />
          <KpiCell label="Cobros" value={String(kpis.cobrosHoy)} />
          <KpiCell
            label="Diferencia"
            value={formatCurrency(Math.abs(kpis.diferenciaAcumulada))}
            hint={
              kpis.diferenciaAcumulada === 0
                ? "sin diferencia"
                : kpis.diferenciaAcumulada > 0
                  ? "sobrante neto"
                  : "faltante neto"
            }
            tone={
              kpis.diferenciaAcumulada === 0
                ? "default"
                : kpis.diferenciaAcumulada > 0
                  ? "warning"
                  : "danger"
            }
          />
        </div>
      </Surface>

      {/* Turnos abiertos */}
      {turnos.length > 0 && (
        <Surface padding="default" className="space-y-4">
          <SurfaceHeader
            eyebrow="En vivo"
            title="Turnos abiertos"
            description="Stats vivos de cada caja en operación. Refresco cada 30 segundos."
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {turnos.map((t) => (
              <TurnoStatsCard
                key={t.id}
                turno={t}
                stats={statsByTurno[t.id] ?? null}
              />
            ))}
          </div>
        </Surface>
      )}

      {/* Turnos cerrados hoy */}
      {cerradosHoy.length > 0 && (
        <Surface padding="default" className="space-y-4">
          <SurfaceHeader
            eyebrow="Cerrados"
            title={`${cerradosHoy.length} ${cerradosHoy.length === 1 ? "turno cerrado" : "turnos cerrados"} hoy`}
            description="Snapshot de cada cierre con su diferencia."
          />
          <ul className="divide-y divide-zinc-100 rounded-xl ring-1 ring-zinc-200/70">
            {cerradosHoy.map((t, idx) => (
              <ClosedTurnoRow
                key={t.id}
                turno={t}
                stripe={idx % 2 === 1}
              />
            ))}
          </ul>
        </Surface>
      )}

      {/* Empty global */}
      {turnos.length === 0 && cerradosHoy.length === 0 && (
        <Surface className="text-center" padding="default">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100">
              <Wallet className="size-6 text-zinc-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900">
                Sin actividad de caja
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                Cuando algún encargado abra un turno, lo vas a ver acá en vivo.
              </p>
            </div>
            <Link
              href={`/${slug}/caja`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <ExternalLink className="size-4" /> Ir a caja
            </Link>
          </div>
        </Surface>
      )}
    </div>
  );
}

// ── KpiCell ─────────────────────────────────────────────────────

function KpiCell({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "danger";
}) {
  const valueCls =
    tone === "danger"
      ? "text-rose-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-zinc-900";
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200/70">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight tabular-nums",
          valueCls,
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[0.65rem] text-zinc-500">{hint}</p>}
    </div>
  );
}

// ── TurnoStatsCard (turnos abiertos en vivo) ───────────────────

function TurnoStatsCard({
  turno,
  stats,
}: {
  turno: ActiveTurnoView;
  stats: TurnoLiveStats | null;
}) {
  const expected = stats?.expected_cash_cents ?? turno.opening_cash_cents;
  return (
    <article className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200/70">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {turno.encargado_name ?? "—"}
          </p>
          <h3 className="mt-0.5 text-base font-semibold tracking-tight text-zinc-900">
            {turno.caja_name}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-800">
          <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
          Abierto
        </span>
      </header>
      <div className="mt-3 space-y-1.5 text-sm">
        <RowSnapshot
          label="Apertura"
          value={formatCurrency(turno.opening_cash_cents)}
        />
        <RowSnapshot
          label="Cobros"
          value={String(stats?.cobros_count ?? 0)}
        />
        <RowSnapshot
          label="Ventas"
          value={formatCurrency(stats?.total_ventas_cents ?? 0)}
        />
        <RowSnapshot
          label="Propinas"
          value={formatCurrency(stats?.total_propinas_cents ?? 0)}
        />
      </div>
      <div className="mt-3 rounded-lg bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Efectivo esperado
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">
          {formatCurrency(expected)}
        </p>
      </div>
    </article>
  );
}

function RowSnapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-sm font-medium tabular-nums text-zinc-900">
        {value}
      </span>
    </div>
  );
}

// ── ClosedTurnoRow ─────────────────────────────────────────────

function ClosedTurnoRow({
  turno,
  stripe,
}: {
  turno: ActiveTurnoView;
  stripe: boolean;
}) {
  const diff = turno.difference_cents ?? 0;
  const diffTone =
    diff === 0
      ? "neutral"
      : Math.abs(diff) <= 100_000
        ? "warning"
        : "danger";
  const diffClasses =
    diffTone === "neutral"
      ? "bg-zinc-100 text-zinc-600"
      : diffTone === "warning"
        ? "bg-amber-50 text-amber-800"
        : "bg-rose-50 text-rose-800";

  const closedAt = turno.closed_at
    ? new Date(turno.closed_at).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        stripe ? "bg-zinc-50/50" : "bg-white",
      )}
    >
      <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <Wallet className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900">
          {turno.caja_name}
          <span className="ml-2 text-xs font-normal text-zinc-500">
            cerrado {closedAt}
          </span>
        </p>
        <p className="text-xs text-zinc-500">
          {turno.encargado_name ?? "—"} · esperado{" "}
          <span className="tabular-nums">
            {formatCurrency(turno.expected_cash_cents ?? 0)}
          </span>
          {" · contado "}
          <span className="tabular-nums">
            {formatCurrency(turno.closing_cash_cents ?? 0)}
          </span>
        </p>
        {turno.closing_notes && (
          <p className="mt-0.5 text-xs italic text-zinc-500">
            "{turno.closing_notes}"
          </p>
        )}
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold tabular-nums",
          diffClasses,
        )}
      >
        {diff === 0
          ? "OK"
          : `${diff > 0 ? "+" : "−"}${formatCurrency(Math.abs(diff))}`}
      </span>
    </li>
  );
}
