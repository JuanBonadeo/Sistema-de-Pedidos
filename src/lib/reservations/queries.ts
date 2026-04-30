import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  FloorTable,
  Reservation,
  ReservationSettings,
} from "@/lib/reservations/types";
import { DEFAULT_RESERVATION_SETTINGS } from "@/lib/reservations/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type GenericClient = SupabaseClient;

/**
 * Reads the reservation settings row, returning DB defaults when nothing was
 * saved yet. The form upserts on save so we never need to insert an empty row
 * up-front, but consumers (the customer-facing reservation flow especially)
 * need defaults to render before the admin has touched anything.
 */
export async function getReservationSettings(
  businessId: string,
  options: { useService?: boolean } = {},
): Promise<ReservationSettings> {
  const supabase = options.useService
    ? (createSupabaseServiceClient() as unknown as GenericClient)
    : ((await createSupabaseServerClient()) as unknown as GenericClient);

  const { data } = await supabase
    .from("reservation_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (data) return data as ReservationSettings;

  return {
    business_id: businessId,
    ...DEFAULT_RESERVATION_SETTINGS,
    updated_at: new Date(0).toISOString(),
  };
}

/**
 * Returns the active+disabled tables of a business by joining through the
 * (single) floor plan. Used by the availability engine and admin views.
 */
export async function getBusinessTables(
  businessId: string,
  options: { useService?: boolean } = {},
): Promise<FloorTable[]> {
  const supabase = options.useService
    ? (createSupabaseServiceClient() as unknown as GenericClient)
    : ((await createSupabaseServerClient()) as unknown as GenericClient);

  const { data: plan } = await supabase
    .from("floor_plans")
    .select("id")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!plan) return [];

  const { data: tables } = await supabase
    .from("tables")
    .select("*")
    .eq("floor_plan_id", (plan as { id: string }).id);
  return (tables ?? []) as FloorTable[];
}

/**
 * Live (confirmed/seated) reservations whose [starts_at, ends_at) intersects
 * the given window. Used to feed the availability engine.
 */
export async function getReservationsInRange(
  businessId: string,
  fromIso: string,
  toIso: string,
  options: { useService?: boolean } = {},
): Promise<Reservation[]> {
  const supabase = options.useService
    ? (createSupabaseServiceClient() as unknown as GenericClient)
    : ((await createSupabaseServerClient()) as unknown as GenericClient);

  const { data } = await supabase
    .from("reservations")
    .select("*")
    .eq("business_id", businessId)
    .lt("starts_at", toIso)
    .gt("ends_at", fromIso)
    .order("starts_at", { ascending: true });
  return (data ?? []) as Reservation[];
}

export async function listReservationsForDay(
  businessId: string,
  fromIso: string,
  toIso: string,
): Promise<Reservation[]> {
  const supabase = (await createSupabaseServerClient()) as unknown as GenericClient;
  const { data } = await supabase
    .from("reservations")
    .select("*")
    .eq("business_id", businessId)
    .gte("starts_at", fromIso)
    .lt("starts_at", toIso)
    .order("starts_at", { ascending: true });
  return (data ?? []) as Reservation[];
}
