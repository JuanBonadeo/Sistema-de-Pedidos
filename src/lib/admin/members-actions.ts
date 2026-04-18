"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const InviteInput = z.object({
  business_slug: z.string().min(1),
  email: z.string().email("Email inválido."),
  role: z.enum(["admin", "staff"]),
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
  const isOwner = membership?.role === "owner";
  const isAdmin = membership?.role === "admin";
  if (!isPlatformAdmin && !isOwner && !isAdmin) {
    return { ok: false as const, error: "Permiso denegado." };
  }
  return {
    ok: true as const,
    user,
    businessId: business.id,
    isPlatformAdmin,
    isOwner,
  };
}

export async function inviteBusinessMemberByAdmin(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = InviteInput.safeParse(input);
  if (!parsed.success) return actionError("Datos inválidos.");
  const { business_slug, email, role } = parsed.data;

  const guard = await assertCanManage(business_slug);
  if (!guard.ok) return actionError(guard.error);

  const service = createSupabaseServiceClient();

  const {
    data: { users: allUsers },
  } = await service.auth.admin.listUsers({ perPage: 200 });
  let user = allUsers.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  const siteUrl = getSiteUrl();
  if (!user) {
    const { data: invite, error: inviteErr } =
      await service.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl}/${business_slug}/admin`,
      });
    if (inviteErr || !invite.user) {
      console.error("inviteUserByEmail", inviteErr);
      return actionError("No pudimos enviar la invitación.");
    }
    user = invite.user;
  }

  const { error: userUpsertErr } = await service
    .from("users")
    .upsert({ id: user.id, email }, { onConflict: "id" });
  if (userUpsertErr) return actionError("No pudimos registrar el usuario.");

  const { error: buErr } = await service.from("business_users").upsert(
    {
      business_id: guard.businessId,
      user_id: user.id,
      role,
    },
    { onConflict: "business_id,user_id" },
  );
  if (buErr) {
    console.error("business_users upsert", buErr);
    return actionError("No pudimos asignar al miembro.");
  }

  revalidatePath(`/${business_slug}/admin/usuarios`);
  return actionOk(null);
}

export async function removeBusinessMemberByAdmin(
  businessSlug: string,
  userId: string,
): Promise<ActionResult<null>> {
  const guard = await assertCanManage(businessSlug);
  if (!guard.ok) return actionError(guard.error);

  // Only owner/platform admin can remove. Admins can't remove.
  if (!guard.isOwner && !guard.isPlatformAdmin) {
    return actionError("Sólo el owner puede quitar miembros.");
  }

  // Can't remove yourself unless you're a platform admin.
  if (userId === guard.user.id && !guard.isPlatformAdmin) {
    return actionError("No podés quitarte a vos mismo.");
  }

  const service = createSupabaseServiceClient();

  // Prevent removing the last owner.
  const { data: target } = await service
    .from("business_users")
    .select("role")
    .eq("business_id", guard.businessId)
    .eq("user_id", userId)
    .maybeSingle();
  if (target?.role === "owner") {
    const { count } = await service
      .from("business_users")
      .select("user_id", { count: "exact", head: true })
      .eq("business_id", guard.businessId)
      .eq("role", "owner");
    if ((count ?? 0) <= 1) {
      return actionError("No podés quitar al último owner.");
    }
  }

  const { error } = await service
    .from("business_users")
    .delete()
    .eq("business_id", guard.businessId)
    .eq("user_id", userId);
  if (error) {
    console.error("removeBusinessMemberByAdmin", error);
    return actionError("No pudimos quitar al miembro.");
  }

  revalidatePath(`/${businessSlug}/admin/usuarios`);
  return actionOk(null);
}

function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const proto = rootDomain.includes("localhost") ? "http" : "https";
  return `${proto}://${rootDomain}`;
}
