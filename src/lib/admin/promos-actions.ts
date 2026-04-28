"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const PROMO_CODE_PATTERN = /^[A-Z0-9_-]{3,30}$/;

// Common base — nullable optional fields with proper transforms
const PromoBase = z.object({
  business_slug: z.string().min(1),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      PROMO_CODE_PATTERN,
      "Sólo letras mayúsculas, números, guiones y guiones bajos. Entre 3 y 30 caracteres.",
    ),
  description: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  discount_type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  discount_value: z.coerce
    .number()
    .int()
    .min(0, "Debe ser positivo."),
  min_order_cents: z.coerce.number().int().min(0).default(0),
  max_uses: z
    .union([z.coerce.number().int().min(1), z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null ? null : v)),
  valid_from: z
    .string()
    .optional()
    .transform((v) => (!v ? null : v)),
  valid_until: z
    .string()
    .optional()
    .transform((v) => (!v ? null : v)),
  is_active: z.coerce.boolean(),
});

const CreateInput = PromoBase;
const UpdateInput = PromoBase.extend({ id: z.string().uuid() });
const ToggleInput = z.object({
  business_slug: z.string().min(1),
  id: z.string().uuid(),
  is_active: z.coerce.boolean(),
});
const DeleteInput = z.object({
  business_slug: z.string().min(1),
  id: z.string().uuid(),
});

async function assertCanManage(businessSlug: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado." };

  // Cast to generic client so we can query `promo_codes` (added by migration
  // 0018) before regenerating database.types.ts. Remove after regen.
  const service = createSupabaseServiceClient() as unknown as import("@supabase/supabase-js").SupabaseClient;
  const { data: business } = await service
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .maybeSingle();
  if (!business) return { ok: false as const, error: "Negocio no encontrado." };

  const [{ data: profile }, { data: membership }] = await Promise.all([
    service
      .from("users")
      .select("is_platform_admin")
      .eq("id", user.id)
      .maybeSingle(),
    service
      .from("business_users")
      .select("role")
      .eq("business_id", business.id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const isPlatformAdmin = profile?.is_platform_admin ?? false;
  const isAdmin = membership?.role === "admin";
  if (!isPlatformAdmin && !isAdmin) {
    return { ok: false as const, error: "Permiso denegado." };
  }
  return { ok: true as const, businessId: business.id };
}

function validateBusinessRules(input: z.infer<typeof PromoBase>): string | null {
  if (input.discount_type === "percentage") {
    if (input.discount_value < 1 || input.discount_value > 100) {
      return "El porcentaje debe estar entre 1 y 100.";
    }
  }
  if (input.discount_type === "fixed_amount" && input.discount_value <= 0) {
    return "El monto debe ser mayor a 0.";
  }
  if (
    input.valid_from &&
    input.valid_until &&
    new Date(input.valid_from).getTime() > new Date(input.valid_until).getTime()
  ) {
    return "La fecha de inicio no puede ser posterior a la de fin.";
  }
  return null;
}

export async function createPromoCode(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = CreateInput.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }
  const guard = await assertCanManage(parsed.data.business_slug);
  if (!guard.ok) return actionError(guard.error);

  const ruleError = validateBusinessRules(parsed.data);
  if (ruleError) return actionError(ruleError);

  // Cast to generic client so we can query `promo_codes` (added by migration
  // 0018) before regenerating database.types.ts. Remove after regen.
  const service = createSupabaseServiceClient() as unknown as import("@supabase/supabase-js").SupabaseClient;
  // Pre-check uniqueness so we can return a friendly error
  const { data: existing } = await service
    .from("promo_codes")
    .select("id")
    .eq("business_id", guard.businessId)
    .ilike("code", parsed.data.code)
    .maybeSingle();
  if (existing) {
    return actionError(`Ya existe un código "${parsed.data.code}".`);
  }

  const { data, error } = await service
    .from("promo_codes")
    .insert({
      business_id: guard.businessId,
      code: parsed.data.code,
      description: parsed.data.description,
      discount_type: parsed.data.discount_type,
      discount_value:
        parsed.data.discount_type === "free_shipping"
          ? 0
          : parsed.data.discount_value,
      min_order_cents: parsed.data.min_order_cents,
      max_uses: parsed.data.max_uses,
      valid_from: parsed.data.valid_from,
      valid_until: parsed.data.valid_until,
      is_active: parsed.data.is_active,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("createPromoCode", error);
    return actionError("No pudimos crear el código.");
  }

  revalidatePath(`/${parsed.data.business_slug}/admin/promociones`);
  return actionOk({ id: data.id });
}

export async function updatePromoCode(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = UpdateInput.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }
  const guard = await assertCanManage(parsed.data.business_slug);
  if (!guard.ok) return actionError(guard.error);

  const ruleError = validateBusinessRules(parsed.data);
  if (ruleError) return actionError(ruleError);

  // Cast to generic client so we can query `promo_codes` (added by migration
  // 0018) before regenerating database.types.ts. Remove after regen.
  const service = createSupabaseServiceClient() as unknown as import("@supabase/supabase-js").SupabaseClient;
  // Pre-check uniqueness for the new code (excluding self)
  const { data: existing } = await service
    .from("promo_codes")
    .select("id")
    .eq("business_id", guard.businessId)
    .ilike("code", parsed.data.code)
    .neq("id", parsed.data.id)
    .maybeSingle();
  if (existing) {
    return actionError(`Ya existe otro código "${parsed.data.code}".`);
  }

  const { error } = await service
    .from("promo_codes")
    .update({
      code: parsed.data.code,
      description: parsed.data.description,
      discount_type: parsed.data.discount_type,
      discount_value:
        parsed.data.discount_type === "free_shipping"
          ? 0
          : parsed.data.discount_value,
      min_order_cents: parsed.data.min_order_cents,
      max_uses: parsed.data.max_uses,
      valid_from: parsed.data.valid_from,
      valid_until: parsed.data.valid_until,
      is_active: parsed.data.is_active,
    })
    .eq("id", parsed.data.id)
    .eq("business_id", guard.businessId);
  if (error) {
    console.error("updatePromoCode", error);
    return actionError("No pudimos guardar los cambios.");
  }

  revalidatePath(`/${parsed.data.business_slug}/admin/promociones`);
  return actionOk({ id: parsed.data.id });
}

export async function togglePromoActive(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = ToggleInput.safeParse(input);
  if (!parsed.success) return actionError("Datos inválidos.");
  const guard = await assertCanManage(parsed.data.business_slug);
  if (!guard.ok) return actionError(guard.error);

  // Cast to generic client so we can query `promo_codes` (added by migration
  // 0018) before regenerating database.types.ts. Remove after regen.
  const service = createSupabaseServiceClient() as unknown as import("@supabase/supabase-js").SupabaseClient;
  const { error } = await service
    .from("promo_codes")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id)
    .eq("business_id", guard.businessId);
  if (error) return actionError("No pudimos actualizar el estado.");

  revalidatePath(`/${parsed.data.business_slug}/admin/promociones`);
  return actionOk(null);
}

export async function deletePromoCode(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = DeleteInput.safeParse(input);
  if (!parsed.success) return actionError("Datos inválidos.");
  const guard = await assertCanManage(parsed.data.business_slug);
  if (!guard.ok) return actionError(guard.error);

  // Cast to generic client so we can query `promo_codes` (added by migration
  // 0018) before regenerating database.types.ts. Remove after regen.
  const service = createSupabaseServiceClient() as unknown as import("@supabase/supabase-js").SupabaseClient;
  const { error } = await service
    .from("promo_codes")
    .delete()
    .eq("id", parsed.data.id)
    .eq("business_id", guard.businessId);
  if (error) return actionError("No pudimos eliminar el código.");

  revalidatePath(`/${parsed.data.business_slug}/admin/promociones`);
  return actionOk(null);
}
