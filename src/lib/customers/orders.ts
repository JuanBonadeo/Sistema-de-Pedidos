import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { OrderStatus } from "@/lib/orders/status";

export type CustomerOrder = {
  id: string;
  order_number: number;
  created_at: string;
  status: OrderStatus;
  delivery_type: "delivery" | "pickup";
  total_cents: number;
  cancelled_reason: string | null;
  items_summary: string; // "2× Muzzarella, 1× Coca 1.5L"
  items_extra: number; // items hidden beyond what summary shows
};

/**
 * All orders of this user in this business. Newest first.
 *
 * Returns a flat shape with a pre-rendered `items_summary` string so the UI
 * doesn't need to re-traverse the items array just to show the preview.
 */
export async function listUserOrders(
  userId: string,
  businessId: string,
): Promise<CustomerOrder[]> {
  const service = createSupabaseServiceClient();

  const { data: customer } = await service
    .from("customers")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!customer) return [];

  const { data } = await service
    .from("orders")
    .select(
      `id, order_number, created_at, status, delivery_type, total_cents,
       cancelled_reason,
       order_items(product_name, quantity)`,
    )
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((o) => {
    const items = o.order_items ?? [];
    const first = items.slice(0, 2);
    const extra = items.length - first.length;
    const summary = first
      .map((i) => `${i.quantity}× ${i.product_name}`)
      .join(", ");
    return {
      id: o.id,
      order_number: o.order_number,
      created_at: o.created_at,
      status: o.status as OrderStatus,
      delivery_type: o.delivery_type as "delivery" | "pickup",
      total_cents: Number(o.total_cents),
      cancelled_reason: o.cancelled_reason,
      items_summary: summary,
      items_extra: extra,
    };
  });
}
