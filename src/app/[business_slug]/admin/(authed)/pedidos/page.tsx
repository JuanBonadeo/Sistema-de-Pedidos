import { notFound } from "next/navigation";

import { OrdersRealtimeBoard } from "@/components/admin/orders-realtime-board";
import { PageHeader, PageShell } from "@/components/admin/shell/page-shell";
import { getTodayOrders } from "@/lib/admin/orders-query";
import { getBusiness } from "@/lib/tenant";

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const initialOrders = await getTodayOrders(business.id, business.timezone);

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Operación en vivo"
        title="Pedidos"
        description="Se actualiza en vivo a medida que entran. Avanzá cada pedido con el botón de la tarjeta."
      />
      <OrdersRealtimeBoard
        businessId={business.id}
        slug={business_slug}
        timezone={business.timezone}
        initialOrders={initialOrders}
      />
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
