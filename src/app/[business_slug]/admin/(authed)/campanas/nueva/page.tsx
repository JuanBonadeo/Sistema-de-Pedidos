import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CampaignForm } from "@/components/admin/campaigns/campaign-form";
import { PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess } from "@/lib/admin/context";
import { getBusiness } from "@/lib/tenant";

export default async function NewCampaignPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();
  await ensureAdminAccess(business.id, business_slug);

  return (
    <PageShell width="default" className="space-y-6">
      <div>
        <Link
          href={`/${business_slug}/admin/campanas`}
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="size-3.5" /> Volver
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Nueva campaña
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Mandá una promo personalizada a un grupo de clientes.
        </p>
      </div>

      <CampaignForm slug={business_slug} businessName={business.name} />
    </PageShell>
  );
}
