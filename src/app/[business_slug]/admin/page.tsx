import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { OrdersRealtimeBoard } from "@/components/admin/orders-realtime-board";
import { getTodayOrders } from "@/lib/admin/orders-query";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${business_slug}/admin/login`);

  const initialOrders = await getTodayOrders(business.id, business.timezone);

  return (
    <div className="bg-background min-h-screen">
      <AdminNav
        slug={business_slug}
        businessName={business.name}
        userEmail={user.email ?? ""}
      />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <OrdersRealtimeBoard
          businessId={business.id}
          slug={business_slug}
          timezone={business.timezone}
          initialOrders={initialOrders}
        />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
