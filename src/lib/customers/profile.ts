import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type CustomerProfile = {
  name: string | null;
  phone: string | null;
  email: string | null;
};

/**
 * Pre-fills checkout fields for a returning logged-in customer.
 *
 * The customers row gets upserted on every order (persist-order.ts) keyed by
 * (business_id, phone), with `user_id` set when the user was authed at order
 * time. So for a returning user: read the customer by user_id + business_id
 * and echo back their last-used name/phone. First-time users get nulls and
 * the form falls back to its other defaults (user_metadata, empty).
 */
export async function getCustomerProfile(
  userId: string,
  businessId: string,
): Promise<CustomerProfile> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("customers")
    .select("name, phone, email")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    name: data?.name ?? null,
    phone: data?.phone ?? null,
    email: data?.email ?? null,
  };
}
