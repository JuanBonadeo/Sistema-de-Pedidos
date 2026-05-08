import { notFound, redirect } from "next/navigation";

import { iniciarCobro } from "@/lib/billing/cobro-actions";
import { getCuentaForTable } from "@/lib/billing/cuenta-query";
import { ensureMozoAccess } from "@/lib/mozo/auth";
import { getBusiness } from "@/lib/tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { CobrarClient } from "./cobrar-client";

export const dynamic = "force-dynamic";

export default async function CobrarPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id: tableId } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureMozoAccess(business.id, business_slug);

  const cuenta = await getCuentaForTable(tableId, business.id);
  if (!cuenta) redirect(`/${business_slug}/mozo`);

  const init = await iniciarCobro(cuenta.order.id, business_slug);
  if (!init.ok) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center gap-4">
        <p className="text-lg font-semibold">No se puede cobrar</p>
        <p className="text-sm text-muted-foreground max-w-sm">{init.error}</p>
        <a
          href={`/${business_slug}/caja`}
          className="text-primary underline text-sm"
        >
          Ir a caja →
        </a>
      </div>
    );
  }

  // Resolver label de la mesa.
  const service = createSupabaseServiceClient();
  const { data: tableRow } = await service
    .from("tables")
    .select("label")
    .eq("id", tableId)
    .single();

  return (
    <CobrarClient
      slug={business_slug}
      tableId={tableId}
      tableLabel={tableRow?.label ?? "?"}
      role={ctx.role}
      cuenta={cuenta}
      init={init.data}
    />
  );
}
