"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Delete a saved address belonging to the logged-in user. We verify the
 * address is linked (via customer) to the same user making the request so
 * users can't touch other people's addresses.
 */
export async function deleteSavedAddress(
  businessSlug: string,
  addressId: string,
): Promise<ActionResult<null>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("No autenticado.");

  const service = createSupabaseServiceClient();

  // Resolve business -> customer for this user -> make sure the address
  // belongs to that customer before deleting.
  const { data: business } = await service
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .maybeSingle();
  if (!business) return actionError("Negocio no encontrado.");

  const { data: customer } = await service
    .from("customers")
    .select("id")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!customer) return actionError("No tenés direcciones guardadas.");

  const { data: address } = await service
    .from("customer_addresses")
    .select("id, customer_id")
    .eq("id", addressId)
    .maybeSingle();
  if (!address || address.customer_id !== customer.id) {
    return actionError("Dirección no encontrada.");
  }

  const { error } = await service
    .from("customer_addresses")
    .delete()
    .eq("id", addressId);
  if (error) {
    console.error("deleteSavedAddress", error);
    return actionError("No pudimos borrar la dirección.");
  }

  revalidatePath(`/${businessSlug}/perfil/direcciones`);
  return actionOk(null);
}
