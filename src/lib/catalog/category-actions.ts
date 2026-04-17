"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { CategoryInput } from "./schemas";

async function getBusinessIdBySlug(slug: string): Promise<string | null> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

export async function createCategory(
  businessSlug: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) return actionError("Datos inválidos.");

  const businessId = await getBusinessIdBySlug(businessSlug);
  if (!businessId) return actionError("Negocio no encontrado.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, business_id: businessId })
    .select("id")
    .single();
  if (error || !data) {
    console.error("createCategory", error);
    return actionError(
      error?.code === "23505"
        ? "Ya existe una categoría con ese slug."
        : "No pudimos crear la categoría.",
    );
  }
  revalidatePath(`/${businessSlug}/admin/catalogo`);
  return actionOk({ id: data.id });
}

export async function updateCategory(
  businessSlug: string,
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) return actionError("Datos inválidos.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    console.error("updateCategory", error);
    return actionError(
      error.code === "23505"
        ? "Ya existe una categoría con ese slug."
        : "No pudimos actualizar.",
    );
  }
  revalidatePath(`/${businessSlug}/admin/catalogo`);
  return actionOk({ id });
}

export async function deleteCategory(
  businessSlug: string,
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    console.error("deleteCategory", error);
    return actionError("No pudimos borrar la categoría.");
  }
  revalidatePath(`/${businessSlug}/admin/catalogo`);
  return actionOk(null);
}
