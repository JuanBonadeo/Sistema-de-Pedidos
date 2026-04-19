import "server-only";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { formatCurrency } from "@/lib/currency";
import { createPreference } from "@/lib/payments/mercadopago";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import type { CreateOrderInput } from "./schema";

export type CreateOrderResult = {
  order_id: string;
  order_number: number;
  /**
   * Present when the order was placed with MP as payment method and the
   * business has MP configured. Client should redirect to this URL to
   * complete the payment.
   */
  mp_init_point?: string;
};

function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const proto = rootDomain.includes("localhost") ? "http" : "https";
  return `${proto}://${rootDomain}`;
}

export async function persistOrder(
  data: CreateOrderInput,
  userId?: string | null,
): Promise<ActionResult<CreateOrderResult>> {
  const supabase = createSupabaseServiceClient();

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, slug, delivery_fee_cents, min_order_cents, mp_access_token, mp_accepts_payments",
    )
    .eq("slug", data.business_slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!business) return actionError("Negocio no encontrado.");

  const requestedPayment = data.payment_method ?? "cash";
  const wantsMp = requestedPayment === "mp";
  const mpEnabled = Boolean(
    business.mp_accepts_payments && business.mp_access_token,
  );
  if (wantsMp && !mpEnabled) {
    return actionError("Este negocio no acepta Mercado Pago por ahora.");
  }
  const paymentMethod = wantsMp ? "mp" : "cash";

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
      payment_method: paymentMethod,
      payment_status: "pending",
    })
    .select("id, order_number")
    .single();
  if (orderErr || !order) {
    console.error("order insert", orderErr);
    return actionError("No pudimos crear el pedido.");
  }

  // Persist the delivery address for this customer, idempotently. We dedupe
  // by exact street match so repeat orders to the same place don't stack.
  if (data.delivery_type === "delivery" && data.delivery_address) {
    const street = data.delivery_address;
    const { data: existing } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("street", street)
      .maybeSingle();
    if (!existing) {
      await supabase
        .from("customer_addresses")
        .insert({ customer_id: customer.id, street });
    }
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

  // If the customer chose MP, create the preference in their MP account and
  // hand the init_point back to the client so it can redirect. The order is
  // already persisted with payment_status='pending'; the webhook upgrades it
  // to 'paid' / 'failed' once MP reports the outcome.
  let mpInitPoint: string | undefined;
  if (wantsMp && business.mp_access_token) {
    // MP rejects zero-amount preferences. This shouldn't happen in practice
    // (cart validation catches it earlier) but guard anyway.
    if (totalCents <= 0) {
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);
      return actionError("El total del pedido es 0, no se puede pagar online.");
    }
    try {
      const pref = await createPreference({
        accessToken: business.mp_access_token,
        siteUrl: getSiteUrl(),
        businessId: business.id,
        businessSlug: business.slug,
        orderId: order.id,
        orderNumber: order.order_number,
        items: lines.map((l) => ({
          id: l.product_id,
          title: l.product_name,
          quantity: l.quantity,
          unit_price: Math.round(
            (l.unit_price_cents +
              l.modifiers.reduce((a, m) => a + m.price_delta_cents, 0)) /
              100,
          ),
        })),
        payer: {
          name: data.customer_name,
          email: data.customer_email,
          phone: data.customer_phone,
        },
      });
      // Best-effort: if the update fails we still let the customer pay, we
      // just lose the preference_id pointer for reconciliation.
      await supabase
        .from("orders")
        .update({ mp_preference_id: pref.preferenceId })
        .eq("id", order.id);
      mpInitPoint = pref.initPoint;
    } catch (err) {
      console.error("MP createPreference failed", err);
      // Don't block the order — mark payment as failed so the admin sees it.
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);
      return actionError(
        "No pudimos conectar con Mercado Pago. Probá de nuevo o elegí efectivo.",
      );
    }
  }

  return actionOk({
    order_id: order.id,
    order_number: order.order_number,
    mp_init_point: mpInitPoint,
  });
}
