import { notFound } from "next/navigation";

import { OrderTracking } from "@/components/checkout/order-tracking";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

export default async function ConfirmacionPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const supabase = createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, delivery_type, total_cents, subtotal_cents, delivery_fee_cents, order_items(product_name, quantity, subtotal_cents, order_item_modifiers(modifier_name))",
    )
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!order) notFound();

  const tagline =
    (business.settings as { tagline?: string } | null)?.tagline ??
    business.address ??
    null;

  const whatsappHref = business.phone
    ? `https://wa.me/${business.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola! Consulto por el pedido #${order.order_number}`,
      )}`
    : null;

  return (
    <OrderTracking
      slug={business_slug}
      businessName={business.name}
      tagline={tagline}
      orderNumber={order.order_number}
      status={order.status as React.ComponentProps<typeof OrderTracking>["status"]}
      deliveryType={order.delivery_type as "delivery" | "pickup"}
      items={(order.order_items ?? []).map((it) => ({
        product_name: it.product_name,
        quantity: it.quantity,
        subtotal_cents: Number(it.subtotal_cents),
        modifiers: (it.order_item_modifiers ?? []).map((m) => m.modifier_name),
      }))}
      subtotalCents={Number(order.subtotal_cents)}
      deliveryFeeCents={Number(order.delivery_fee_cents)}
      totalCents={Number(order.total_cents)}
      whatsappHref={whatsappHref}
    />
  );
}
