"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { StationInput } from "./schemas";

async function getBusinessIdBySlug(slug: string): Promise<string | null> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

export async function createStation(
  businessSlug: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = StationInput.safeParse(input);
  if (!parsed.success) {
    console.error("createStation · invalid input", {
      input,
      issues: parsed.error.issues,
    });
    const first = parsed.error.issues[0];
    return actionError(
      first ? `${first.path.join(".") || "campo"}: ${first.message}` : "Datos inválidos.",
    );
  }

  const businessId = await getBusinessIdBySlug(businessSlug);
  if (!businessId) return actionError("Negocio no encontrado.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stations")
    .insert({ ...parsed.data, business_id: businessId })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createStation", error);
    return actionError(
      error?.code === "23505"
        ? "Ya existe un sector con ese nombre."
        : "No pudimos crear el sector.",
    );
  }

  revalidatePath(`/${businessSlug}/admin/catalogo`);
  return actionOk({ id: data.id });
}

export async function updateStation(
  businessSlug: string,
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = StationInput.safeParse(input);
  if (!parsed.success) {
    console.error("updateStation · invalid input", {
      input,
      issues: parsed.error.issues,
    });
    const first = parsed.error.issues[0];
    return actionError(
      first ? `${first.path.join(".") || "campo"}: ${first.message}` : "Datos inválidos.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("stations")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    console.error("updateStation", error);
    return actionError(
      error.code === "23505"
        ? "Ya existe un sector con ese nombre."
        : "No pudimos actualizar.",
    );
  }

  revalidatePath(`/${businessSlug}/admin/catalogo`);
  return actionOk({ id });
}

export async function deleteStation(
  businessSlug: string,
  id: string,
): Promise<ActionResult<null>> {
  // categories.station_id y products.station_id son ON DELETE SET NULL así
  // que se desreferencian limpio. PERO comandas.station_id es ON DELETE
  // RESTRICT — si el sector ya tiene comandas históricas, falla con 23503.
  // Capturamos ese caso y sugerimos usar `is_active=false` en su lugar.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("stations").delete().eq("id", id);
  if (error) {
    console.error("deleteStation", error);
    if (error.code === "23503") {
      return actionError(
        "No podés borrar este sector porque tiene comandas históricas. Marcalo como inactivo en su lugar.",
      );
    }
    return actionError("No pudimos borrar el sector.");
  }
  revalidatePath(`/${businessSlug}/admin/catalogo`);
  return actionOk(null);
}

/**
 * Reordena los sectores de un business. Bulk update en dos pasos para evitar
 * colisiones intermedias. Mismo patrón que `reorderSuperCategories`.
 */
export async function reorderStations(
  businessSlug: string,
  idsInOrder: string[],
): Promise<ActionResult<null>> {
  const businessId = await getBusinessIdBySlug(businessSlug);
  if (!businessId) return actionError("Negocio no encontrado.");

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("stations")
    .select("id")
    .eq("business_id", businessId);
  if (!existing) return actionError("No pudimos leer los sectores.");

  const existingIds = new Set(existing.map((r) => r.id));
  const inputIds = new Set(idsInOrder);
  if (
    existingIds.size !== inputIds.size ||
    [...existingIds].some((id) => !inputIds.has(id))
  ) {
    return actionError("Lista de orden inconsistente.");
  }

  for (let i = 0; i < idsInOrder.length; i++) {
    await supabase
      .from("stations")
      .update({ sort_order: 100_000 + i })
      .eq("id", idsInOrder[i]!);
  }
  for (let i = 0; i < idsInOrder.length; i++) {
    await supabase
      .from("stations")
      .update({ sort_order: i })
      .eq("id", idsInOrder[i]!);
  }

  revalidatePath(`/${businessSlug}/admin/catalogo`);
  return actionOk(null);
}
