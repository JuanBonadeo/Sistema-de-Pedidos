"use server";

import { z } from "zod";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const Input = z.object({
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres.")
    .max(72, "Máximo 72 caracteres."),
  full_name: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export async function completeWelcome(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
    );
  }
  const { password, full_name } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("Tu sesión expiró. Pedí otro link.");

  const service = createSupabaseServiceClient();
  const { error } = await service.auth.admin.updateUserById(user.id, {
    password,
    user_metadata: {
      ...user.user_metadata,
      ...(full_name ? { full_name } : {}),
      welcomed_at: new Date().toISOString(),
    },
  });
  if (error) {
    console.error("completeWelcome updateUserById", error);
    return actionError("No pudimos guardar la contraseña. Intentá de nuevo.");
  }

  if (full_name) {
    await service
      .from("users")
      .upsert(
        { id: user.id, email: user.email ?? "", full_name },
        { onConflict: "id" },
      );
  }

  return actionOk(null);
}
