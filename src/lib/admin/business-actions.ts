"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color inválido.");

const UpdateInput = z.object({
  business_slug: z.string().min(1),
  name: z.string().min(1, "Requerido.").max(120),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null)))
    .refine(
      (v) => v === null || /^\S+@\S+\.\S+$/.test(v),
      "Email inválido.",
    ),
  address: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  timezone: z.string().min(1, "Requerido."),
  logo_url: z
    .string()
    .url()
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null)))
    .nullable(),
  cover_image_url: z
    .string()
    .url()
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null)))
    .nullable(),
  primary_color: HexColor,
  primary_foreground: HexColor,
  delivery_fee_cents: z.coerce
    .number()
    .int("Tiene que ser un número entero.")
    .min(0, "No puede ser negativo."),
  min_order_cents: z.coerce
    .number()
    .int("Tiene que ser un número entero.")
    .min(0, "No puede ser negativo."),
  estimated_delivery_minutes: z
    .union([z.coerce.number().int().min(0), z.null(), z.literal("")])
    .transform((v) => (v === "" || v === null ? null : v)),
  mp_access_token: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  mp_public_key: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  mp_webhook_secret: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  mp_accepts_payments: z.coerce.boolean(),
});

async function assertCanManage(businessSlug: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado." };

  const service = createSupabaseServiceClient();
  const { data: business } = await service
    .from("businesses")
    .select("id, settings")
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
  return {
    ok: true as const,
    businessId: business.id,
    currentSettings: (business.settings as Record<string, unknown>) ?? {},
  };
}

export async function updateBusinessSettings(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = UpdateInput.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }
  const {
    business_slug,
    name,
    phone,
    email,
    address,
    timezone,
    logo_url,
    cover_image_url,
    primary_color,
    primary_foreground,
    delivery_fee_cents,
    min_order_cents,
    estimated_delivery_minutes,
    mp_access_token,
    mp_public_key,
    mp_webhook_secret,
    mp_accepts_payments,
  } = parsed.data;

  // Guardrail: can't enable MP without the 2 credentials needed to create
  // preferences + reconcile payments on redirect. The webhook_secret is
  // optional (only needed if you wire up the /api/mp/webhook endpoint in
  // production for edge cases like closed tabs or refunds).
  if (mp_accepts_payments && (!mp_access_token || !mp_public_key)) {
    return actionError(
      "Para activar Mercado Pago necesitás cargar Access Token y Public Key.",
    );
  }

  const guard = await assertCanManage(business_slug);
  if (!guard.ok) return actionError(guard.error);

  const service = createSupabaseServiceClient();
  const nextSettings = {
    ...guard.currentSettings,
    primary_color,
    primary_foreground,
    // Mirror logo into settings for legacy consumers; column is the source of truth.
    logo_url,
  };

  const { error } = await service
    .from("businesses")
    .update({
      name,
      phone,
      email,
      address,
      timezone,
      logo_url,
      cover_image_url,
      delivery_fee_cents,
      min_order_cents,
      estimated_delivery_minutes,
      mp_access_token,
      mp_public_key,
      mp_webhook_secret,
      mp_accepts_payments,
      settings: nextSettings,
    })
    .eq("id", guard.businessId);

  if (error) {
    console.error("updateBusinessSettings", error);
    return actionError("No pudimos guardar los cambios.");
  }

  // Invalidate everything branded by this tenant (theme + logo live in layout).
  revalidatePath(`/${business_slug}`, "layout");
  return actionOk(null);
}
