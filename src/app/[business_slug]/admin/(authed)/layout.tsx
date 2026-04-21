import { notFound } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { BrandStyle } from "@/components/admin/shell/brand-style";
import { canManageBusiness, ensureAdminAccess } from "@/lib/admin/context";
import { getBusiness, getBusinessSettings } from "@/lib/tenant";

export default async function AdminAuthedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureAdminAccess(business.id, business_slug);
  const settings = getBusinessSettings(business);

  return (
    <div
      data-admin-brand
      className="flex min-h-screen bg-zinc-100/60"
    >
      <BrandStyle
        primary={settings.primary_color}
        primaryForeground={settings.primary_foreground}
      />
      <AdminSidebar
        slug={business_slug}
        businessName={business.name}
        businessLogoUrl={business.logo_url}
        userEmail={ctx.userEmail}
        userName={ctx.userName}
        isPlatformAdmin={ctx.isPlatformAdmin}
        canManageBusiness={canManageBusiness(ctx)}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
