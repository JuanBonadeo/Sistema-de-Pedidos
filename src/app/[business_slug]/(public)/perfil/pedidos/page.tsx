import { notFound, redirect } from "next/navigation";

import { OrdersScreen } from "@/components/public/orders-screen";
import { listUserOrders } from "@/lib/customers/orders";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export default async function PerfilPedidosPage({
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
  if (!user) {
    const next = encodeURIComponent(`/${business_slug}/perfil/pedidos`);
    redirect(`/${business_slug}/login?next=${next}`);
  }

  const orders = await listUserOrders(user.id, business.id);

  return <OrdersScreen slug={business_slug} orders={orders} />;
}

export const dynamic = "force-dynamic";
