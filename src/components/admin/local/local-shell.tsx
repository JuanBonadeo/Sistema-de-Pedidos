"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CajaAdminBoard } from "@/components/admin/local/caja-admin-board";
import { ComandasKanban } from "@/components/admin/local/comandas-kanban";
import { SalonDesktop, type SalonOrderRef, type SalonReservationRef } from "@/components/admin/local/salon-desktop";
import { OrdersRealtimeBoard } from "@/components/admin/orders-realtime-board";
import type { LocalComanda, LocalStation } from "@/lib/admin/local-query";
import type { AdminOrder } from "@/lib/admin/orders-query";
import type { BusinessRole } from "@/lib/admin/context";
import type { FloorPlanWithTables } from "@/lib/admin/floor-plan/queries";
import type { ActiveTurnoView } from "@/lib/caja/types";
import type { MozoMember } from "@/lib/mozo/queries";
import { cn } from "@/lib/utils";

type Tab = "pedidos" | "comandas" | "salon" | "caja";

function isTab(v: string | null | undefined): v is Tab {
  return v === "pedidos" || v === "comandas" || v === "salon" || v === "caja";
}

function TabsInner({
  slug,
  businessId,
  timezone,
  initialOrders,
  initialComandas,
  stations,
  floorPlans,
  dineInOrders,
  reservations,
  mozos,
  currentUserId,
  role,
  cajaTurnos,
  cajaCerradosHoy,
}: {
  slug: string;
  businessId: string;
  timezone: string;
  initialOrders: AdminOrder[];
  initialComandas: LocalComanda[];
  stations: LocalStation[];
  floorPlans: FloorPlanWithTables[];
  dineInOrders: SalonOrderRef[];
  reservations: SalonReservationRef[];
  mozos: MozoMember[];
  currentUserId: string;
  role: BusinessRole;
  cajaTurnos: ActiveTurnoView[];
  cajaCerradosHoy: ActiveTurnoView[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const active: Tab = isTab(raw) ? raw : "pedidos";

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "pedidos") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : `?`, { scroll: false });
  };

  // Counters cheap — solo para la pill numérica del tab.
  const counts = useMemo(() => {
    const pedidosNuevos = initialOrders.filter((o) =>
      ["pending", "confirmed"].includes(o.status),
    ).length;
    const comandasActivas = initialComandas.filter(
      (c) => c.status !== "entregado",
    ).length;
    return {
      pedidos: pedidosNuevos,
      comandas: comandasActivas,
      salon: 0,
      caja: cajaTurnos.length,
    };
  }, [initialOrders, initialComandas, cajaTurnos.length]);

  const tabsBar = (
    <nav
      aria-label="Secciones del operativo"
      className="inline-flex rounded-2xl bg-white p-1 ring-1 ring-zinc-200/70"
    >
      <TabButton
        active={active === "pedidos"}
        onClick={() => setTab("pedidos")}
        count={counts.pedidos}
      >
        Pedidos online
      </TabButton>
      <TabButton
        active={active === "comandas"}
        onClick={() => setTab("comandas")}
        count={counts.comandas}
      >
        Comandas
      </TabButton>
      <TabButton
        active={active === "salon"}
        onClick={() => setTab("salon")}
        count={counts.salon}
      >
        Salón
      </TabButton>
      <TabButton
        active={active === "caja"}
        onClick={() => setTab("caja")}
        count={counts.caja}
      >
        Caja
      </TabButton>
    </nav>
  );

  // Tab Salón rompe el container del page para usar todo el viewport.
  // Se posiciona absolutamente con offset del sidebar collapsed (72px).
  // El SalonDesktop dispara `admin-sidebar-collapse` al mount para asegurar
  // el ancho mínimo del sidebar.
  if (active === "salon") {
    return (
      <div
        className="fixed inset-0 z-30 flex flex-col bg-zinc-50 transition-[left] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ left: "var(--admin-sidebar-width, 72px)" }}
      >
        <div className="border-border/60 flex items-center justify-between border-b bg-white/95 px-4 py-3 backdrop-blur">
          {tabsBar}
        </div>
        <div className="flex-1 overflow-auto p-4">
          <SalonDesktop
            slug={slug}
            businessId={businessId}
            floorPlans={floorPlans}
            dineInOrders={dineInOrders}
            reservations={reservations}
            mozos={mozos}
            currentUserId={currentUserId}
            role={role}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {tabsBar}

      <div>
        {active === "pedidos" && (
          <OrdersRealtimeBoard
            businessId={businessId}
            slug={slug}
            timezone={timezone}
            initialOrders={initialOrders}
          />
        )}
        {active === "comandas" && (
          <ComandasKanban
            slug={slug}
            businessId={businessId}
            initialComandas={initialComandas}
            stations={stations}
          />
        )}
        {active === "caja" && (
          <CajaAdminBoard
            slug={slug}
            initialTurnos={cajaTurnos}
            cerradosHoy={cajaCerradosHoy}
          />
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
        active ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900",
      )}
    >
      {children}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums",
          active
            ? "bg-white text-zinc-900 ring-1 ring-zinc-200"
            : "bg-zinc-100 text-zinc-500",
        )}
      >
        {count}
      </span>
    </button>
  );
}

export function LocalShell(props: {
  slug: string;
  businessId: string;
  timezone: string;
  initialOrders: AdminOrder[];
  initialComandas: LocalComanda[];
  stations: LocalStation[];
  floorPlans: FloorPlanWithTables[];
  dineInOrders: SalonOrderRef[];
  reservations: SalonReservationRef[];
  mozos: MozoMember[];
  currentUserId: string;
  role: BusinessRole;
  cajaTurnos: ActiveTurnoView[];
  cajaCerradosHoy: ActiveTurnoView[];
}) {
  return (
    <Suspense fallback={null}>
      <TabsInner {...props} />
    </Suspense>
  );
}
