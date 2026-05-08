import { notFound } from "next/navigation";

import { FloorPlanEditor } from "@/components/admin/floor-plan/floor-plan-editor";
import { PageHeader, PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess } from "@/lib/admin/context";
import { getFloorPlanById } from "@/lib/admin/floor-plan/queries";
import { getBusiness } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function SalonEditPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();
  await ensureAdminAccess(business.id, business_slug);

  const data = await getFloorPlanById(id, business.id);
  if (!data) notFound();

  return (
    <PageShell width="wide" className="space-y-6">
      <PageHeader
        eyebrow="Salón"
        title={data.plan.name}
        description="Dibujá las mesas y guardá. El motor de reservas asigna automáticamente la mesa más chica que entre."
        back={{
          href: `/${business_slug}/admin/salones`,
          label: "Volver a salones",
        }}
      />
      <FloorPlanEditor
        businessSlug={business_slug}
        businessId={business.id}
        plan={data.plan}
        tables={data.tables}
      />
    </PageShell>
  );
}
