import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { OrderStatus } from "@/lib/orders/status";

export type ActiveOrder = {
  id: string;
  order_number: number;
  status: OrderStatus;
  delivery_type: "delivery" | "pickup";
  created_at: string;
};

// Non-terminal statuses — orders the customer should still be "watching".
const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "on_the_way",
];

/**
 * Active orders this user has with this business. Empty if the user never
 * ordered here or all their past orders are delivered/cancelled.
 *
 * Sorted most recent first. UI can show just the latest or aggregate if
 * there are several (rare but possible).
 */
export async function listActiveOrders(
  userId: string,
  businessId: string,
): Promise<ActiveOrder[]> {
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
    .select("id, order_number, status, delivery_type, created_at")
    .eq("customer_id", customer.id)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false });

  return (data ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status as OrderStatus,
    delivery_type: o.delivery_type as "delivery" | "pickup",
    created_at: o.created_at,
  }));
}
