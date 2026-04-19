import { notFound } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { canManageBusiness, ensureAdminAccess } from "@/lib/admin/context";
import { getBusiness } from "@/lib/tenant";

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

  return (
    <div className="bg-background min-h-screen lg:flex">
      <AdminSidebar
        slug={business_slug}
        businessName={business.name}
        userEmail={ctx.userEmail}
        userName={ctx.userName}
        isPlatformAdmin={ctx.isPlatformAdmin}
        canManageBusiness={canManageBusiness(ctx)}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
