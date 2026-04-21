import { notFound } from "next/navigation";

import { DailyMenuForm } from "@/components/admin/daily-menus/daily-menu-form";
import { PageHeader, PageShell, Surface } from "@/components/admin/shell/page-shell";
import { getBusiness } from "@/lib/tenant";

export default async function NuevoMenuDelDiaPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Catálogo · menú del día"
        title="Nuevo menú"
        description="Un combo con precio cerrado y componentes (entrada, principal, bebida…)."
        back={{
          href: `/${business_slug}/admin/catalogo?tab=menu-del-dia`,
          label: "Volver al catálogo",
        }}
        size="compact"
      />
      <Surface padding="default">
        <DailyMenuForm slug={business_slug} businessId={business.id} />
      </Surface>
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
