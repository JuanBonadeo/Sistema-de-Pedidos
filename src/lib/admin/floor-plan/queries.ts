import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { FloorPlan, FloorTable } from "@/lib/reservations/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// Cast to a generic client until database.types.ts is regenerated after
// migration 0021. Mirrors the pattern used by promos/campaigns queries.
type GenericClient = SupabaseClient;

export type FloorPlanWithTables = {
  plan: FloorPlan;
  tables: FloorTable[];
};

/**
 * Returns the (single) floor plan for a business plus its tables. Auto-creates
 * an empty plan on first access so the editor always has somewhere to save.
 */
export async function getOrCreateFloorPlan(businessId: string): Promise<FloorPlanWithTables> {
  const service = createSupabaseServiceClient() as unknown as GenericClient;

  const { data: existing } = await service
    .from("floor_plans")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let plan = existing as FloorPlan | null;
  if (!plan) {
    const { data, error } = await service
      .from("floor_plans")
      .insert({ business_id: businessId })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`No pudimos crear el plano del salón: ${error?.message ?? "desconocido"}`);
    }
    plan = data as FloorPlan;
  }

  const { data: tables } = await service
    .from("tables")
    .select("*")
    .eq("floor_plan_id", plan.id)
    .order("created_at", { ascending: true });

  return { plan, tables: (tables ?? []) as FloorTable[] };
}

export async function getFloorPlanForCurrentUser(
  businessId: string,
): Promise<FloorPlanWithTables> {
  // The server client respects RLS — we use it for read paths from RSC so the
  // policies enforce access. Falls back to service client to bootstrap the
  // empty plan since RLS would reject anon inserts.
  const supabase = (await createSupabaseServerClient()) as unknown as GenericClient;
  const { data: plan } = await supabase
    .from("floor_plans")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!plan) {
    return getOrCreateFloorPlan(businessId);
  }
  const { data: tables } = await supabase
    .from("tables")
    .select("*")
    .eq("floor_plan_id", (plan as FloorPlan).id)
    .order("created_at", { ascending: true });
  return { plan: plan as FloorPlan, tables: (tables ?? []) as FloorTable[] };
}
