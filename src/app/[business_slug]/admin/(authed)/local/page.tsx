import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { LocalShell } from "@/components/admin/local/local-shell";
import type {
  SalonOrderRef,
  SalonReservationRef,
} from "@/components/admin/local/salon-desktop";
import { PageHeader, PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess } from "@/lib/admin/context";
import { getFloorPlansForBusiness } from "@/lib/admin/floor-plan/queries";
import { getActiveComandas, getStationsForLocal } from "@/lib/admin/local-query";
import { getTodayOrders } from "@/lib/admin/orders-query";
import { getActiveTurnos, getTurnosCerradosHoy } from "@/lib/caja/queries";
import { getMozosByBusiness } from "@/lib/mozo/queries";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

export default async function LocalEnVivoPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureAdminAccess(business.id, business_slug);
  // Gating: solo encargado / admin / platform admin. Mozo opera desde /mozo.
  if (
    !ctx.isPlatformAdmin &&
    ctx.role !== "admin" &&
    ctx.role !== "encargado"
  ) {
    redirect(`/${business_slug}/mozo`);
  }

  const service = createSupabaseServiceClient() as unknown as SupabaseClient;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [
    initialOrders,
    initialComandas,
    stations,
    floorPlans,
    { data: dineInOrders },
    { data: reservations },
    mozos,
    cajaTurnos,
    cajaCerradosHoy,
  ] = await Promise.all([
    getTodayOrders(business.id, business.timezone),
    getActiveComandas(business.id),
    getStationsForLocal(business.id),
    getFloorPlansForBusiness(business.id),
    // Mismo criterio que en /mozo: solo orders **abiertas** de mesa. Una
    // por mesa por el partial unique. Las cerradas ya no son "actuales".
    service
      .from("orders")
      .select("id, order_number, table_id, total_cents, created_at, status")
      .eq("business_id", business.id)
      .eq("delivery_type", "dine_in")
      .eq("lifecycle_status", "open"),
    service
      .from("reservations")
      .select(
        "id, table_id, customer_name, customer_phone, party_size, starts_at, status, notes",
      )
      .eq("business_id", business.id)
      .in("status", ["confirmed", "seated"])
      .gte("starts_at", todayStart.toISOString())
      .lt("starts_at", tomorrowStart.toISOString())
      .order("starts_at", { ascending: true }),
    getMozosByBusiness(business.id),
    getActiveTurnos(business.id),
    getTurnosCerradosHoy(business.id),
  ]);

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Operación en vivo"
        title="Local en vivo"
        description="Pedidos online, comandas de cocina y salón en una sola pantalla. Se actualiza en vivo."
      />
      <LocalShell
        slug={business_slug}
        businessId={business.id}
        timezone={business.timezone}
        initialOrders={initialOrders}
        initialComandas={initialComandas}
        stations={stations}
        floorPlans={floorPlans}
        dineInOrders={(dineInOrders ?? []) as SalonOrderRef[]}
        reservations={(reservations ?? []) as SalonReservationRef[]}
        mozos={mozos}
        currentUserId={ctx.user.id}
        role={ctx.isPlatformAdmin ? "admin" : (ctx.role ?? "admin")}
        cajaTurnos={cajaTurnos}
        cajaCerradosHoy={cajaCerradosHoy}
      />
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
