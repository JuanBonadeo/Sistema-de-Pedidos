import { notFound } from "next/navigation";

import { SalonesList } from "@/components/admin/salones/salones-list";
import { PageHeader, PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess, canManageBusiness } from "@/lib/admin/context";
import { getFloorPlansForBusiness } from "@/lib/admin/floor-plan/queries";
import { getBusiness } from "@/lib/tenant";

export default async function SalonesPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureAdminAccess(business.id, business_slug);
  const canManage = canManageBusiness(ctx);

  const plans = await getFloorPlansForBusiness(business.id);

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Operación"
        title="Salones"
        description="Gestioná los planos del local. Cada salón tiene su propio dibujo de mesas y se usa para la toma de pedido y reservas."
      />
      <SalonesList
        slug={business_slug}
        plans={plans}
        canManage={canManage}
      />
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
