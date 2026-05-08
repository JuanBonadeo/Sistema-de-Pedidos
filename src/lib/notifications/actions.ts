"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { requireMozoActionContext } from "@/lib/mozo/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

type GenericClient = SupabaseClient;

export async function markAllRead(
  businessSlug: string,
): Promise<ActionResult<void>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  const service = createSupabaseServiceClient() as unknown as GenericClient;
  const nowIso = new Date().toISOString();

  const { error } = await service
    .from("notifications")
    .update({ read_at: nowIso })
    .eq("business_id", business.id)
    .is("read_at", null)
    .or(`user_id.eq.${ctx.userId},target_role.eq.${ctx.role}`);

  if (error) {
    console.error("notifications.markAllRead", error);
    return actionError("No pudimos marcar las notificaciones.");
  }

  revalidatePath(`/${businessSlug}/mozo`);
  revalidatePath(`/${businessSlug}/admin`);
  return actionOk(undefined);
}

export async function markRead(
  notifId: string,
  businessSlug: string,
): Promise<ActionResult<void>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  // Cross-tenant defense + visibility check.
  const { data: notif } = await service
    .from("notifications")
    .select("id, business_id, user_id, target_role")
    .eq("id", notifId)
    .maybeSingle();
  const row = notif as
    | {
        id: string;
        business_id: string;
        user_id: string | null;
        target_role: string | null;
      }
    | null;
  if (!row || row.business_id !== business.id) {
    return actionError("Notificación no encontrada.");
  }
  const isMine = row.user_id === ctx.userId || row.target_role === ctx.role;
  if (!isMine) return actionError("Notificación no encontrada.");

  const { error } = await service
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notifId);
  if (error) {
    console.error("notifications.markRead", error);
    return actionError("No pudimos marcar la notificación.");
  }

  revalidatePath(`/${businessSlug}/mozo`);
  revalidatePath(`/${businessSlug}/admin`);
  return actionOk(undefined);
}
