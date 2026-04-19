import { notFound, redirect } from "next/navigation";

import { BusinessSettingsForm } from "@/components/admin/settings/business-settings-form";
import {
  canManageBusiness,
  ensureAdminAccess,
} from "@/lib/admin/context";
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
  const menu = await getMenu(business.id);
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
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          Negocio
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Configuración
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Datos de contacto, marca y zona horaria del negocio.
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          URL pública: <code>/{business.slug}</code>{" "}
          <span className="text-muted-foreground/70">
            (el slug lo gestiona la plataforma)
          </span>
        </p>
      </header>

      <BusinessSettingsForm
        slug={business_slug}
        businessId={business.id}
        initial={initial}
        sampleProducts={sampleProducts}
      />
    </main>
  );
}

export const dynamic = "force-dynamic";
