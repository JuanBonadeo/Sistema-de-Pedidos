import "server-only";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { formatCurrency } from "@/lib/currency";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import type { CreateOrderInput } from "./schema";

export type CreateOrderResult = { order_id: string; order_number: number };

export async function persistOrder(
  data: CreateOrderInput,
  userId?: string | null,
): Promise<ActionResult<CreateOrderResult>> {
  const supabase = createSupabaseServiceClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, delivery_fee_cents, min_order_cents")
    .eq("slug", data.business_slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!business) return actionError("Negocio no encontrado.");

  const productIds = [...new Set(data.items.map((i) => i.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, business_id, is_active, is_available")
    .in("id", productIds);
  if (!products || products.length !== productIds.length) {
    return actionError("Algún producto ya no está disponible.");
  }
  for (const p of products) {
    if (p.business_id !== business.id) return actionError("Producto inválido.");
    if (!p.is_active || !p.is_available) {
      return actionError(`"${p.name}" ya no está disponible.`);
    }
  }
  const productById = new Map(products.map((p) => [p.id, p]));

  const allModifierIds = [...new Set(data.items.flatMap((i) => i.modifier_ids))];
  const modifierById = new Map<
    string,
    { id: string; name: string; price_delta_cents: number; is_available: boolean }
  >();
  if (allModifierIds.length > 0) {
    const { data: modifiers } = await supabase
      .from("modifiers")
      .select("id, name, price_delta_cents, is_available")
      .in("id", allModifierIds);
    if (!modifiers || modifiers.length !== allModifierIds.length) {
      return actionError("Algún adicional ya no está disponible.");
    }
    for (const m of modifiers) {
      if (!m.is_available) return actionError("Algún adicional ya no está disponible.");
      modifierById.set(m.id, m);
    }
  }

  let subtotalCents = 0;
  const lines = data.items.map((inputItem) => {
    const product = productById.get(inputItem.product_id)!;
    const modLines = inputItem.modifier_ids.map((id) => {
      const m = modifierById.get(id)!;
      return {
        modifier_id: m.id,
        modifier_name: m.name,
        price_delta_cents: m.price_delta_cents,
      };
    });
    const modsTotal = modLines.reduce((a, m) => a + m.price_delta_cents, 0);
    const lineSubtotal =
      (product.price_cents + modsTotal) * inputItem.quantity;
    subtotalCents += lineSubtotal;
    return {
      product_id: product.id,
      product_name: product.name,
      unit_price_cents: product.price_cents,
      quantity: inputItem.quantity,
      notes: inputItem.notes ?? null,
      subtotal_cents: lineSubtotal,
      modifiers: modLines,
    };
  });

  let deliveryFeeCents = 0;
  if (data.delivery_type === "delivery") {
    const minOrder = Number(business.min_order_cents ?? 0);
    if (minOrder > 0 && subtotalCents < minOrder) {
      return actionError(
        `El pedido mínimo es ${formatCurrency(minOrder)}.`,
      );
    }
    deliveryFeeCents = Number(business.delivery_fee_cents ?? 0);
  }

  const totalCents = subtotalCents + deliveryFeeCents;

  const { data: customer, error: customerErr } = await supabase
    .from("customers")
    .upsert(
      {
        business_id: business.id,
        phone: data.customer_phone,
        name: data.customer_name,
        email: data.customer_email ?? null,
        user_id: userId ?? null,
      },
      { onConflict: "business_id,phone" },
    )
    .select("id")
    .single();
  if (customerErr || !customer) {
    console.error("customer upsert", customerErr);
    return actionError("No pudimos guardar tus datos.");
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: 0,
      business_id: business.id,
      customer_id: customer.id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      delivery_type: data.delivery_type,
      delivery_address: data.delivery_address ?? null,
      delivery_notes: data.delivery_notes ?? null,
      subtotal_cents: subtotalCents,
      delivery_fee_cents: deliveryFeeCents,
      total_cents: totalCents,
      payment_method: "cash_on_delivery",
      payment_status: "pending",
    })
    .select("id, order_number")
    .single();
  if (orderErr || !order) {
    console.error("order insert", orderErr);
    return actionError("No pudimos crear el pedido.");
  }

  for (const line of lines) {
    const { data: inserted, error: lineErr } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        product_id: line.product_id,
        product_name: line.product_name,
        unit_price_cents: line.unit_price_cents,
        quantity: line.quantity,
        notes: line.notes,
        subtotal_cents: line.subtotal_cents,
      })
      .select("id")
      .single();
    if (lineErr || !inserted) {
      console.error("order_item insert", lineErr);
      return actionError("No pudimos guardar los productos del pedido.");
    }
    if (line.modifiers.length > 0) {
      const { error: modErr } = await supabase
        .from("order_item_modifiers")
        .insert(
          line.modifiers.map((m) => ({
            order_item_id: inserted.id,
            modifier_id: m.modifier_id,
            modifier_name: m.modifier_name,
            price_delta_cents: m.price_delta_cents,
          })),
        );
      if (modErr) {
        console.error("order_item_modifier insert", modErr);
        return actionError("No pudimos guardar los adicionales.");
      }
    }
  }

  return actionOk({ order_id: order.id, order_number: order.order_number });
}
