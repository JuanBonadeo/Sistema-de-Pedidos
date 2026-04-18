"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { actionError, type ActionResult } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const SignInInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signInPlatform(
  input: unknown,
): Promise<ActionResult<never>> {
  const parsed = SignInInput.safeParse(input);
  if (!parsed.success) return actionError("Datos inválidos.");
  const { email, password } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return actionError("Email o contraseña incorrectos.");
  }

  const service = createSupabaseServiceClient();
  const { data: profile } = await service
    .from("users")
    .select("is_platform_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.is_platform_admin) {
    await supabase.auth.signOut();
    return actionError("No tenés permisos de plataforma.");
  }

  redirect("/super");
}
