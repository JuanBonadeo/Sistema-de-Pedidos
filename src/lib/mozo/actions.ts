"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type GenericClient = SupabaseClient;

type OperationalStatus =
  | "libre"
  | "ocupada"
  | "esperando_pedido"
  | "esperando_cuenta"
  | "limpiar";

type KitchenStatus = "pending" | "preparing" | "ready" | "delivered";

export async function updateTableOperationalStatus(
  tableId: string,
  status: OperationalStatus,
  businessSlug: string,
): Promise<ActionResult<void>> {
  const service = createSupabaseServiceClient() as unknown as GenericClient;

  const updates: Record<string, unknown> = { operational_status: status };
  if (status === "ocupada") {
    // Only set opened_at on first open; keep it if already set
    updates.opened_at_set_if_null = true; // handled below
  } else if (status === "libre") {
    updates.opened_at = null;
    updates.current_order_id = null;
  }

  // For 'ocupada': set opened_at only if currently null
  if (status === "ocupada") {
    const { data: current } = await service
      .from("tables")
      .select("opened_at")
      .eq("id", tableId)
      .maybeSingle();

    const { error } = await service
      .from("tables")
      .update({
        operational_status: status,
        opened_at: (current as { opened_at: string | null } | null)?.opened_at ?? new Date().toISOString(),
      })
      .eq("id", tableId);

    if (error) {
      console.error("updateTableOperationalStatus", error);
      return actionError("No pudimos actualizar el estado de la mesa.");
    }
  } else {
    const { error } = await service
      .from("tables")
      .update(
        status === "libre"
          ? { operational_status: status, opened_at: null, current_order_id: null }
          : { operational_status: status },
      )
      .eq("id", tableId);

    if (error) {
      console.error("updateTableOperationalStatus", error);
      return actionError("No pudimos actualizar el estado de la mesa.");
    }
  }

  revalidatePath(`/${businessSlug}/mozo`);
  return actionOk(undefined);
}

export async function updateKitchenStatusForOrder(
  orderId: string,
  toStatus: KitchenStatus,
  businessSlug: string,
): Promise<ActionResult<void>> {
  const service = createSupabaseServiceClient() as unknown as GenericClient;

  const { error } = await service
    .from("order_items")
    .update({ kitchen_status: toStatus })
    .eq("order_id", orderId)
    .neq("kitchen_status", "delivered");

  if (error) {
    console.error("updateKitchenStatusForOrder", error);
    return actionError("No pudimos actualizar el estado de cocina.");
  }

  revalidatePath(`/${businessSlug}/cocina`);
  return actionOk(undefined);
}
