import { notFound, redirect } from "next/navigation";

import { getCatalogForMozo } from "@/lib/mozo/catalog-query";
import { ensureMozoAccess } from "@/lib/mozo/auth";
import { getDailyMenusForToday } from "@/lib/mozo/daily-menus-query";
import { getTopProductIds } from "@/lib/mozo/top-products";
import {
  getActiveOrderByTable,
  getComandasByOrder,
  getStationsByBusiness,
} from "@/lib/comandas/queries";
import { getBusiness } from "@/lib/tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { MozoPedirClient } from "./pedir-client";

export const dynamic = "force-dynamic";

export default async function MozoPedirPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id: tableId } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureMozoAccess(business.id, business_slug);

  const service = createSupabaseServiceClient();

  // Cross-tenant: la mesa debe pertenecer a un floor_plan de este business.
  const { data: tableRow } = await service
    .from("tables")
    .select(
      "id, label, operational_status, opened_at, mozo_id, floor_plans!inner(business_id)",
    )
    .eq("id", tableId)
    .maybeSingle();
  const tableBusinessId = (
    tableRow as { floor_plans?: { business_id: string } } | null
  )?.floor_plans?.business_id;
  if (!tableRow || tableBusinessId !== business.id) {
    redirect(`/${business_slug}/mozo`);
  }
  const table = tableRow as unknown as {
    id: string;
    label: string;
    operational_status: string;
    opened_at: string | null;
    mozo_id: string | null;
  };

  const activeOrder = await getActiveOrderByTable(tableId, business.id);

  // Día de la semana en el server. Para MVP usamos UTC; si aparece bug por TZ
  // (sábado a la noche → ya es domingo en UTC), se mueve a `business.timezone`.
  const todayDow = new Date().getDay();

  const [catalog, stations, existingComandas, topProductIds, dailyMenus] =
    await Promise.all([
      getCatalogForMozo(business.id),
      getStationsByBusiness(business.id),
      activeOrder
        ? getComandasByOrder(activeOrder.id, business.id)
        : Promise.resolve([]),
      getTopProductIds(business.id, { limit: 12 }),
      getDailyMenusForToday(business.id, todayDow),
    ]);

  const stationNameById: Record<string, string> = {};
  for (const s of stations) stationNameById[s.id] = s.name;

  return (
    <MozoPedirClient
      slug={business_slug}
      businessName={business.name}
      table={{
        id: table.id,
        label: table.label,
        operational_status: table.operational_status,
        opened_at: table.opened_at,
      }}
      catalog={catalog}
      stationNameById={stationNameById}
      existingComandas={existingComandas}
      topProductIds={topProductIds}
      dailyMenus={dailyMenus}
      role={ctx.role}
    />
  );
}
