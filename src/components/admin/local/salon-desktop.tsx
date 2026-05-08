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

import { FloorPlanViewer } from "@/components/mozo/floor-plan-viewer";
import { OrderSummaryCard } from "@/components/mozo/order-summary-card";
import { TransferTableModal } from "@/components/mozo/transfer-table-modal";
import { WalkInModal } from "@/components/mozo/walk-in-modal";
import { Button } from "@/components/ui/button";
import type { BusinessRole } from "@/lib/admin/context";
import type { FloorPlanWithTables } from "@/lib/admin/floor-plan/queries";
import { anularMesa } from "@/lib/mozo/actions";
import type { MozoMember } from "@/lib/mozo/queries";
import { type OperationalStatus } from "@/lib/mozo/state-machine";
import { canTransitionMesa } from "@/lib/permissions/can";
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
  customer_name: string | null;
  items: { product_name: string; quantity: number; cancelled_at: string | null }[];
  comandas: {
    id: string;
    batch: number;
    status: "pendiente" | "en_preparacion" | "entregado";
    station_name: string;
    emitted_at: string;
    delivered_at: string | null;
    items: { product_name: string; quantity: number }[];
  }[];
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

/**
 * Tiempo legible en jerga AR: "ahora", "5 min", "1h 20", "2h", "3 d".
 * Pensado para mostrar "hace cuánto que la mesa está abierta".
 *
 * Por encima de 24h pasamos a días — una mesa abierta hace 197h muestra
 * "8 d", no "197h 21".
 */
function formatRelativeTime(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest === 0 ? `${hours} h` : `${hours}h ${rest}`;
  }
  const days = Math.floor(hours / 24);
  return `${days} d`;
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
      {/* ── Selector de salón (solo si hay >1) ── */}
      {floorPlans.length > 1 && (
        <SalonSelector
          plans={floorPlans}
          activeId={activePlanId}
          onSelect={setActivePlan}
        />
      )}

      {/* ── Layout split: plano + sidebar ── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Columna del plano: viewer arriba + stats al pie */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="bg-card ring-border/60 min-h-0 flex-1 overflow-hidden rounded-2xl ring-1">
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
          <SalonStats stats={stats} total={allActiveTables.length} />
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
                Anular {anularPrompt.label}
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

      {/* El overlay "Distribuir mozos" vive en LocalShell para alinear el
          trigger con las tabs del header. No se monta acá. */}
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
      <div className="grid grid-cols-3 gap-2">
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
  // Agrupamos por estado para que el encargado vea: primero urgentes
  // (pidio_cuenta), después ocupadas, después libres con reserva próxima
  // y por último libres simples. Dentro de cada grupo, por label.
  const groups = useMemo(() => {
    const sorted = tables.slice().sort((a, b) => a.label.localeCompare(b.label));
    return {
      pidio_cuenta: sorted.filter(
        (t) => (t.operational_status ?? "libre") === "pidio_cuenta",
      ),
      ocupada: sorted.filter(
        (t) => (t.operational_status ?? "libre") === "ocupada",
      ),
      libre: sorted.filter(
        (t) => (t.operational_status ?? "libre") === "libre",
      ),
    };
  }, [tables]);

  // Libres con reserva próxima (próximas 2h) van al tope del grupo libre.
  const ahora = Date.now();
  const dosHoras = 2 * 60 * 60 * 1000;
  const libresOrdenadas = groups.libre.slice().sort((a, b) => {
    const ra = reservationByTable[a.id];
    const rb = reservationByTable[b.id];
    const aProxima =
      ra && new Date(ra.starts_at).getTime() - ahora < dosHoras;
    const bProxima =
      rb && new Date(rb.starts_at).getTime() - ahora < dosHoras;
    if (aProxima && !bProxima) return -1;
    if (!aProxima && bProxima) return 1;
    return a.label.localeCompare(b.label);
  });

  const renderGroup = (
    title: string,
    items: typeof tables,
    tone: OperationalStatus,
  ) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-1.5">
        <h4 className="px-4 pt-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {title} · {items.length}
        </h4>
        <ul>
          {items.map((t) => (
            <ActiveTableRow
              key={t.id}
              table={t}
              order={orderByTable[t.id]}
              reservation={reservationByTable[t.id]}
              mozoName={t.mozo_id ? mozoNameById.get(t.mozo_id) : null}
              minutes={minutesSince(t.opened_at)}
              tone={tone}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </section>
    );
  };

  const totalActivas = groups.pidio_cuenta.length + groups.ocupada.length;

  return (
    <>
      <header className="border-border/60 flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-foreground text-sm font-bold tracking-tight">
            Mesas
          </h3>
          <p className="text-muted-foreground text-[11px]">
            {totalActivas} {totalActivas === 1 ? "activa" : "activas"} · {tables.length} totales
          </p>
        </div>
        <span className="text-muted-foreground text-[11px]">
          Tocá para ver
        </span>
      </header>
      <div className="flex-1 overflow-y-auto pb-3">
        {tables.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Sin mesas en el plano
          </p>
        ) : (
          <>
            {renderGroup("Pidió la cuenta", groups.pidio_cuenta, "pidio_cuenta")}
            {renderGroup("Ocupadas", groups.ocupada, "ocupada")}
            {renderGroup("Libres", libresOrdenadas, "libre")}
          </>
        )}
      </div>
    </>
  );
}

// ─── Una fila de la lista lateral ──────────────────────────────────────────

function ActiveTableRow({
  table,
  order,
  reservation,
  mozoName,
  minutes,
  tone,
  onSelect,
}: {
  table: FloorTable;
  order: SalonOrderRef | undefined;
  reservation: SalonReservationRef | undefined;
  mozoName: string | null | undefined;
  minutes: number | null;
  tone: OperationalStatus;
  onSelect: (id: string) => void;
}) {
  // Color del border-left según estado.
  const borderClass: Record<OperationalStatus, string> = {
    libre: "border-l-zinc-200",
    ocupada: "border-l-emerald-500",
    pidio_cuenta: "border-l-amber-500",
  };
  const tiempo = formatRelativeTime(minutes);
  const partyName =
    reservation?.customer_name ??
    (order?.customer_name &&
    !["Mesa", "Walk-in", "-"].includes(order.customer_name.trim())
      ? order.customer_name
      : null);
  const activeItemsCount = order
    ? order.items
        .filter((it) => it.cancelled_at === null)
        .reduce((a, it) => a + it.quantity, 0)
    : 0;

  // Reserva próxima sobre mesa libre.
  const ahora = Date.now();
  const reservaProxima =
    tone === "libre" &&
    reservation &&
    new Date(reservation.starts_at).getTime() - ahora < 2 * 60 * 60 * 1000;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(table.id)}
        className={cn(
          "block w-full border-l-[3px] px-4 py-3 text-left transition hover:bg-zinc-50",
          borderClass[tone],
        )}
      >
        {/* Línea 1: label + tiempo a la derecha */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-heading truncate text-base font-bold tracking-tight text-zinc-900">
            {table.label}
          </span>
          {tiempo && (
            <span
              className={cn(
                "shrink-0 text-[11px] tabular-nums",
                tone === "pidio_cuenta"
                  ? "font-semibold text-amber-700"
                  : "text-zinc-500",
              )}
            >
              {tiempo}
            </span>
          )}
        </div>

        {/* Línea 2: nombre del comensal (si hay) */}
        {partyName && (
          <p className="mt-0.5 truncate text-xs font-medium text-zinc-700">
            {partyName}
            {reservation && (
              <span className="ml-1 text-[11px] font-normal text-zinc-500 tabular-nums">
                · {reservation.party_size}p
              </span>
            )}
          </p>
        )}

        {/* Línea 3: order info (si hay) */}
        {order && (
          <p className="mt-0.5 text-[11px] text-zinc-500">
            <span className="font-semibold tabular-nums text-zinc-700">
              {formatMoney(order.total_cents)}
            </span>
            {activeItemsCount > 0 && (
              <span className="text-zinc-400">
                {" · "}
                {activeItemsCount} {activeItemsCount === 1 ? "item" : "items"}
              </span>
            )}
          </p>
        )}

        {/* Línea 4: reserva próxima sobre mesa libre */}
        {reservaProxima && reservation && (
          <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
            <Clock className="size-2.5" />
            {formatTime(reservation.starts_at)} · {reservation.party_size}p
          </p>
        )}

        {/* Línea 5: mozo asignado, chip más liviano */}
        {mozoName && (
          <p className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
            <UserPlus className="size-2.5 flex-shrink-0" />
            <span className="truncate">{mozoName}</span>
          </p>
        )}
      </button>
    </li>
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
  onWalkIn: () => void;
  onTransfer: () => void;
  onAnular: () => void;
}) {
  const status = (table.operational_status ?? "libre") as OperationalStatus;
  const c = STATUS_COLORS[status];
  const minutes = minutesSince(table.opened_at);

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
  // ¿La mesa ya tiene items cargados? Decide si el botón primario es
  // "Cargar pedido" (vacía) o "Pedir cuenta" (con items, flujo natural).
  const hasItems =
    !!order && order.items.some((it) => it.cancelled_at === null);

  const tiempoLabel = formatRelativeTime(minutes);
  // Placeholders que enviarComanda usaba antes de que walk-in creara la
  // order con nombre real. Si vienen así los tratamos como "sin nombre".
  const PLACEHOLDER_CUSTOMER_NAMES = new Set(["Mesa", "Walk-in", "-"]);
  const orderName = order?.customer_name?.trim();
  const partyName =
    reservation?.customer_name ??
    (orderName && !PLACEHOLDER_CUSTOMER_NAMES.has(orderName)
      ? orderName
      : null);
  const partySize = reservation?.party_size ?? null;

  return (
    <>
      {/* Header limpio: Mesa N · estado · tiempo · avatar mozo · close. */}
      <header className="border-border/60 flex items-center gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-2xl font-extrabold leading-none tracking-tight">
            {table.label}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
            {tiempoLabel && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px] tabular-nums">
                <Clock className="h-3 w-3" />
                {tiempoLabel}
              </span>
            )}
            {mozoName && (
              <span className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                <UserPlus className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{mozoName}</span>
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="hover:bg-muted/60 flex-shrink-0 rounded-full p-1.5 text-zinc-500"
          aria-label="Cerrar detalle"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {/* Comensal: solo se muestra si hay reserva o nombre real cargado.
            Si es walk-in sin nombre, no agregamos un bloque vacío. */}
        {(partyName || reservation) && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl p-3 text-sm",
              reservation
                ? "border border-indigo-100 bg-indigo-50/60"
                : "bg-zinc-50",
            )}
          >
            <Users
              className={cn(
                "h-4 w-4 flex-shrink-0",
                reservation ? "text-indigo-600" : "text-zinc-500",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-900">
                {partyName}
                {partySize != null && (
                  <span className="ml-1.5 text-xs font-normal text-zinc-500 tabular-nums">
                    · {partySize}p
                  </span>
                )}
              </p>
              {reservation && (
                <p className="text-[11px] text-indigo-700 tabular-nums">
                  Reserva · {formatTime(reservation.starts_at)}
                </p>
              )}
            </div>
          </div>
        )}
        {reservation?.notes && (
          <p className="-mt-1 px-1 text-xs italic text-zinc-600">
            "{reservation.notes}"
          </p>
        )}

        {/* Orden + comandas con estado */}
        {order && <OrderSummaryCard order={order} slug={slug} />}
      </div>

      {/* Footer: jerarquía clara — primario grande, secundarios en grid,
          acción destructiva separada al final. */}
      <div className="border-border/60 space-y-2 border-t p-3">
        {/* Primario: depende del estado Y de si hay items cargados.
            - libre → Sentar walk-in.
            - pidio_cuenta → Cobrar mesa.
            - ocupada CON items → Pedir cuenta (flujo natural).
            - ocupada SIN items → Cargar pedido (acaba de sentarse). */}
        {(() => {
          // Mismo estilo que el drawer del mozo: h-14 rounded-2xl
          // emerald-600 con shadow. button HTML, no Button shadcn.
          const primaryClass =
            "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60";
          if (canWalkIn) {
            return (
              <button
                type="button"
                onClick={onWalkIn}
                disabled={pending}
                className={primaryClass}
              >
                <UserPlus className="h-5 w-5" />
                Sentar walk-in
              </button>
            );
          }
          if (status === "pidio_cuenta" && canShowCuenta) {
            return (
              <button
                type="button"
                disabled={pending}
                className={primaryClass}
                onClick={() =>
                  (window.location.href = `/${slug}/mozo/mesa/${table.id}/cobrar`)
                }
              >
                <Receipt className="h-5 w-5" />
                Cobrar mesa
              </button>
            );
          }
          if (hasItems && canShowCuenta) {
            return (
              <button
                type="button"
                disabled={pending}
                className={primaryClass}
                onClick={() =>
                  (window.location.href = `/${slug}/mozo/mesa/${table.id}/cuenta`)
                }
              >
                <Receipt className="h-5 w-5" />
                Pedir cuenta
              </button>
            );
          }
          if (canPedir) {
            return (
              <button
                type="button"
                disabled={pending}
                className={primaryClass}
                onClick={() =>
                  (window.location.href = `/${slug}/mozo/mesa/${table.id}/pedir`)
                }
              >
                <ClipboardList className="h-5 w-5" />
                Cargar pedido
              </button>
            );
          }
          return null;
        })()}

        {/* Secundarios. Si solo hay 1 secundario, ocupa full width (no
            queda colgado a media columna). Si hay 2+, grid 2-cols. */}
        {(() => {
          const showVolverAPedir = status === "pidio_cuenta" && canPedir;
          const showCargarMas = status === "ocupada" && hasItems && canPedir;
          const showPedirCuentaSec =
            status === "ocupada" && !hasItems && canShowCuenta;
          const buttons: React.ReactNode[] = [];
          if (showVolverAPedir) {
            buttons.push(
              <button
                key="volver"
                type="button"
                onClick={() =>
                  (window.location.href = `/${slug}/mozo/mesa/${table.id}/pedir`)
                }
                disabled={pending}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 active:scale-[0.97] disabled:opacity-60"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Volver a pedir
              </button>,
            );
          }
          if (showCargarMas) {
            buttons.push(
              <button
                key="cargar-mas"
                type="button"
                onClick={() =>
                  (window.location.href = `/${slug}/mozo/mesa/${table.id}/pedir`)
                }
                disabled={pending}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100 active:scale-[0.97] disabled:opacity-60"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Cargar más
              </button>,
            );
          }
          if (showPedirCuentaSec) {
            buttons.push(
              <button
                key="pedir-cuenta"
                type="button"
                onClick={() =>
                  (window.location.href = `/${slug}/mozo/mesa/${table.id}/cuenta`)
                }
                disabled={pending}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100 active:scale-[0.97] disabled:opacity-60"
              >
                <Receipt className="h-3.5 w-3.5" />
                Pedir cuenta
              </button>,
            );
          }
          if (canTransfer) {
            buttons.push(
              <button
                key="transferir"
                type="button"
                onClick={onTransfer}
                disabled={pending}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-sky-50 px-3 text-sm font-semibold text-sky-800 ring-1 ring-sky-200 transition hover:bg-sky-100 active:scale-[0.97] disabled:opacity-60"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Transferir
              </button>,
            );
          }
          if (buttons.length === 0) return null;
          if (buttons.length === 1) {
            // Solo un botón → full width, sin grid.
            return <div>{buttons[0]}</div>;
          }
          return (
            <div className="grid grid-cols-2 gap-2">
              {buttons}
            </div>
          );
        })()}

        {/* Destructiva: full-width, separada del grid operativo */}
        {canAnular && (
          <button
            type="button"
            onClick={onAnular}
            disabled={pending}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 active:scale-[0.97] disabled:opacity-60"
          >
            <Ban className="h-3.5 w-3.5" />
            Anular
          </button>
        )}
      </div>
    </>
  );
}
