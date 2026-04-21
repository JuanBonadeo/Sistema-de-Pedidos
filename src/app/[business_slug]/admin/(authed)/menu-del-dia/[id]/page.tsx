import { notFound } from "next/navigation";

import { DailyMenuForm } from "@/components/admin/daily-menus/daily-menu-form";
import { PageHeader, PageShell, Surface } from "@/components/admin/shell/page-shell";
import { getAdminDailyMenu } from "@/lib/admin/daily-menu-query";
import { getBusiness } from "@/lib/tenant";

export default async function EditMenuDelDiaPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const menu = await getAdminDailyMenu(id);
  if (!menu) notFound();

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Catálogo · menú del día"
        title={menu.name}
        back={{
          href: `/${business_slug}/admin/catalogo?tab=menu-del-dia`,
          label: "Volver al catálogo",
        }}
        size="compact"
      />
      <Surface padding="default">
        <DailyMenuForm
          slug={business_slug}
          businessId={business.id}
          menu={menu}
        />
      </Surface>
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
