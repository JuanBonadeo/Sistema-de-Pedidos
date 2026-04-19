import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type SavedAddress = {
  id: string;
  street: string;
};

/**
 * Returns the last ~5 addresses a logged-in user has used for this business.
 * Empty if the user never placed an order here.
 *
 * We resolve user -> customer -> addresses. `customers.user_id` gets set when
 * the customer upserts during an order, so a first-time user will naturally
 * see an empty list until they complete their first delivery order.
 */
export async function listUserAddresses(
  userId: string,
  businessId: string,
): Promise<SavedAddress[]> {
  const service = createSupabaseServiceClient();

  const { data: customer } = await service
    .from("customers")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!customer) return [];

  const { data } = await service
    .from("customer_addresses")
    .select("id, street")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return data ?? [];
}
