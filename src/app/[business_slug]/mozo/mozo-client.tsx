"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Ban,
  Banknote,
  CalendarCheck,
  Check,
  ClipboardList,
  Clock,
  LogOut,
  Receipt,
  Settings,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import type { BusinessRole } from "@/lib/admin/context";
import { AsignarMozosOverlay } from "@/components/mozo/asignar-mozos-overlay";
import { MobileTabBar, type MozoTab } from "@/components/mozo/mobile-tab-bar";
import { TableDrawer } from "@/components/mozo/table-drawer";
import { TransferTableModal } from "@/components/mozo/transfer-table-modal";
import { WalkInModal } from "@/components/mozo/walk-in-modal";
import {
  anularMesa,
  assignMozoToTable,
  updateTableOperationalStatus,
  volverAPedir,
} from "@/lib/mozo/actions";
import type { MozoMember } from "@/lib/mozo/queries";
import {
  ALL_OPERATIONAL_STATUSES,
  canTransition,
  type OperationalStatus,
} from "@/lib/mozo/state-machine";
import { markAllRead, markRead } from "@/lib/notifications/actions";
import type { Notification } from "@/lib/notifications/queries";
import { canAssignMozo, canTransitionMesa } from "@/lib/permissions/can";
import type { FloorPlanWithTables } from "@/lib/admin/floor-plan/queries";
import type { FloorTable } from "@/lib/reservations/types";

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
  businessId: string;
  /** Todos los floor_plans del business con sus tables. El mozo elige cuál
   *  ver en la pestaña Salón (selector si hay >1). La vista no muestra el
   *  plano SVG (mobile-first) — solo la lista de mesas. */
  floorPlans: FloorPlanWithTables[];
  reservations: ReservationForMozo[];
  activeOrders: OrderForMozo[];
  mozos: MozoMember[];
  currentUserId: string;
  role: BusinessRole;
  initialNotifications: Notification[];
  initialUnreadCount: number;
};

// ─── Config visual ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OperationalStatus, string> = {
  libre: "Libre",
  ocupada: "Ocupada",
  pidio_cuenta: "Pidió la cuenta",
};

const STATUS_DOT: Record<OperationalStatus, string> = {
  libre: "bg-zinc-300",
  ocupada: "bg-emerald-500",
  pidio_cuenta: "bg-amber-500",
};

const STATUS_PILL: Record<OperationalStatus, string> = {
  libre: "bg-zinc-100 text-zinc-700",
  ocupada: "bg-emerald-100 text-emerald-800",
  pidio_cuenta: "bg-amber-100 text-amber-800",
};

const STATUS_BORDER: Record<OperationalStatus, string> = {
  libre: "border-l-zinc-200",
  ocupada: "border-l-emerald-500",
  pidio_cuenta: "border-l-amber-500",
};

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

function initialsFromName(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "??";
}

function relativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function describeNotif(n: Notification): { title: string; body: string } {
  if (n.type === "mesa.transferred") {
    const p = n.payload as {
      tableLabel?: string;
      fromName?: string | null;
      toName?: string | null;
      reason?: string | null;
    };
    return {
      title: `Mesa ${p.tableLabel ?? "?"} transferida`,
      body: [
        p.fromName ? `de ${p.fromName}` : null,
        p.toName ? `a ${p.toName}` : null,
        p.reason ? `· ${p.reason}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    };
  }
  if (n.type === "mesa.cancelled") {
    const p = n.payload as { tableLabel?: string; reason?: string };
    return {
      title: `Mesa ${p.tableLabel ?? "?"} anulada`,
      body: p.reason ?? "",
    };
  }
  return { title: n.type, body: "" };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MozoClient({
  businessSlug,
  businessName,
  businessId,
  floorPlans,
  reservations,
  activeOrders,
  mozos,
  currentUserId,
  role,
  initialNotifications,
  initialUnreadCount,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MozoTab>("salon");
  const [selected, setSelected] = useState<FloorTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [walkInTableId, setWalkInTableId] = useState<string | null>(null);
  const [transferTableId, setTransferTableId] = useState<string | null>(null);
  const [anularPrompt, setAnularPrompt] = useState<{
    tableId: string;
    label: string;
  } | null>(null);
  const [anularReason, setAnularReason] = useState("");
  const [distribuirOpen, setDistribuirOpen] = useState(false);

  // ── Multi-salón ──
  const planStorageKey = `mozo_active_plan_${businessId}`;
  const [activePlanId, setActivePlanId] = useState<string>(
    () => floorPlans[0]?.plan.id ?? "",
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(planStorageKey);
      if (stored && floorPlans.some((p) => p.plan.id === stored)) {
        setActivePlanId(stored);
      } else if (floorPlans[0]) {
        setActivePlanId(floorPlans[0].plan.id);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planStorageKey]);
  useEffect(() => {
    if (!floorPlans.some((p) => p.plan.id === activePlanId) && floorPlans[0]) {
      setActivePlanId(floorPlans[0].plan.id);
    }
  }, [floorPlans, activePlanId]);

  const setActivePlan = (id: string) => {
    setActivePlanId(id);
    setSelected(null);
    try {
      localStorage.setItem(planStorageKey, id);
    } catch {
      // ignore
    }
  };

  // Tablas del salón activo. localTables guarda el optimistic update interno
  // (las acciones de mozo lo mutan en mem antes del refresh).
  const tables = useMemo(
    () =>
      floorPlans.find((p) => p.plan.id === activePlanId)?.tables ?? [],
    [floorPlans, activePlanId],
  );
  const [localTables, setLocalTables] = useState<FloorTable[]>(tables);
  useEffect(() => setLocalTables(tables), [tables]);

  // Polling cada 10 s
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(id);
  }, [router]);

  // ── Derived ──
  const mozoNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of mozos) {
      if (x.full_name) m.set(x.user_id, x.full_name);
    }
    return m;
  }, [mozos]);

  const myName =
    mozoNameById.get(currentUserId) ??
    mozos.find((m) => m.user_id === currentUserId)?.full_name ??
    "Mozo";
  const myInitials = initialsFromName(myName);

  const reservationByTable = useMemo(
    () =>
      Object.fromEntries(
        reservations.filter((r) => r.table_id).map((r) => [r.table_id!, r]),
      ),
    [reservations],
  );
  const orderByTable = useMemo(
    () =>
      Object.fromEntries(
        activeOrders.filter((o) => o.table_id).map((o) => [o.table_id!, o]),
      ),
    [activeOrders],
  );

  const active = localTables.filter((t) => t.status === "active");

  const myTables = active.filter(
    (t) =>
      t.mozo_id === currentUserId &&
      (t.operational_status ?? "libre") !== "libre",
  );
  const ocupadas = active.filter(
    (t) => t.operational_status && t.operational_status !== "libre",
  ).length;


  // ── Handlers ──
  const handleStatusChange = useCallback(
    async (tableId: string, newStatus: OperationalStatus) => {
      setLoading(true);
      const prevSnapshot = localTables;
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
      setSelected((prev) =>
        prev?.id === tableId ? { ...prev, operational_status: newStatus } : prev,
      );
      const result = await updateTableOperationalStatus(
        tableId,
        newStatus,
        businessSlug,
      );
      setLoading(false);
      if (!result.ok) {
        toast.error(result.error);
        setLocalTables(prevSnapshot);
        return;
      }
      router.refresh();
    },
    [businessSlug, router, localTables],
  );

  const handleAssignMozo = useCallback(
    async (tableId: string, mozoId: string | null) => {
      setLoading(true);
      const result = await assignMozoToTable(tableId, mozoId, businessSlug);
      setLoading(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(mozoId ? "Mozo asignado." : "Mesa sin asignar.");
      router.refresh();
    },
    [businessSlug, router],
  );

  const handleAnular = useCallback(async () => {
    if (!anularPrompt) return;
    const reason = anularReason.trim();
    if (!reason) {
      toast.error("Necesitamos un motivo.");
      return;
    }
    setLoading(true);
    const result = await anularMesa(anularPrompt.tableId, reason, businessSlug);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Mesa anulada.");
    setAnularPrompt(null);
    setAnularReason("");
    setSelected(null);
    router.refresh();
  }, [anularPrompt, anularReason, businessSlug, router]);

  const handleNotifClick = useCallback(
    async (n: Notification) => {
      if (!n.read_at) {
        await markRead(n.id, businessSlug);
        router.refresh();
      }
    },
    [businessSlug, router],
  );

  const handleMarkAllRead = useCallback(async () => {
    const r = await markAllRead(businessSlug);
    if (r.ok) router.refresh();
  }, [businessSlug, router]);

  // ── Drawer / sheet ──
  const selectedSync = selected
    ? (localTables.find((t) => t.id === selected.id) ?? selected)
    : null;
  const selectedStatus = (selectedSync?.operational_status ??
    "libre") as OperationalStatus;

  const allowedTransitions = selectedSync
    ? ALL_OPERATIONAL_STATUSES.filter(
        (s) =>
          s !== selectedStatus &&
          canTransition(selectedStatus, s) &&
          canTransitionMesa(role, selectedStatus, s),
      )
    : [];

  const canShowWalkInButton = !!selectedSync && selectedStatus === "libre";
  const canShowTransferButton =
    !!selectedSync &&
    selectedStatus !== "libre" &&
    (role !== "mozo" || selectedSync.mozo_id === currentUserId);
  const canShowAnularButton =
    !!selectedSync &&
    selectedStatus === "ocupada" &&
    canTransitionMesa(role, selectedStatus, "libre");
  const canShowPedirButton =
    !!selectedSync &&
    (selectedStatus === "ocupada" || selectedStatus === "pidio_cuenta");
  // "Pedir cuenta" / "Cobrar mesa" requiere order activa. Si la mesa está
  // ocupada por walk-in pero todavía no se cargó pedido, no hay nada que
  // cobrar — el botón no debería aparecer. Estado canónico: order existe en
  // `activeOrders` para esa mesa.
  const canShowCuentaButton =
    !!selectedSync &&
    !!orderByTable[selectedSync.id] &&
    (selectedStatus === "ocupada" || selectedStatus === "pidio_cuenta");

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-zinc-50 pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-md items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {businessName}
            </p>
            <h1 className="font-heading text-lg font-bold leading-tight tracking-tight text-zinc-900">
              {activeTab === "salon" && "Salón"}
              {activeTab === "mesas" && "Mis mesas"}
              {activeTab === "avisos" && "Avisos"}
              {activeTab === "yo" && "Mi cuenta"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {activeTab !== "yo" && (
              <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm">
                <Users className="h-3.5 w-3.5 text-zinc-500" />
                <span className="font-bold tabular-nums">{ocupadas}</span>
                <span className="text-zinc-500">/{active.length}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-md px-4 pt-4">
        {activeTab === "salon" && (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              {floorPlans.length > 1 ? (
                <MozoSalonSelector
                  plans={floorPlans}
                  activeId={activePlanId}
                  onSelect={setActivePlan}
                />
              ) : (
                <div />
              )}
              {canAssignMozo(role) && (
                <button
                  type="button"
                  onClick={() => setDistribuirOpen(true)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                >
                  <Users className="size-3.5" />
                  Distribuir mozos
                </button>
              )}
            </div>
            <SalonSection
              tables={localTables}
              reservationByTable={reservationByTable}
              orderByTable={orderByTable}
              mozoNameById={mozoNameById}
              currentUserId={currentUserId}
              onTableTap={setSelected}
              reservations={reservations}
            />
          </>
        )}
        {activeTab === "mesas" && (
          <MyTablesSection
            myTables={myTables}
            reservationByTable={reservationByTable}
            orderByTable={orderByTable}
            onTableTap={(t) => setSelected(t)}
          />
        )}
        {activeTab === "avisos" && (
          <AvisosSection
            notifications={initialNotifications}
            unreadCount={initialUnreadCount}
            onItemClick={handleNotifClick}
            onMarkAllRead={handleMarkAllRead}
          />
        )}
        {activeTab === "yo" && (
          <YoSection
            slug={businessSlug}
            name={myName}
            role={role}
            initials={myInitials}
            myActiveCount={myTables.length}
          />
        )}
      </main>

      <MobileTabBar
        active={activeTab}
        onChange={setActiveTab}
        unreadCount={initialUnreadCount}
        myActiveCount={myTables.length}
      />

      {/* Drawer de mesa */}
      <TableDrawer
        open={!!selectedSync}
        onClose={() => setSelected(null)}
        title={
          selectedSync ? (
            <span className="flex items-center gap-2">
              <span>Mesa {selectedSync.label}</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[selectedStatus]}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[selectedStatus]}`} />
                {STATUS_LABEL[selectedStatus]}
              </span>
            </span>
          ) : (
            ""
          )
        }
        subtitle={
          selectedSync?.opened_at ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {minutesSince(selectedSync.opened_at)} min abierta
            </span>
          ) : null
        }
        footer={
          selectedSync ? (
            <div className="space-y-2">
              {canShowWalkInButton && (
                <button
                  disabled={loading}
                  onClick={() => setWalkInTableId(selectedSync.id)}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
                >
                  <UserPlus className="h-5 w-5" />
                  Sentar walk-in
                </button>
              )}
              {/* Acción primaria: depende del estado.
                  - pidio_cuenta → "Cobrar mesa" (emerald) → /cobrar.
                  - ocupada → "Cargar pedido" (emerald) → /pedir. */}
              {selectedStatus === "pidio_cuenta" && canShowCuentaButton && (
                <button
                  disabled={loading}
                  onClick={() =>
                    router.push(
                      `/${businessSlug}/mozo/mesa/${selectedSync.id}/cobrar`,
                    )
                  }
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
                >
                  <ClipboardList className="h-5 w-5" />
                  Cobrar mesa
                </button>
              )}
              {selectedStatus !== "pidio_cuenta" && canShowPedirButton && (
                <button
                  disabled={loading}
                  onClick={() =>
                    router.push(
                      `/${businessSlug}/mozo/mesa/${selectedSync.id}/pedir`,
                    )
                  }
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
                >
                  <ClipboardList className="h-5 w-5" />
                  Cargar pedido
                </button>
              )}
              {/* Acción secundaria contextual */}
              {selectedStatus === "pidio_cuenta" && canShowPedirButton && (
                <button
                  disabled={loading}
                  onClick={async () => {
                    // Cliente se arrepintió: volvemos a `ocupada` y limpiamos
                    // `bill_requested_at` antes de navegar a `/pedir`.
                    const r = await volverAPedir(
                      selectedSync.id,
                      businessSlug,
                    );
                    if (!r.ok) {
                      toast.error(r.error);
                      return;
                    }
                    router.push(
                      `/${businessSlug}/mozo/mesa/${selectedSync.id}/pedir`,
                    );
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 text-base font-semibold text-zinc-700 transition active:scale-[0.98] disabled:opacity-60"
                >
                  <ClipboardList className="h-4 w-4" />
                  Volver a pedir
                </button>
              )}
              {selectedStatus !== "pidio_cuenta" && canShowCuentaButton && (
                <button
                  disabled={loading}
                  onClick={() =>
                    router.push(
                      `/${businessSlug}/mozo/mesa/${selectedSync.id}/cuenta`,
                    )
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-50 text-base font-semibold text-amber-700 ring-1 ring-amber-200 transition active:scale-[0.98] disabled:opacity-60"
                >
                  <ClipboardList className="h-4 w-4" />
                  Pedir cuenta
                </button>
              )}
              {canShowTransferButton && (
                <button
                  disabled={loading}
                  onClick={() => setTransferTableId(selectedSync.id)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-50 text-base font-semibold text-sky-700 ring-1 ring-sky-200 transition active:scale-[0.98] disabled:opacity-60"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Transferir mesa
                </button>
              )}
              {canShowAnularButton && (
                <button
                  disabled={loading}
                  onClick={() =>
                    setAnularPrompt({
                      tableId: selectedSync.id,
                      label: selectedSync.label,
                    })
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-base font-semibold text-red-700 ring-1 ring-red-200 transition active:scale-[0.98] disabled:opacity-60"
                >
                  <Ban className="h-4 w-4" />
                  Anular mesa
                </button>
              )}
            </div>
          ) : null
        }
      >
        {selectedSync && (
          <div className="space-y-4">
            {/* Reserva */}
            {reservationByTable[selectedSync.id] && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                  Reserva
                </p>
                <p className="mt-1 text-base font-semibold text-zinc-900">
                  {reservationByTable[selectedSync.id]!.customer_name}
                </p>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-zinc-600">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {reservationByTable[selectedSync.id]!.party_size} personas
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(
                      reservationByTable[selectedSync.id]!.starts_at,
                    )}
                  </span>
                </div>
                {reservationByTable[selectedSync.id]!.notes && (
                  <p className="mt-2 text-sm italic text-zinc-600">
                    {reservationByTable[selectedSync.id]!.notes}
                  </p>
                )}
              </div>
            )}

            {/* Orden activa */}
            {orderByTable[selectedSync.id] && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Orden activa
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-base font-semibold text-zinc-900">
                    #{orderByTable[selectedSync.id]!.order_number}
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-base font-bold tabular-nums text-zinc-900">
                    <Receipt className="h-4 w-4" />
                    {formatMoney(orderByTable[selectedSync.id]!.total_cents)}
                  </p>
                </div>
              </div>
            )}

            {/* Mozo asignado */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Mozo asignado
              </p>
              {canAssignMozo(role) ? (
                <select
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base"
                  value={selectedSync.mozo_id ?? ""}
                  disabled={loading}
                  onChange={(e) =>
                    handleAssignMozo(
                      selectedSync.id,
                      e.target.value === "" ? null : e.target.value,
                    )
                  }
                >
                  <option value="">— Sin asignar —</option>
                  {mozos.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name ?? m.user_id} ({m.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-3">
                  {selectedSync.mozo_id ? (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                        {initialsFromName(
                          mozoNameById.get(selectedSync.mozo_id) ?? "",
                        )}
                      </span>
                      <span className="text-sm font-medium text-zinc-800">
                        {mozoNameById.get(selectedSync.mozo_id) ?? "Asignado"}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-zinc-500">Sin asignar</span>
                  )}
                </div>
              )}
            </div>

            {/* Cambiar estado */}
            {allowedTransitions.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Cambiar estado
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {allowedTransitions.map((status) => (
                    <button
                      key={status}
                      disabled={loading}
                      onClick={() => handleStatusChange(selectedSync.id, status)}
                      className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-zinc-50 px-3 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 transition active:scale-[0.97] active:bg-zinc-100 disabled:opacity-50"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`}
                      />
                      {STATUS_LABEL[status]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </TableDrawer>

      {/* Walk-in modal */}
      {walkInTableId && (
        <WalkInModal
          tableId={walkInTableId}
          tableLabel={
            localTables.find((t) => t.id === walkInTableId)?.label ?? ""
          }
          businessSlug={businessSlug}
          onClose={() => setWalkInTableId(null)}
          onSuccess={() => {
            setWalkInTableId(null);
            setSelected(null);
            router.refresh();
          }}
        />
      )}

      {/* Transfer modal */}
      {transferTableId && (
        <TransferTableModal
          tableId={transferTableId}
          tableLabel={
            localTables.find((t) => t.id === transferTableId)?.label ?? ""
          }
          currentMozoId={
            localTables.find((t) => t.id === transferTableId)?.mozo_id ?? null
          }
          mozos={mozos}
          businessSlug={businessSlug}
          onClose={() => setTransferTableId(null)}
          onSuccess={() => {
            setTransferTableId(null);
            router.refresh();
          }}
        />
      )}

      {/* Anular prompt */}
      {anularPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => {
            setAnularPrompt(null);
            setAnularReason("");
          }}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 sm:hidden" />
            <h3 className="font-heading text-lg font-bold">
              Anular mesa {anularPrompt.label}
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Cancela las órdenes abiertas y libera la mesa. Queda en el audit log.
            </p>
            <textarea
              autoFocus
              className="mt-3 h-24 w-full rounded-xl border border-zinc-200 px-3 py-2 text-base"
              placeholder="Motivo (obligatorio)"
              value={anularReason}
              onChange={(e) => setAnularReason(e.target.value)}
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="h-12 rounded-2xl bg-zinc-100 text-base font-semibold text-zinc-700 transition active:scale-[0.98]"
                onClick={() => {
                  setAnularPrompt(null);
                  setAnularReason("");
                }}
              >
                Cancelar
              </button>
              <button
                className="h-12 rounded-2xl bg-red-600 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
                disabled={loading || !anularReason.trim()}
                onClick={handleAnular}
              >
                Anular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modo "pintura" para distribuir mozos */}
      <AsignarMozosOverlay
        open={distribuirOpen}
        onClose={() => setDistribuirOpen(false)}
        slug={businessSlug}
        floorPlans={floorPlans}
        mozos={mozos}
        tables={localTables}
      />
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

type SalonFilter = "todas" | OperationalStatus;

const FILTER_LABEL: Record<SalonFilter, string> = {
  todas: "Todas",
  libre: "Libres",
  ocupada: "Ocupadas",
  pidio_cuenta: "Cuenta",
};

const FILTER_ORDER: SalonFilter[] = [
  "todas",
  "libre",
  "ocupada",
  "pidio_cuenta",
];

// ─── Selector multi-salón (mobile) ──────────────────────────────────────────
function MozoSalonSelector({
  plans,
  activeId,
  onSelect,
}: {
  plans: FloorPlanWithTables[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="-mx-1 mb-3 overflow-x-auto px-1">
      <div className="flex gap-1.5">
        {plans.map(({ plan, tables }) => {
          const activeMesas = tables.filter((t) => t.status === "active").length;
          const isActive = plan.id === activeId;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-[0.96] ${
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200"
              }`}
            >
              {plan.name}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
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

function tableSortKey(label: string): [number, string] {
  // "1" < "2" < "10" → numérico cuando se puede, alfabético si no.
  const n = parseInt(label, 10);
  return [Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER, label];
}

function SalonSection({
  tables,
  reservationByTable,
  orderByTable,
  mozoNameById,
  currentUserId,
  onTableTap,
  reservations,
}: {
  tables: FloorTable[];
  reservationByTable: Record<string, ReservationForMozo>;
  orderByTable: Record<string, OrderForMozo>;
  mozoNameById: Map<string, string>;
  currentUserId: string;
  onTableTap: (t: FloorTable) => void;
  reservations: ReservationForMozo[];
}) {
  const [filter, setFilter] = useState<SalonFilter>("todas");

  const active = tables.filter((t) => t.status === "active");

  const counts = useMemo(() => {
    const c: Record<SalonFilter, number> = {
      todas: active.length,
      libre: 0,
      ocupada: 0,
      pidio_cuenta: 0,
    };
    for (const t of active) {
      const s = (t.operational_status ?? "libre") as OperationalStatus;
      c[s]++;
    }
    return c;
  }, [active]);

  const filtered = useMemo(() => {
    const list =
      filter === "todas"
        ? active
        : active.filter(
            (t) => (t.operational_status ?? "libre") === filter,
          );
    return [...list].sort((a, b) => {
      const [na, la] = tableSortKey(a.label);
      const [nb, lb] = tableSortKey(b.label);
      if (na !== nb) return na - nb;
      return la.localeCompare(lb);
    });
  }, [active, filter]);

  const reservasPendientes = reservations.filter(
    (r) =>
      !r.table_id ||
      (tables.find((t) => t.id === r.table_id)?.operational_status ??
        "libre") === "libre",
  );

  return (
    <div className="space-y-4">
      {/* Chips de filtro scroll horizontal */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2 whitespace-nowrap">
          {FILTER_ORDER.map((f) => {
            const isActive = filter === f;
            const dot = f === "todas" ? null : STATUS_DOT[f];
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition active:scale-95 ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-700 ring-1 ring-zinc-200 active:bg-zinc-50"
                }`}
              >
                {dot && <span className={`h-1.5 w-1.5 pt-1 rounded-full ${dot}`} />}
                {FILTER_LABEL[f]}
                <span
                  className={`tabular-nums ${
                    isActive ? "text-zinc-300" : "text-zinc-400"
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {active.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-10 text-center">
          <p className="text-sm text-zinc-500">
            No hay mesas configuradas. Configurá el plano desde el panel de admin.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-zinc-200">
          <p className="text-sm text-zinc-500">
            No hay mesas en estado "{FILTER_LABEL[filter]}" ahora.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((t) => {
            const status = (t.operational_status ?? "libre") as OperationalStatus;
            const min = minutesSince(t.opened_at ?? undefined);
            const order = orderByTable[t.id];
            const reservation = reservationByTable[t.id];
            const mozoName = t.mozo_id
              ? mozoNameById.get(t.mozo_id)
              : undefined;
            const mozoInitial = mozoName ? initialsFromName(mozoName) : null;
            const isMine = t.mozo_id === currentUserId;
            const isUrgent = status === "pidio_cuenta";

            // Línea principal: quién está, o capacidad si está libre.
            let primaryLine: React.ReactNode = null;
            let primaryClass = "text-zinc-700";
            if (status === "libre") {
              if (reservation) {
                primaryLine = (
                  <>
                    <span className="truncate">{reservation.customer_name}</span>
                  </>
                );
                primaryClass = "text-indigo-700";
              } else {
                primaryLine = (
                  <>
                    Para{" "}
                    <span className="tabular-nums">{t.seats}</span> personas
                  </>
                );
                primaryClass = "text-zinc-500";
              }
            } else if (reservation) {
              primaryLine = (
                <>
                  <span className="truncate">{reservation.customer_name}</span>
                  <span className="ml-1 text-zinc-500 tabular-nums">
                    · {reservation.party_size}p
                  </span>
                </>
              );
              primaryClass = "font-semibold text-zinc-800";
            } else {
              primaryLine = "Walk-in";
              primaryClass = "text-zinc-500";
            }

            return (
              <button
                key={t.id}
                onClick={() => onTableTap(t)}
                className={`relative flex flex-col rounded-2xl bg-white p-3 text-left ring-1 ring-zinc-200 transition active:scale-[0.97] active:bg-zinc-50 ${
                  isUrgent ? "ring-2 ring-amber-400" : ""
                }`}
              >
                {/* Header: dot + mozo */}
                <div className="flex items-start justify-between">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`}
                    aria-label={STATUS_LABEL[status]}
                  />
                  {mozoInitial && (
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        isMine
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                      title={mozoName}
                    >
                      {mozoInitial}
                    </span>
                  )}
                </div>

                {/* Número grande */}
                <div className="mt-2 font-heading text-3xl font-extrabold leading-none tracking-tight text-zinc-900">
                  {t.label}
                </div>

                {/* Estado */}
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {STATUS_LABEL[status]}
                </div>

                {/* Línea principal: cliente o capacidad */}
                <div
                  className={`mt-2 truncate text-xs ${primaryClass}`}
                >
                  {primaryLine}
                </div>

                {/* Reserva pendiente en mesa libre — línea extra */}
                {status === "libre" && reservation && (
                  <div className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-indigo-700">
                    <Clock className="h-2.5 w-2.5" />
                    {formatTime(reservation.starts_at)} · {reservation.party_size}p
                  </div>
                )}

                {/* Línea inferior: tiempo y total cuando aplica */}
                {(min != null && status !== "libre") || order ? (
                  <div className="mt-2 flex items-center gap-2 border-t border-zinc-100 pt-2 text-xs">
                    {min != null && status !== "libre" && (
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${
                          isUrgent ? "text-amber-600" : "text-zinc-600"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {min}m
                      </span>
                    )}
                    {order && (
                      <span className="ml-auto truncate font-bold tabular-nums text-zinc-800">
                        {formatMoney(order.total_cents)}
                      </span>
                    )}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {/* Reservas pendientes hoy */}
      {filter === "todas" && reservasPendientes.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            Reservas pendientes hoy
          </h2>
          <div className="space-y-2">
            {reservasPendientes.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-zinc-900">{r.customer_name}</p>
                  <p className="text-sm font-bold tabular-nums text-indigo-600">
                    {formatTime(r.starts_at)}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {r.party_size} personas
                  </span>
                  {r.notes && <span className="truncate">· {r.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MyTablesSection({
  myTables,
  reservationByTable,
  orderByTable,
  onTableTap,
}: {
  myTables: FloorTable[];
  reservationByTable: Record<string, ReservationForMozo>;
  orderByTable: Record<string, OrderForMozo>;
  onTableTap: (t: FloorTable) => void;
}) {
  if (myTables.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
          <Check className="h-10 w-10 text-zinc-400" />
        </div>
        <p className="mt-4 font-semibold text-zinc-900">No tenés mesas activas</p>
        <p className="mt-1 max-w-xs text-sm text-zinc-500">
          Cuando abras una mesa o te asignen una, aparece acá.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {myTables.map((t) => {
        const status = (t.operational_status ?? "libre") as OperationalStatus;
        const min = minutesSince(t.opened_at ?? undefined);
        const reservation = reservationByTable[t.id];
        const order = orderByTable[t.id];
        const isUrgent = status === "pidio_cuenta";
        return (
          <button
            key={t.id}
            onClick={() => onTableTap(t)}
            className={`block w-full rounded-2xl border-l-[6px] bg-white p-4 text-left ring-1 ring-zinc-200 transition active:scale-[0.99] active:bg-zinc-50 ${STATUS_BORDER[status]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-2xl font-extrabold leading-none tracking-tight text-zinc-900">
                    Mesa {t.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_PILL[status]}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`}
                    />
                    {STATUS_LABEL[status]}
                  </span>
                </div>
                {reservation ? (
                  <p className="mt-2 text-sm font-medium text-zinc-700">
                    {reservation.customer_name}
                    <span className="ml-1.5 text-xs font-normal text-zinc-500">
                      · {reservation.party_size}p
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">Walk-in</p>
                )}
              </div>
              {min != null && (
                <div className="shrink-0 text-right">
                  <div
                    className={`flex items-center justify-end gap-1 text-base font-bold tabular-nums ${
                      isUrgent ? "text-amber-600" : "text-zinc-900"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    {min}m
                  </div>
                  <div className="text-[10px] text-zinc-400">abierta</div>
                </div>
              )}
            </div>
            {order && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                <span className="text-xs text-zinc-500">
                  Orden #{order.order_number}
                </span>
                <span className="text-base font-bold tabular-nums text-zinc-900">
                  {formatMoney(order.total_cents)}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AvisosSection({
  notifications,
  unreadCount,
  onItemClick,
  onMarkAllRead,
}: {
  notifications: Notification[];
  unreadCount: number;
  onItemClick: (n: Notification) => void | Promise<void>;
  onMarkAllRead: () => void | Promise<void>;
}) {
  if (notifications.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
          <Check className="h-10 w-10 text-zinc-400" />
        </div>
        <p className="mt-4 font-semibold text-zinc-900">Sin avisos</p>
        <p className="mt-1 max-w-xs text-sm text-zinc-500">
          Las transferencias de mesa y otros avisos van a aparecer acá.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600">
            <span className="font-semibold">{unreadCount}</span> sin leer
          </p>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
          >
            Marcar todo leído
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {notifications.map((n) => {
          const { title, body } = describeNotif(n);
          const unread = !n.read_at;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onItemClick(n)}
                className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left ring-1 transition active:scale-[0.99] ${
                  unread
                    ? "bg-sky-50/60 ring-sky-200"
                    : "bg-white ring-zinc-200"
                }`}
              >
                <span
                  className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${
                    unread ? "bg-sky-500" : "bg-zinc-300"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900">{title}</p>
                  {body && (
                    <p className="mt-0.5 text-sm text-zinc-600">{body}</p>
                  )}
                  <p className="mt-1 text-xs text-zinc-400">
                    {relativeTime(n.created_at)}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function YoSection({
  slug,
  name,
  role,
  initials,
  myActiveCount,
}: {
  slug: string;
  name: string;
  role: BusinessRole;
  initials: string;
  myActiveCount: number;
}) {
  return (
    <div className="space-y-4">
      {/* Perfil */}
      <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-heading text-xl font-bold text-zinc-900">
              {name}
            </p>
            <p className="text-sm capitalize text-zinc-500">{role}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Mesas activas
            </p>
            <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums text-zinc-900">
              {myActiveCount}
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Turno
            </p>
            <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums text-zinc-900">
              —
            </p>
          </div>
        </div>
      </section>

      {/* Propinas (placeholder funcional) */}
      <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            <h2 className="font-heading text-base font-bold">Propinas hoy</h2>
          </div>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
            Pronto
          </span>
        </div>
        <p className="mt-3 font-heading text-3xl font-extrabold tabular-nums text-zinc-900">
          $0
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          El cálculo se activa cuando registres cobros con propina (Bloque 5).
        </p>
      </section>

      {/* Sueldo (placeholder) */}
      <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-zinc-600" />
            <h2 className="font-heading text-base font-bold">Mi sueldo</h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500">
            Próximamente
          </span>
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          Vas a poder ver el detalle de tu liquidación semanal acá.
        </p>
      </section>

      {/* Asistencias (placeholder) */}
      <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-zinc-600" />
            <h2 className="font-heading text-base font-bold">Mis asistencias</h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500">
            Próximamente
          </span>
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          Historial de turnos trabajados, faltas y horas extras.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-zinc-50 p-2.5 text-center">
            <p className="font-heading text-xl font-extrabold tabular-nums text-zinc-900">
              —
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Esta semana
            </p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-2.5 text-center">
            <p className="font-heading text-xl font-extrabold tabular-nums text-zinc-900">
              —
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Este mes
            </p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-2.5 text-center">
            <p className="font-heading text-xl font-extrabold tabular-nums text-zinc-900">
              —
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Hs. extra
            </p>
          </div>
        </div>
      </section>

      {/* Acciones */}
      <section className="rounded-3xl bg-white ring-1 ring-zinc-200">
        <a
          href={`/${slug}/admin`}
          className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 transition active:bg-zinc-50"
        >
          <span className="inline-flex items-center gap-3 text-base font-medium text-zinc-900">
            <Settings className="h-5 w-5 text-zinc-500" />
            Ir al panel admin
          </span>
          <span className="text-zinc-400">›</span>
        </a>
        <a
          href={`/${slug}/admin/login`}
          className="flex items-center justify-between px-5 py-4 transition active:bg-zinc-50"
        >
          <span className="inline-flex items-center gap-3 text-base font-medium text-red-600">
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </span>
          <span className="text-zinc-400">›</span>
        </a>
      </section>
    </div>
  );
}
