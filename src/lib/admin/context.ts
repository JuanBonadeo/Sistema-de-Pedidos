import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type BusinessRole = "admin" | "staff" | "mozo" | "cocina";

export type AdminContext = {
  user: User;
  userName?: string;
  userEmail: string;
  isPlatformAdmin: boolean;
  role: BusinessRole | null;
};

/**
 * Ensures the request has a session AND that the user can manage the given
 * business (either via business_users membership or platform admin flag).
 * Redirects to login otherwise. Returns the context for the caller.
 */
export async function ensureAdminAccess(
  businessId: string,
  businessSlug: string,
): Promise<AdminContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${businessSlug}/admin/login`);

  const service = createSupabaseServiceClient();
  const [{ data: membership }, { data: profile }] = await Promise.all([
    service
      .from("business_users")
      .select("role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle(),
    service
      .from("users")
      .select("is_platform_admin")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const isPlatformAdmin = profile?.is_platform_admin ?? false;
  if (!membership && !isPlatformAdmin) {
    redirect(`/${businessSlug}/admin/login`);
  }

  const userName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined);

  return {
    user,
    userName,
    userEmail: user.email ?? "",
    isPlatformAdmin,
    role: (membership?.role as BusinessRole | undefined) ?? null,
  };
}

/**
 * True when the user can administer the business: edit settings, manage team,
 * change catalog structure, etc. Platform admin always; business admin yes;
 * staff no.
 */
export function canManageBusiness(ctx: AdminContext): boolean {
  if (ctx.isPlatformAdmin) return true;
  return ctx.role === "admin";
}

