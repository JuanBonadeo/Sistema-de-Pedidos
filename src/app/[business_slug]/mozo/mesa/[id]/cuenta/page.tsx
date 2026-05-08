import { notFound, redirect } from "next/navigation";

import { getCuentaForTable } from "@/lib/billing/cuenta-query";
import { ensureMozoAccess } from "@/lib/mozo/auth";
import { getBusiness } from "@/lib/tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { CuentaClient } from "./cuenta-client";

export const dynamic = "force-dynamic";

export default async function CuentaPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id: tableId } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureMozoAccess(business.id, business_slug);

  // Cross-tenant via getCuentaForTable.
  const cuenta = await getCuentaForTable(tableId, business.id);
  if (!cuenta) {
    redirect(`/${business_slug}/mozo`);
  }

  // Resolver label de la mesa.
  const service = createSupabaseServiceClient();
  const { data: tableRow } = await service
    .from("tables")
    .select("label, operational_status")
    .eq("id", tableId)
    .single();

  return (
    <CuentaClient
      slug={business_slug}
      tableId={tableId}
      tableLabel={tableRow?.label ?? "?"}
      role={ctx.role}
      cuenta={cuenta}
    />
  );
}
