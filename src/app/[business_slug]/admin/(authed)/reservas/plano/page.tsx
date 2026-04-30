import { notFound } from "next/navigation";

import { FloorPlanEditor } from "@/components/admin/floor-plan/floor-plan-editor";
import { PageHeader, PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess } from "@/lib/admin/context";
import { getOrCreateFloorPlan } from "@/lib/admin/floor-plan/queries";
import { getBusiness } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function FloorPlanPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();
  await ensureAdminAccess(business.id, business_slug);

  const { plan, tables } = await getOrCreateFloorPlan(business.id);

  return (
    <PageShell width="wide" className="space-y-6">
      <PageHeader
        eyebrow="Reservas"
        title="Plano del salón"
        description="Dibujá las mesas y guardá. El motor de reservas asigna automáticamente la mesa más chica que entre."
        back={{ href: `/${business_slug}/admin/reservas`, label: "Volver a reservas" }}
      />
      <FloorPlanEditor businessSlug={business_slug} plan={plan} tables={tables} />
    </PageShell>
  );
}
