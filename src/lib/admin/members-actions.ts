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

export type InvitePayload = {
  email: string;
  role: "admin" | "staff";
  isNewUser: boolean;
  inviteLink: string | null;
};

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
  const isAdmin = membership?.role === "admin";
  if (!isPlatformAdmin && !isAdmin) {
    return { ok: false as const, error: "Permiso denegado." };
  }
  return {
    ok: true as const,
    user,
    businessId: business.id,
    isPlatformAdmin,
  };
}

export async function inviteBusinessMemberByAdmin(
  input: unknown,
): Promise<ActionResult<InvitePayload>> {
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
  // Usamos /auth/confirm con verifyOtp + token_hash en lugar del action_link
  // crudo que devuelve Supabase, porque los links admin-generados no tienen
  // code_verifier (PKCE) en el navegador del invitado y exchangeCodeForSession
  // fallaría.
  const buildConfirmUrl = (
    tokenHash: string,
    type: "invite" | "magiclink",
    next: string,
  ) =>
    `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(
      tokenHash,
    )}&type=${type}&next=${encodeURIComponent(next)}`;

  let inviteLink: string | null = null;
  let isNewUser = false;

  if (!user) {
    // Usuario nuevo → link de invitación que pide setear contraseña.
    const { data: linkData, error: linkErr } =
      await service.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo: `${siteUrl}/${business_slug}/admin/bienvenida` },
      });
    if (linkErr || !linkData.user) {
      console.error("generateLink invite", linkErr);
      return actionError(
        linkErr?.message ?? "No pudimos generar la invitación.",
      );
    }
    user = linkData.user;
    const hashed = linkData.properties?.hashed_token;
    if (hashed) {
      inviteLink = buildConfirmUrl(
        hashed,
        "invite",
        `/${business_slug}/admin/bienvenida`,
      );
    }
    isNewUser = true;
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

  // Si el usuario ya existía, igual generamos un magic link para que pueda
  // entrar directo sin contraseña — útil si nunca se logueó todavía.
  if (!isNewUser) {
    // Si nunca completó la bienvenida (no tiene welcomed_at), igual lo
    // ruteamos a bienvenida así setea contraseña. Si ya está welcomed,
    // entra derecho al panel.
    const wasWelcomed = Boolean(
      (user!.user_metadata as Record<string, unknown> | null)?.welcomed_at,
    );
    const next = wasWelcomed
      ? `/${business_slug}/admin`
      : `/${business_slug}/admin/bienvenida`;

    const { data: magicData, error: magicErr } =
      await service.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${siteUrl}${next}` },
      });
    if (magicErr) {
      console.error("generateLink magiclink", magicErr);
    } else {
      const hashed = magicData.properties?.hashed_token;
      if (hashed) {
        inviteLink = buildConfirmUrl(hashed, "magiclink", next);
      }
    }

    // Si no había seteado contraseña, marcamos al usuario como "pending welcome"
    // para que la UI lo comunique correctamente.
    if (!wasWelcomed) {
      isNewUser = true;
    }
  }

  revalidatePath(`/${business_slug}/admin/usuarios`);
  return actionOk({
    email,
    role,
    isNewUser,
    inviteLink,
  });
}

export async function removeBusinessMemberByAdmin(
  businessSlug: string,
  userId: string,
): Promise<ActionResult<null>> {
  const guard = await assertCanManage(businessSlug);
  if (!guard.ok) return actionError(guard.error);

  // Can't remove yourself unless you're a platform admin.
  if (userId === guard.user.id && !guard.isPlatformAdmin) {
    return actionError("No podés quitarte a vos mismo.");
  }

  const service = createSupabaseServiceClient();

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
