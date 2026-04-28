import { notFound } from "next/navigation";

import { CustomerDetailView } from "@/components/admin/customers/customer-detail";
import { PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess } from "@/lib/admin/context";
import { getCustomerDetail } from "@/lib/admin/customers-query";
import { getBusiness } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();
  await ensureAdminAccess(business.id, business_slug);

  const customer = await getCustomerDetail(business.id, id);
  if (!customer) notFound();

  return (
    <PageShell width="wide" className="space-y-6">
      <CustomerDetailView
        slug={business_slug}
        timezone={business.timezone}
        customer={customer}
      />
    </PageShell>
  );
}
