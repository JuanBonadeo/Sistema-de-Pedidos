import { notFound } from "next/navigation";

import { OrdersRealtimeBoard } from "@/components/admin/orders-realtime-board";
import { getTodayOrders } from "@/lib/admin/orders-query";
import { getBusiness } from "@/lib/tenant";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const initialOrders = await getTodayOrders(business.id, business.timezone);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          Pedidos
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">En vivo</h1>
      </header>
      <OrdersRealtimeBoard
        businessId={business.id}
        slug={business_slug}
        timezone={business.timezone}
        initialOrders={initialOrders}
      />
    </main>
  );
}

export const dynamic = "force-dynamic";
