import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PromoCode } from "@/lib/promos/types";

// NOTE: We cast to a generic `SupabaseClient` (no DB schema) so that the
// `promo_codes` table — added by migration 0018 — can be queried before the
// generated `database.types.ts` is regenerated. After running
// `pnpm supabase gen types` (or equivalent) the cast can be removed.
type GenericClient = SupabaseClient;

export async function listPromoCodes(businessId: string): Promise<PromoCode[]> {
  const supabase = (await createSupabaseServerClient()) as unknown as GenericClient;
  const { data } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PromoCode[];
}

export async function getPromoCode(
  businessId: string,
  promoId: string,
): Promise<PromoCode | null> {
  const supabase = (await createSupabaseServerClient()) as unknown as GenericClient;
  const { data } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", promoId)
    .maybeSingle();
  return (data ?? null) as PromoCode | null;
}
