"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Receipt, Users, X } from "lucide-react";
import { toast } from "sonner";

import { FloorPlanViewer, type TableExtra } from "@/components/mozo/floor-plan-viewer";
import { updateTableOperationalStatus } from "@/lib/mozo/actions";
import type { FloorPlan, FloorTable, OperationalStatus } from "@/lib/reservations/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReservationForMozo = {
  id: string;
  table_id: string | null;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  starts_at: string;
  status: string;
  notes: string | null;
};

export type OrderForMozo = {
  id: string;
  order_number: number;
  table_id: string | null;
  delivery_type: string;
  total_cents: number;
  created_at: string;
  status: string;
};

type Props = {
  businessSlug: string;
  businessName: string;
  plan: Pick<FloorPlan, "width" | "height" | "background_image_url" | "background_opacity">;
  tables: FloorTable[];
  reservations: ReservationForMozo[];
  activeOrders: OrderForMozo[];
};

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OperationalStatus, string> = {
  libre: "Libre",
  ocupada: "Ocupada",
  esperando_pedido: "Esperando pedido",
  esperando_cuenta: "Pidió la cuenta",
  limpiar: "Por limpiar",
};

const STATUS_BADGE: Record<OperationalStatus, string> = {
  libre: "bg-zinc-100 text-zinc-600",
  ocupada: "bg-emerald-100 text-emerald-700",
  esperando_pedido: "bg-sky-100 text-sky-700",
  esperando_cuenta: "bg-amber-100 text-amber-700",
  limpiar: "bg-zinc-200 text-zinc-600",
};

const STATUS_DOT: Record<OperationalStatus, string> = {
  libre: "bg-zinc-300",
  ocupada: "bg-emerald-500",
  esperando_pedido: "bg-sky-500",
  esperando_cuenta: "bg-amber-500",
  limpiar: "bg-zinc-400",
};

const STATUS_LEFT_BORDER: Record<OperationalStatus, string> = {
  libre: "border-l-zinc-200",
  ocupada: "border-l-emerald-400",
  esperando_pedido: "border-l-sky-400",
  esperando_cuenta: "border-l-amber-400",
  limpiar: "border-l-zinc-300",
};

const ALL_STATUSES: OperationalStatus[] = [
  "libre",
  "ocupada",
  "esperando_pedido",
  "esperando_cuenta",
  "limpiar",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function minutesSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MozoClient({
  businessSlug,
  businessName,
  plan,
  tables,
  reservations,
  activeOrders,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<FloorTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [localTables, setLocalTables] = useState<FloorTable[]>(tables);

  useEffect(() => setLocalTables(tables), [tables]);

  // Polling cada 10 s
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(id);
  }, [router]);

  // Índices para lookup rápido
  const reservationByTable = Object.fromEntries(
    reservations.filter((r) => r.table_id).map((r) => [r.table_id!, r]),
  );
  const orderByTable = Object.fromEntries(
    activeOrders.filter((o) => o.table_id).map((o) => [o.table_id!, o]),
  );

  // Armar extras para el viewer
  const extras: Record<string, TableExtra> = {};
  for (const t of localTables) {
    const reservation = reservationByTable[t.id];
    const order = orderByTable[t.id];
    const minutesOpen = minutesSince(t.opened_at ?? undefined) ?? undefined;
    if (reservation || order || minutesOpen != null) {
      extras[t.id] = {
        reservation: reservation
          ? {
              customer_name: reservation.customer_name,
              party_size: reservation.party_size,
              starts_at: reservation.starts_at,
            }
          : undefined,
        order: order
          ? {
              order_number: order.order_number,
              total_cents: order.total_cents,
              delivery_type: order.delivery_type,
            }
          : undefined,
        minutesOpen,
      };
    }
  }

  const handleStatusChange = useCallback(
    async (tableId: string, newStatus: OperationalStatus) => {
      setLoading(true);
      setLocalTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                operational_status: newStatus,
                opened_at:
                  newStatus === "ocupada"
                    ? (t.opened_at ?? new Date().toISOString())
                    : newStatus === "libre"
                      ? null
                      : t.opened_at,
              }
            : t,
        ),
      );
      setSelected((prev) => (prev?.id === tableId ? { ...prev, operational_status: newStatus } : prev));

      const result = await updateTableOperationalStatus(tableId, newStatus, businessSlug);
      setLoading(false);
      if (!result.ok) {
        toast.error(result.error);
        setLocalTables(tables);
        return;
      }
      router.refresh();
    },
    [businessSlug, router, tables],
  );

  const active = localTables.filter((t) => t.status === "active");
  const ocupadas = active.filter(
    (t) => t.operational_status && t.operational_status !== "libre" && t.operational_status !== "limpiar",
  ).length;

  // Mesas activas para el sidebar
  const mesasActivas = active.filter(
    (t) => t.operational_status && t.operational_status !== "libre",
  );

  // Reservas sin mesa asignada o cuya mesa está libre (para el panel de "próximas")
  const reservasPendientes = reservations.filter(
    (r) => !r.table_id || (localTables.find((t) => t.id === r.table_id)?.operational_status ?? "libre") === "libre",
  );

  const selectedSync = selected ? (localTables.find((t) => t.id === selected.id) ?? selected) : null;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/90 px-6 py-3.5 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Salón · {businessName}
            </p>
            <h1 className="font-heading text-xl font-semibold">Vista Mozo</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Leyenda */}
            <div className="hidden gap-2 sm:flex">
              {ALL_STATUSES.map((s) => (
                <span key={s} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[s]}`}>
                  {STATUS_LABEL[s]}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">{ocupadas}</span>
              <span className="text-muted-foreground">/ {active.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="mx-auto grid max-w-[1400px] gap-5 px-6 py-5 lg:grid-cols-[1fr_300px]">
        {/* Floor plan */}
        <div>
          {active.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-20 text-center">
              <p className="text-muted-foreground">
                No hay mesas configuradas. Configurá el plano desde el panel de admin.
              </p>
            </div>
          ) : (
            <FloorPlanViewer
              plan={plan}
              tables={localTables}
              extras={extras}
              onTableClick={setSelected}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Mesas activas */}
          <div className="rounded-2xl bg-white ring-1 ring-zinc-200">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-heading text-sm font-semibold">Mesas activas</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">
                {mesasActivas.length}
              </span>
            </div>

            {mesasActivas.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin mesas ocupadas</p>
            ) : (
              <div className="p-2 space-y-1">
                {mesasActivas.map((t) => {
                  const reservation = reservationByTable[t.id];
                  const order = orderByTable[t.id];
                  const min = minutesSince(t.opened_at ?? undefined);
                  const opStatus = t.operational_status ?? "libre";
                  const isUrgent = opStatus === "esperando_cuenta";

                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className={`w-full rounded-xl border-l-4 bg-zinc-50 px-3 py-3 text-left transition hover:bg-zinc-100 ${STATUS_LEFT_BORDER[opStatus]}`}
                    >
                      {/* Fila 1: número + tiempo */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[opStatus]}`} />
                          <span className="font-heading text-base font-bold leading-none">
                            Mesa {t.label}
                          </span>
                          {order?.delivery_type === "qr" && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-bold text-amber-700">
                              QR
                            </span>
                          )}
                        </div>
                        {min != null && (
                          <span className={`flex items-center gap-0.5 text-sm font-bold tabular-nums ${isUrgent ? "text-amber-600" : "text-zinc-500"}`}>
                            <Clock className="h-3.5 w-3.5" />
                            {min}m
                          </span>
                        )}
                      </div>

                      {/* Fila 2: cliente + estado */}
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          {reservation ? (
                            <p className="truncate text-sm font-medium text-zinc-700">
                              {reservation.customer_name}
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                · {reservation.party_size}p
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">{STATUS_LABEL[opStatus]}</p>
                          )}
                        </div>
                        {order && (
                          <span className="shrink-0 text-sm font-semibold text-zinc-800">
                            {formatMoney(order.total_cents)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reservas pendientes de hoy */}
          {reservasPendientes.length > 0 && (
            <div className="rounded-2xl bg-white ring-1 ring-zinc-200">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="font-heading text-sm font-semibold">Reservas de hoy</h2>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">
                  {reservasPendientes.length}
                </span>
              </div>
              <div className="divide-y">
                {reservasPendientes.map((r) => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{r.customer_name}</p>
                      <p className="text-xs font-semibold text-indigo-600">{formatTime(r.starts_at)}</p>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" /> {r.party_size} personas
                      </span>
                      {r.notes && <span className="truncate">· {r.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Sheet de detalle de mesa */}
      {selectedSync && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-start sm:pt-20"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del sheet */}
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-xl font-semibold">Mesa {selectedSync.label}</h2>
                  {orderByTable[selectedSync.id]?.delivery_type === "qr" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                      QR
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[selectedSync.operational_status ?? "libre"]}`}>
                    {STATUS_LABEL[selectedSync.operational_status ?? "libre"]}
                  </span>
                  {selectedSync.opened_at && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {minutesSince(selectedSync.opened_at)} min abierta
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-1.5 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Reserva si existe */}
            {reservationByTable[selectedSync.id] && (
              <div className="border-b bg-indigo-50/60 px-5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">Reserva</p>
                <p className="mt-1 font-medium text-sm">{reservationByTable[selectedSync.id]!.customer_name}</p>
                <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {reservationByTable[selectedSync.id]!.party_size} personas
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(reservationByTable[selectedSync.id]!.starts_at)}
                  </span>
                  {reservationByTable[selectedSync.id]!.notes && (
                    <span className="italic">{reservationByTable[selectedSync.id]!.notes}</span>
                  )}
                </div>
              </div>
            )}

            {/* Orden activa si existe */}
            {orderByTable[selectedSync.id] && (
              <div className="border-b bg-emerald-50/60 px-5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Orden activa</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm font-medium">#{orderByTable[selectedSync.id]!.order_number}</p>
                  <p className="flex items-center gap-1 text-sm font-semibold text-zinc-800">
                    <Receipt className="h-3.5 w-3.5" />
                    {formatMoney(orderByTable[selectedSync.id]!.total_cents)}
                  </p>
                </div>
              </div>
            )}

            {/* Cambiar estado */}
            <div className="p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cambiar estado
              </p>
              <div className="space-y-2">
                {ALL_STATUSES.map((status) => {
                  const isCurrent = (selectedSync.operational_status ?? "libre") === status;
                  return (
                    <button
                      key={status}
                      disabled={loading || isCurrent}
                      onClick={() => handleStatusChange(selectedSync.id, status)}
                      className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition
                        ${isCurrent ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-100"}
                        disabled:cursor-default disabled:opacity-60`}
                    >
                      {STATUS_LABEL[status]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
