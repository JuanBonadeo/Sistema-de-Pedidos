"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { ReservationSettingsInputSchema } from "@/lib/reservations/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type GenericClient = SupabaseClient;

async function assertCanManage(businessSlug: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado." };

  const service = createSupabaseServiceClient() as unknown as GenericClient;
  const { data: business } = await service
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .maybeSingle();
  if (!business) return { ok: false as const, error: "Negocio no encontrado." };

  const [{ data: profile }, { data: membership }] = await Promise.all([
    service.from("users").select("is_platform_admin").eq("id", user.id).maybeSingle(),
    service
      .from("business_users")
      .select("role")
      .eq("business_id", (business as { id: string }).id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const isPlatformAdmin = (profile as { is_platform_admin?: boolean } | null)?.is_platform_admin ?? false;
  const isAdmin = (membership as { role?: string } | null)?.role === "admin";
  if (!isPlatformAdmin && !isAdmin) return { ok: false as const, error: "Permiso denegado." };
  return { ok: true as const, businessId: (business as { id: string }).id };
}

export async function saveReservationSettings(input: unknown): Promise<ActionResult<null>> {
  const parsed = ReservationSettingsInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }
  const guard = await assertCanManage(parsed.data.business_slug);
  if (!guard.ok) return actionError(guard.error);

  const service = createSupabaseServiceClient() as unknown as GenericClient;
  const { error } = await service.from("reservation_settings").upsert(
    {
      business_id: guard.businessId,
      slot_duration_min: parsed.data.slot_duration_min,
      buffer_min: parsed.data.buffer_min,
      lead_time_min: parsed.data.lead_time_min,
      advance_days_max: parsed.data.advance_days_max,
      max_party_size: parsed.data.max_party_size,
      schedule: parsed.data.schedule,
    },
    { onConflict: "business_id" },
  );
  if (error) {
    console.error("saveReservationSettings", error);
    return actionError("No pudimos guardar la configuración.");
  }

  revalidatePath(`/${parsed.data.business_slug}/admin/reservas/configuracion`);
  revalidatePath(`/${parsed.data.business_slug}/admin/reservas`);
  revalidatePath(`/${parsed.data.business_slug}/reservar`);
  return actionOk(null);
}
