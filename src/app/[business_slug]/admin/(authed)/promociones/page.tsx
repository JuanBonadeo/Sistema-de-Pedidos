import { notFound } from "next/navigation";

import { PromosListClient } from "@/components/admin/promos/promos-list-client";
import { PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess } from "@/lib/admin/context";
import { listPromoCodes } from "@/lib/admin/promos-query";
import { getBusiness } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function PromosPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();
  await ensureAdminAccess(business.id, business_slug);

  const promos = await listPromoCodes(business.id);

  return (
    <PageShell width="wide" className="space-y-6">
      <PromosListClient slug={business_slug} initialPromos={promos} />
    </PageShell>
  );
}
