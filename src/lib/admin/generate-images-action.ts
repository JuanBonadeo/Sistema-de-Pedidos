"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { searchPexelsPhoto } from "@/lib/pexels/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Bulk-generates product images using Pexels stock photos.
 * Iterates over products without `image_url`, queries Pexels with the product
 * name, and saves the CDN URL to the product. The Pexels CDN host is stable
 * — the URLs don't expire.
 *
 * Throttling: 200ms entre requests para no agotar el rate limit (200/hora).
 * Skipping: si Pexels no encuentra nada, salta el producto sin error.
 */

type Result = {
  total: number;
  found: number;
  not_found: number;
  errors: number;
  skipped_existing: number;
};

export async function generateProductImages(input: {
  business_slug: string;
  /** Si es false, regenera incluso productos que ya tienen imagen. */
  only_missing?: boolean;
}): Promise<ActionResult<Result>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("No autenticado.");

  const service = createSupabaseServiceClient();
  const { data: business } = await service
    .from("businesses")
    .select("id, name")
    .eq("slug", input.business_slug)
    .maybeSingle();
  if (!business) return actionError("Negocio no encontrado.");

  // Permission check (mismo patrón que las otras admin actions)
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
  if (!profile?.is_platform_admin && !membership) {
    return actionError("Permiso denegado.");
  }

  // Fetch products
  const onlyMissing = input.only_missing ?? true;
  let query = service
    .from("products")
    .select("id, name, image_url, category_id, categories(name)")
    .eq("business_id", business.id)
    .eq("is_active", true);
  if (onlyMissing) query = query.is("image_url", null);
  const { data: products } = await query;
  if (!products || products.length === 0) {
    return actionOk({
      total: 0,
      found: 0,
      not_found: 0,
      errors: 0,
      skipped_existing: 0,
    });
  }

  let found = 0;
  let notFound = 0;
  let errors = 0;
  const skippedExisting = 0;

  for (const product of products) {
    if (!onlyMissing && product.image_url) {
      // Si onlyMissing=false pero queremos respetar imágenes manuales subidas
      // por el dueño, skipearíamos acá. Por ahora regeneramos todo cuando lo
      // pide explícitamente.
    }

    try {
      // Query estrategia: nombre del producto + categoría como fallback,
      // así "Empanadas" busca "Empanadas food" y mejora la calidad.
      const categoryName = (product.categories as { name?: string } | null)?.name;
      const baseQuery = product.name;
      let photo = await searchPexelsPhoto(baseQuery);
      // Si no hay match, probamos con la categoría como contexto
      if (!photo && categoryName) {
        photo = await searchPexelsPhoto(`${baseQuery} ${categoryName}`);
      }
      if (!photo) {
        notFound += 1;
        continue;
      }

      const { error: updateErr } = await service
        .from("products")
        .update({ image_url: photo.src.large })
        .eq("id", product.id);
      if (updateErr) {
        errors += 1;
        console.error("update image_url failed", updateErr);
      } else {
        found += 1;
      }
    } catch (e) {
      errors += 1;
      const err = e as { kind?: string; message?: string };
      if (err.kind === "rate_limit") {
        // Stop early on rate limit — no point burning more
        console.warn("Pexels rate limit reached, stopping early");
        break;
      }
      if (err.kind === "not_configured") {
        return actionError("PEXELS_API_KEY no está configurada en .env.local");
      }
      console.error("Pexels search failed for", product.name, e);
    }

    // 200ms throttle between requests
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  revalidatePath(`/${input.business_slug}/admin/catalogo`);
  revalidatePath(`/${input.business_slug}/menu`);

  return actionOk({
    total: products.length,
    found,
    not_found: notFound,
    errors,
    skipped_existing: skippedExisting,
  });
}
