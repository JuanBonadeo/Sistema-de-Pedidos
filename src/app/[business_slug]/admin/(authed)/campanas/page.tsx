import { notFound } from "next/navigation";

import { CampaignsListClient } from "@/components/admin/campaigns/campaigns-list-client";
import { PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess } from "@/lib/admin/context";
import { listCampaigns } from "@/lib/admin/campaigns-query";
import { getBusiness } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();
  await ensureAdminAccess(business.id, business_slug);

  const campaigns = await listCampaigns(business.id);

  return (
    <PageShell width="wide" className="space-y-6">
      <CampaignsListClient slug={business_slug} initialCampaigns={campaigns} />
    </PageShell>
  );
}
