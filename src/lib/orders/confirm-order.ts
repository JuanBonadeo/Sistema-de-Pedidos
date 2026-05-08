"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { createComandasForItems } from "@/lib/comandas/route-items";
import { resolveStation } from "@/lib/comandas/routing";
import { requireMozoActionContext } from "@/lib/mozo/auth";
import { canConfirmOrder } from "@/lib/permissions/can";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

type GenericClient = SupabaseClient;

export type ConfirmarPedidoResult = {
  order_id: string;
  comanda_ids: string[];
  /** Items que quedaron sin sector (por ej. bebidas en negocios sin "Barra").
   *  Se insertaron al order_item pero NO se imprime comanda — el mozo /
   *  encargado los gestiona directo. El UI los muestra en un aviso. */
  items_without_station: number;
};

/**
 * Toma un pedido entrante (delivery / take-away / web / chatbot) que está en
 * estado `pending` sin comandas, le resuelve sector a cada `order_item` y
 * crea las comandas por sector. Pasa la order a `preparing`.
 *
 * Solo encargado / admin / platform admin (`canConfirmOrder`).
 *
 * Idempotencia: si la order ya tiene comandas (alguien confirmó antes),
 * devuelve OK con la lista vacía y no hace nada — más amigable que un error
 * para race conditions / doble click.
 */
export async function confirmarPedido(
  orderId: string,
  slug: string,
): Promise<ActionResult<ConfirmarPedidoResult>> {
  const business = await getBusiness(slug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  if (!canConfirmOrder(ctxResult.data.role)) {
    return actionError("Solo encargado o admin pueden confirmar pedidos.");
  }

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  // ── Cargar order y validar ──
  const { data: order } = await service
    .from("orders")
    .select("id, business_id, status, delivery_type")
    .eq("id", orderId)
    .maybeSingle();
  type OrderRow = {
    id: string;
    business_id: string;
    status: string;
    delivery_type: string;
  };
  const orderRow = order as OrderRow | null;
  if (!orderRow || orderRow.business_id !== business.id) {
    return actionError("Pedido no encontrado.");
  }
  if (orderRow.delivery_type === "dine_in") {
    return actionError(
      "Los pedidos en mesa no se confirman acá — los carga el mozo desde el salón.",
    );
  }
  if (orderRow.status !== "pending") {
    return actionError(`El pedido ya está en estado "${orderRow.status}".`);
  }

  // Idempotencia: si ya tiene comandas, alguien confirmó antes.
  const { count: existingComandas } = await service
    .from("comandas")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);
  if ((existingComandas ?? 0) > 0) {
    return actionOk({
      order_id: orderId,
      comanda_ids: [],
      items_without_station: 0,
    });
  }

  // ── Cargar items del pedido (ya están en DB, solo falta rutear) ──
  const { data: items } = await service
    .from("order_items")
    .select("id, product_id")
    .eq("order_id", orderId)
    .is("cancelled_at", null);
  type ItemRow = { id: string; product_id: string | null };
  const itemRows = (items ?? []) as ItemRow[];
  if (itemRows.length === 0) {
    return actionError("El pedido no tiene items.");
  }

  // ── Resolver station por producto ──
  const productIds = [
    ...new Set(itemRows.map((i) => i.product_id).filter((id): id is string => !!id)),
  ];
  type ProductRow = {
    id: string;
    station_id: string | null;
    category: { station_id: string | null } | null;
  };
  let productById = new Map<string, ProductRow>();
  if (productIds.length > 0) {
    const { data: productRows } = await service
      .from("products")
      .select("id, station_id, category:categories(station_id)")
      .in("id", productIds);
    productById = new Map(
      ((productRows ?? []) as unknown as ProductRow[]).map((p) => [p.id, p]),
    );
  }

  // ── Update station_id por item + bucketear los que tienen sector ──
  const itemsByStation = new Map<string, string[]>();
  let withoutStation = 0;

  for (const item of itemRows) {
    const product = item.product_id ? productById.get(item.product_id) : null;
    const stationId = product
      ? resolveStation(
          { station_id: product.station_id, category: product.category },
          null,
        )
      : null;

    const { error: updErr } = await service
      .from("order_items")
      .update({
        station_id: stationId,
        kitchen_status: "pending",
      })
      .eq("id", item.id);
    if (updErr) {
      console.error("confirmarPedido · order_item update", updErr);
      return actionError("No pudimos rutear los items.");
    }

    if (stationId) {
      const bucket = itemsByStation.get(stationId) ?? [];
      bucket.push(item.id);
      itemsByStation.set(stationId, bucket);
    } else {
      withoutStation += 1;
    }
  }

  // ── Crear comandas por sector ──
  const route = await createComandasForItems(service, orderId, itemsByStation);
  if (!route.ok) return actionError(route.error);

  // ── Avanzar la order a preparing ──
  const { error: orderErr } = await service
    .from("orders")
    .update({ status: "preparing" })
    .eq("id", orderId);
  if (orderErr) {
    console.error("confirmarPedido · order update", orderErr);
    return actionError("No pudimos avanzar el pedido.");
  }

  revalidatePath(`/${slug}/admin/pedidos`);
  revalidatePath(`/${slug}/mozo`);

  return actionOk({
    order_id: orderId,
    comanda_ids: route.comanda_ids,
    items_without_station: withoutStation,
  });
}
