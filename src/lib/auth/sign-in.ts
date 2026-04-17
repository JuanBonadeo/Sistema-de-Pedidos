"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { actionError, type ActionResult } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const SignInInput = z.object({
  business_slug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signIn(input: unknown): Promise<ActionResult<never>> {
  const parsed = SignInInput.safeParse(input);
  if (!parsed.success) return actionError("Datos inválidos.");
  const { business_slug, email, password } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return actionError("Email o contraseña incorrectos.");
  }

  const service = createSupabaseServiceClient();
  const { data: business } = await service
    .from("businesses")
    .select("id")
    .eq("slug", business_slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!business) {
    await supabase.auth.signOut();
    return actionError("Negocio no encontrado.");
  }

  const { data: membership } = await service
    .from("business_users")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!membership) {
    await supabase.auth.signOut();
    return actionError("No tenés acceso a este negocio.");
  }

  redirect(`/${business_slug}/admin`);
}
