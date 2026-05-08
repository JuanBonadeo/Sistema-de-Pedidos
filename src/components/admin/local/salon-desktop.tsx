"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Ban,
  ClipboardList,
  Clock,
  Receipt,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AsignarMozosOverlay } from "@/components/mozo/asignar-mozos-overlay";
import { FloorPlanViewer } from "@/components/mozo/floor-plan-viewer";
import { TransferTableModal } from "@/components/mozo/transfer-table-modal";
import { WalkInModal } from "@/components/mozo/walk-in-modal";
import { Button } from "@/components/ui/button";
import type { BusinessRole } from "@/lib/admin/context";
import type { FloorPlanWithTables } from "@/lib/admin/floor-plan/queries";
import {
  anularMesa,
  updateTableOperationalStatus,
} from "@/lib/mozo/actions";
import type { MozoMember } from "@/lib/mozo/queries";
import {
  ALL_OPERATIONAL_STATUSES,
  canTransition,
  type OperationalStatus,
} from "@/lib/mozo/state-machine";
import { canAssignMozo, canTransitionMesa } from "@/lib/permissions/can";
import type { FloorTable } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

// ─── Types compartidos con la page (server) ────────────────────────────────

export type SalonOrderRef = {
  id: string;
  order_number: number;
  table_id: string | null;
  total_cents: number;
  created_at: string;
  status: string;
};

export type SalonReservationRef = {
  id: string;
  table_id: string | null;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  starts_at: string;
  status: string;
  notes: string | null;
};

// ─── Helpers de estado ──────────────────────────────────────────────────────

const STATUS_LABEL: Record<OperationalStatus, string> = {
  libre: "Libre",
  ocupada: "Ocupada",
  pidio_cuenta: "Pidió la cuenta",
};

const STATUS_COLORS: Record<
  OperationalStatus,
  { dot: string; bg: string; text: string }
> = {
  libre: { dot: "bg-zinc-300", bg: "bg-zinc-50", text: "text-zinc-600" },
  ocupada: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-800" },
  pidio_cuenta: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-800" },
};

const STATS_ORDER: OperationalStatus[] = ["libre", "ocupada", "pidio_cuenta"];

function minutesSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Componente principal ───────────────────────────────────────────────────

export function SalonDesktop({
  slug,
  businessId,
  floorPlans,
  dineInOrders,
  reservations,
  mozos,
  currentUserId,
  role,
}: {
  slug: string;
  businessId: string;
  floorPlans: FloorPlanWithTables[];
  dineInOrders: SalonOrderRef[];
  reservations: SalonReservationRef[];
  mozos: MozoMember[];
  currentUserId: string;
  role: BusinessRole;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Al entrar a la tab Salón, colapsamos el sidebar para ganar viewport.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("admin-sidebar-collapse"));
  }, []);

  // Polling 10s. `tables` no está en realtime (DT-004).
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(id);
  }, [router]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [walkInTableId, setWalkInTableId] = useState<string | null>(null);
  const [transferTableId, setTransferTableId] = useState<string | null>(null);
  const [anularPrompt, setAnularPrompt] = useState<{
    tableId: string;
    label: string;
  } | null>(null);
  const [anularReason, setAnularReason] = useState("");
  const [distribuirOpen, setDistribuirOpen] = useState(false);

  // ── Multi-salón ──
  // Selección persistida por business. Si el id guardado ya no existe (plano
  // borrado), caemos al primero.
  const storageKey = `salon_active_plan_${businessId}`;
  const [activePlanId, setActivePlanId] = useState<string>(
    () => floorPlans[0]?.plan.id ?? "",
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && floorPlans.some((p) => p.plan.id === stored)) {
        setActivePlanId(stored);
      } else if (floorPlans[0]) {
        setActivePlanId(floorPlans[0].plan.id);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  // Cuando floorPlans cambia (refresh), validar que activePlanId siga vivo.
  useEffect(() => {
    if (!floorPlans.some((p) => p.plan.id === activePlanId) && floorPlans[0]) {
      setActivePlanId(floorPlans[0].plan.id);
    }
  }, [floorPlans, activePlanId]);

  const setActivePlan = (id: string) => {
    setActivePlanId(id);
    setSelectedId(null); // limpiar selección al cambiar de salón
    try {
      localStorage.setItem(storageKey, id);
    } catch {
      // ignore
    }
  };

  // Plano + mesas del salón activo.
  const active = floorPlans.find((p) => p.plan.id === activePlanId) ?? floorPlans[0];
  const plan = active?.plan;
  const tables = active?.tables ?? [];
  const activeTables = useMemo(
    () => tables.filter((t) => t.status === "active"),
    [tables],
  );

  // Todas las tables (de todos los salones) para stats globales.
  const allActiveTables = useMemo(
    () => floorPlans.flatMap((fp) => fp.tables.filter((t) => t.status === "active")),
    [floorPlans],
  );

  // Stats globales (todos los salones del local). Da panorámica completa
  // independiente del salón que esté mirando el encargado.
  const stats = useMemo(() => {
    const out: Record<OperationalStatus, number> = {
      libre: 0,
      ocupada: 0,
      pidio_cuenta: 0,
    };
    for (const t of allActiveTables) {
      const s = (t.operational_status ?? "libre") as OperationalStatus;
      out[s] = (out[s] ?? 0) + 1;
    }
    return out;
  }, [allActiveTables]);

  const reservationByTable = useMemo(() => {
    const m: Record<string, SalonReservationRef> = {};
    for (const r of reservations) {
      if (r.table_id) m[r.table_id] = r;
    }
    return m;
  }, [reservations]);

  const orderByTable = useMemo(() => {
    const m: Record<string, SalonOrderRef> = {};
    for (const o of dineInOrders) {
      if (o.table_id) m[o.table_id] = o;
    }
    return m;
  }, [dineInOrders]);

  const mozoNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of mozos) {
      if (x.full_name) m.set(x.user_id, x.full_name);
    }
    return m;
  }, [mozos]);

  // ── Acciones server ──
  const handleStatusChange = useCallback(
    (tableId: string, status: OperationalStatus) => {
      startTransition(async () => {
        const r = await updateTableOperationalStatus(tableId, status, slug);
        if (!r.ok) toast.error(r.error);
        else router.refresh();
      });
    },
    [slug, router],
  );

  const handleAnular = useCallback(() => {
    if (!anularPrompt) return;
    const reason = anularReason.trim();
    if (!reason) {
      toast.error("Indicá el motivo.");
      return;
    }
    startTransition(async () => {
      const r = await anularMesa(anularPrompt.tableId, reason, slug);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Mesa anulada.");
      setAnularPrompt(null);
      setAnularReason("");
      router.refresh();
    });
  }, [anularPrompt, anularReason, slug, router]);

  // ── Selección ──
  const selected = selectedId
    ? (activeTables.find((t) => t.id === selectedId) ?? null)
    : null;

  // Extras para el FloorPlanViewer.
  const extras = useMemo(() => {
    const out: Record<
      string,
      {
        reservation?: { customer_name: string; party_size: number; starts_at: string };
        order?: { order_number: number; total_cents: number; delivery_type: string };
        minutesOpen?: number;
        mozoInitial?: string;
      }
    > = {};
    for (const t of activeTables) {
      const order = orderByTable[t.id];
      const reservation = reservationByTable[t.id];
      const mozoName = t.mozo_id ? mozoNameById.get(t.mozo_id) : null;
      out[t.id] = {
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
              delivery_type: "dine_in",
            }
          : undefined,
        minutesOpen: t.opened_at ? (minutesSince(t.opened_at) ?? undefined) : undefined,
        mozoInitial: mozoName ? mozoName.charAt(0).toUpperCase() : undefined,
      };
    }
    return out;
  }, [activeTables, orderByTable, reservationByTable, mozoNameById]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* ── Stats arriba (globales, todos los salones) ── */}
      <div className="flex items-start justify-between gap-3">
        <SalonStats stats={stats} total={allActiveTables.length} />
        {canAssignMozo(role) && (
          <button
            type="button"
            onClick={() => setDistribuirOpen(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            <Users className="size-3.5" />
            Distribuir mozos
          </button>
        )}
      </div>

      {/* ── Selector de salón (solo si hay >1) ── */}
      {floorPlans.length > 1 && (
        <SalonSelector
          plans={floorPlans}
          activeId={activePlanId}
          onSelect={setActivePlan}
        />
      )}

      {/* ── Layout split ── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Floor plan */}
        <div className="bg-card ring-border/60 min-h-0 overflow-hidden rounded-2xl ring-1">
          {plan ? (
            <FloorPlanViewer
              plan={plan}
              tables={tables}
              extras={extras}
              onTableClick={(t) => setSelectedId(t.id)}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-12 text-center">
              <p className="text-muted-foreground text-sm">
                No hay salones cargados.
              </p>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <aside className="bg-card ring-border/60 flex min-h-0 flex-col overflow-hidden rounded-2xl ring-1">
          {selected ? (
            <TableDetail
              table={selected}
              order={orderByTable[selected.id]}
              reservation={reservationByTable[selected.id]}
              mozoName={
                selected.mozo_id ? (mozoNameById.get(selected.mozo_id) ?? null) : null
              }
              role={role}
              currentUserId={currentUserId}
              slug={slug}
              pending={pending}
              onClose={() => setSelectedId(null)}
              onStatusChange={(s) => handleStatusChange(selected.id, s)}
              onWalkIn={() => setWalkInTableId(selected.id)}
              onTransfer={() => setTransferTableId(selected.id)}
              onAnular={() =>
                setAnularPrompt({ tableId: selected.id, label: selected.label })
              }
            />
          ) : (
            <ActiveTablesList
              tables={activeTables}
              orderByTable={orderByTable}
              reservationByTable={reservationByTable}
              mozoNameById={mozoNameById}
              onSelect={(id) => setSelectedId(id)}
            />
          )}
        </aside>
      </div>

      {/* ── Modales ── */}
      {walkInTableId && (
        <WalkInModal
          tableId={walkInTableId}
          tableLabel={
            tables.find((t) => t.id === walkInTableId)?.label ?? "?"
          }
          businessSlug={slug}
          onClose={() => setWalkInTableId(null)}
          onSuccess={() => {
            setWalkInTableId(null);
            router.refresh();
          }}
        />
      )}
      {transferTableId && (
        <TransferTableModal
          tableId={transferTableId}
          tableLabel={
            tables.find((t) => t.id === transferTableId)?.label ?? "?"
          }
          currentMozoId={
            tables.find((t) => t.id === transferTableId)?.mozo_id ?? null
          }
          mozos={mozos}
          businessSlug={slug}
          onClose={() => setTransferTableId(null)}
          onSuccess={() => {
            setTransferTableId(null);
            router.refresh();
          }}
        />
      )}

      {/* ── Anular mesa prompt ── */}
      {anularPrompt && (
        <div
          onClick={() => {
            setAnularPrompt(null);
            setAnularReason("");
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-zinc-900">
                Anular Mesa {anularPrompt.label}
              </h3>
              <button
                onClick={() => {
                  setAnularPrompt(null);
                  setAnularReason("");
                }}
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Cancela la orden activa con motivo. La mesa queda libre.
            </p>
            <textarea
              value={anularReason}
              onChange={(e) => setAnularReason(e.target.value.slice(0, 200))}
              placeholder="ej: cliente se fue, error de carga, ..."
              className="mt-3 block w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              rows={3}
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAnularPrompt(null);
                  setAnularReason("");
                }}
                disabled={pending}
              >
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={handleAnular}
                disabled={pending || !anularReason.trim()}
                className="flex-1"
              >
                Anular
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modo "pintura" para distribuir mozos */}
      <AsignarMozosOverlay
        open={distribuirOpen}
        onClose={() => setDistribuirOpen(false)}
        slug={slug}
        floorPlans={floorPlans}
        mozos={mozos}
        tables={allActiveTables}
      />
    </div>
  );
}

// ─── Selector de salón ─────────────────────────────────────────────────────

function SalonSelector({
  plans,
  activeId,
  onSelect,
}: {
  plans: FloorPlanWithTables[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bg-card ring-border/60 -mx-1 overflow-x-auto rounded-2xl px-1 ring-1">
      <div className="flex gap-1 p-1.5">
        {plans.map(({ plan, tables }) => {
          const activeMesas = tables.filter((t) => t.status === "active").length;
          const isActive = plan.id === activeId;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id)}
              aria-pressed={isActive}
              className={cn(
                "shrink-0 rounded-xl px-3 py-1.5 text-sm font-semibold transition active:scale-[0.97]",
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-700 hover:bg-zinc-100",
              )}
            >
              <span>{plan.name}</span>
              <span
                className={cn(
                  "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-zinc-200 text-zinc-700",
                )}
              >
                {activeMesas}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats ──────────────────────────────────────────────────────────────────

function SalonStats({
  stats,
  total,
}: {
  stats: Record<OperationalStatus, number>;
  total: number;
}) {
  return (
    <div className="bg-card ring-border/60 rounded-2xl p-3 ring-1">
      <div className="text-muted-foreground mb-2 flex items-center gap-2">
        <Users className="size-4" />
        <h3 className="text-xs font-bold uppercase tracking-wider">
          Estado del salón · {total} mesa{total === 1 ? "" : "s"} activas
        </h3>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {STATS_ORDER.map((s) => {
          const c = STATUS_COLORS[s];
          const count = stats[s] ?? 0;
          return (
            <div
              key={s}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2",
                c.bg,
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", c.dot)} />
                <span className={cn("truncate text-xs font-semibold", c.text)}>
                  {STATUS_LABEL[s]}
                </span>
              </div>
              <span className={cn("text-base font-bold tabular-nums", c.text)}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Lista lateral cuando no hay mesa seleccionada ──────────────────────────

function ActiveTablesList({
  tables,
  orderByTable,
  reservationByTable,
  mozoNameById,
  onSelect,
}: {
  tables: FloorTable[];
  orderByTable: Record<string, SalonOrderRef>;
  reservationByTable: Record<string, SalonReservationRef>;
  mozoNameById: Map<string, string>;
  onSelect: (id: string) => void;
}) {
  // Orden: pidio_cuenta primero (urgente), después ocupadas, después libres.
  const priority: Record<OperationalStatus, number> = {
    pidio_cuenta: 0,
    ocupada: 1,
    libre: 2,
  };
  const sorted = tables.slice().sort((a, b) => {
    const pa = priority[(a.operational_status ?? "libre") as OperationalStatus];
    const pb = priority[(b.operational_status ?? "libre") as OperationalStatus];
    if (pa !== pb) return pa - pb;
    return a.label.localeCompare(b.label);
  });

  return (
    <>
      <header className="border-border/60 flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-foreground text-sm font-bold tracking-tight">
          Mesas
        </h3>
        <span className="text-muted-foreground text-xs">
          Tocá una para ver detalle
        </span>
      </header>
      <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto">
        {sorted.length === 0 && (
          <li className="text-muted-foreground p-6 text-center text-sm">
            Sin mesas en el plano
          </li>
        )}
        {sorted.map((t) => {
          const status = (t.operational_status ?? "libre") as OperationalStatus;
          const c = STATUS_COLORS[status];
          const order = orderByTable[t.id];
          const reservation = reservationByTable[t.id];
          const mozoName = t.mozo_id ? mozoNameById.get(t.mozo_id) : null;
          const minutes = minutesSince(t.opened_at);

          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                className="hover:bg-muted/40 flex w-full items-start gap-3 px-4 py-2.5 text-left transition"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-sm",
                    c.bg,
                    c.text,
                  )}
                >
                  {t.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
                    <span className={cn("text-[11px] font-semibold", c.text)}>
                      {STATUS_LABEL[status]}
                    </span>
                    {minutes !== null && (
                      <span className="text-muted-foreground text-[11px] tabular-nums">
                        · {minutes}m
                      </span>
                    )}
                  </div>
                  {order && (
                    <p className="text-foreground text-xs">
                      #{order.order_number} ·{" "}
                      <span className="font-semibold tabular-nums">
                        {formatMoney(order.total_cents)}
                      </span>
                    </p>
                  )}
                  {reservation && !order && (
                    <p className="text-muted-foreground truncate text-xs">
                      Reserva · {reservation.customer_name} ·{" "}
                      {formatTime(reservation.starts_at)}
                    </p>
                  )}
                  {mozoName && (
                    <p className="text-muted-foreground/80 truncate text-[11px]">
                      Mozo: {mozoName}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ─── Detalle de mesa seleccionada ───────────────────────────────────────────

function TableDetail({
  table,
  order,
  reservation,
  mozoName,
  role,
  currentUserId,
  slug,
  pending,
  onClose,
  onStatusChange,
  onWalkIn,
  onTransfer,
  onAnular,
}: {
  table: FloorTable;
  order: SalonOrderRef | undefined;
  reservation: SalonReservationRef | undefined;
  mozoName: string | null;
  role: BusinessRole;
  currentUserId: string;
  slug: string;
  pending: boolean;
  onClose: () => void;
  onStatusChange: (s: OperationalStatus) => void;
  onWalkIn: () => void;
  onTransfer: () => void;
  onAnular: () => void;
}) {
  const status = (table.operational_status ?? "libre") as OperationalStatus;
  const c = STATUS_COLORS[status];
  const minutes = minutesSince(table.opened_at);

  const allowedTransitions = ALL_OPERATIONAL_STATUSES.filter(
    (s) =>
      s !== status &&
      canTransition(status, s) &&
      canTransitionMesa(role, status, s),
  );

  const canWalkIn = status === "libre";
  const canTransfer =
    status !== "libre" &&
    (role !== "mozo" || table.mozo_id === currentUserId);
  const canAnular =
    status === "ocupada" && canTransitionMesa(role, status, "libre");
  const canPedir = status === "ocupada" || status === "pidio_cuenta";
  // "Pedir cuenta" / "Cobrar mesa" requiere order activa: sin items
  // cargados no hay nada que cobrar.
  const canShowCuenta =
    !!order && (status === "ocupada" || status === "pidio_cuenta");

  return (
    <>
      <header className="border-border/60 flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
            Mesa
          </p>
          <h3 className="text-foreground text-2xl font-extrabold leading-none tracking-tight">
            {table.label}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                c.bg,
                c.text,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
              {STATUS_LABEL[status]}
            </span>
            {minutes !== null && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px] tabular-nums">
                <Clock className="h-3 w-3" />
                {minutes}m
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="hover:bg-muted/60 rounded-full p-1.5 text-zinc-500"
          aria-label="Cerrar detalle"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {/* Reserva */}
        {reservation && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
              Reserva
            </p>
            <p className="mt-1 font-semibold text-zinc-900">
              {reservation.customer_name}
            </p>
            <p className="text-xs text-zinc-600">
              {reservation.party_size} personas ·{" "}
              {formatTime(reservation.starts_at)}
            </p>
            {reservation.notes && (
              <p className="mt-1 text-xs italic text-zinc-600">
                {reservation.notes}
              </p>
            )}
          </div>
        )}

        {/* Orden activa */}
        {order && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Orden activa
            </p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-base font-bold text-zinc-900">
                #{order.order_number}
              </p>
              <p className="inline-flex items-center gap-1.5 text-base font-bold tabular-nums text-zinc-900">
                <Receipt className="h-4 w-4" />
                {formatMoney(order.total_cents)}
              </p>
            </div>
          </div>
        )}

        {/* Mozo */}
        {mozoName && (
          <div className="rounded-xl bg-zinc-50 p-3 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Mozo
            </p>
            <p className="mt-0.5 font-semibold text-zinc-900">{mozoName}</p>
          </div>
        )}

        {/* Transiciones de estado rápidas */}
        {allowedTransitions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
              Cambiar estado
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allowedTransitions.map((s) => {
                const cs = STATUS_COLORS[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStatusChange(s)}
                    disabled={pending}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition active:scale-[0.97] disabled:opacity-50",
                      cs.bg,
                      cs.text,
                      "ring-zinc-200 hover:ring-zinc-300",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", cs.dot)} />
                    {STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Acciones primarias en footer */}
      <div className="border-border/60 space-y-2 border-t p-3">
        {/* Acción primaria: el "siguiente paso natural" según estado.
            ocupada → Cargar pedido (default). pidio_cuenta → Cobrar mesa. */}
        {status === "pidio_cuenta" && canShowCuenta && (
          <Button
            className="h-11 w-full font-semibold"
            onClick={() =>
              (window.location.href = `/${slug}/mozo/mesa/${table.id}/cobrar`)
            }
          >
            <ClipboardList className="size-4" />
            Cobrar mesa
          </Button>
        )}
        {status !== "pidio_cuenta" && canPedir && (
          <Button
            className="h-11 w-full font-semibold"
            onClick={() =>
              (window.location.href = `/${slug}/mozo/mesa/${table.id}/pedir`)
            }
          >
            <ClipboardList className="size-4" />
            Cargar pedido
          </Button>
        )}
        {/* Acción secundaria contextual */}
        {status === "pidio_cuenta" && canPedir && (
          <Button
            variant="outline"
            className="h-11 w-full font-semibold"
            onClick={() =>
              (window.location.href = `/${slug}/mozo/mesa/${table.id}/pedir`)
            }
          >
            Volver a pedir
          </Button>
        )}
        {status !== "pidio_cuenta" && canShowCuenta && (
          <Button
            variant="outline"
            className="h-11 w-full font-semibold"
            onClick={() =>
              (window.location.href = `/${slug}/mozo/mesa/${table.id}/cuenta`)
            }
          >
            Pedir cuenta
          </Button>
        )}
        {canWalkIn && (
          <Button onClick={onWalkIn} disabled={pending} className="h-11 w-full font-semibold">
            <UserPlus className="size-4" />
            Sentar walk-in
          </Button>
        )}
        {canTransfer && (
          <Button
            onClick={onTransfer}
            disabled={pending}
            variant="outline"
            className="h-10 w-full"
          >
            <ArrowLeftRight className="size-4" />
            Transferir
          </Button>
        )}
        {canAnular && (
          <Button
            onClick={onAnular}
            disabled={pending}
            variant="outline"
            className="h-10 w-full text-red-700 hover:bg-red-50 hover:text-red-700"
          >
            <Ban className="size-4" />
            Anular mesa
          </Button>
        )}
      </div>
    </>
  );
}
