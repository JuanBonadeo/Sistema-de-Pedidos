import { notFound, redirect } from "next/navigation";

import { BusinessSettingsForm } from "@/components/admin/settings/business-settings-form";
import { PageHeader, PageShell } from "@/components/admin/shell/page-shell";
import {
  canManageBusiness,
  ensureAdminAccess,
} from "@/lib/admin/context";
import { currentDayOfWeek } from "@/lib/day-of-week";
import { getMenu } from "@/lib/menu";
import { getBusiness, getBusinessSettings } from "@/lib/tenant";

export default async function ConfiguracionPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureAdminAccess(business.id, business_slug);
  if (!canManageBusiness(ctx)) redirect(`/${business_slug}/admin`);

  const settings = getBusinessSettings(business);
  const menu = await getMenu(business.id, currentDayOfWeek(business.timezone));
  const sampleProducts = menu.categories
    .flatMap((c) => c.products)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      name: p.name,
      price_cents: p.price_cents,
      image_url: p.image_url ?? null,
    }));

  const initial = {
    slug: business.slug,
    name: business.name,
    phone: business.phone ?? "",
    email: business.email ?? "",
    address: business.address ?? "",
    timezone: business.timezone,
    logo_url: business.logo_url ?? null,
    cover_image_url: business.cover_image_url ?? null,
    primary_color: (settings.primary_color ?? "#E11D48").toUpperCase(),
    primary_foreground: (
      settings.primary_foreground ?? "#FFFFFF"
    ).toUpperCase(),
    delivery_fee_cents: Number(business.delivery_fee_cents ?? 0) / 100,
    min_order_cents: Number(business.min_order_cents ?? 0) / 100,
    estimated_delivery_minutes: business.estimated_delivery_minutes,
    mp_access_token: business.mp_access_token ?? "",
    mp_public_key: business.mp_public_key ?? "",
    mp_webhook_secret: business.mp_webhook_secret ?? "",
    mp_accepts_payments: business.mp_accepts_payments,
  };

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Negocio"
        title="Configuración"
        description={`Datos de contacto, marca, envío y pagos. URL pública: /${business.slug}`}
      />
      <BusinessSettingsForm
        slug={business_slug}
        businessId={business.id}
        initial={initial}
        sampleProducts={sampleProducts}
      />
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
