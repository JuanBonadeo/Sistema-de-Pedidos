import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { OrderStatus } from "@/lib/orders/status";

export type AdminOrder = {
  id: string;
  order_number: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: "delivery" | "pickup";
  total_cents: number;
  status: OrderStatus;
  cancelled_reason: string | null;
  items: { product_name: string; quantity: number }[];
};

function startOfTodayUtc(tz: string): Date {
  // Midnight in the business timezone, converted to UTC for the query.
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const pick = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const isoLocal = `${pick("year")}-${pick("month")}-${pick("day")}T00:00:00`;
  // Need to offset by the difference between the tz-local time and UTC.
  const nowInTz = new Date(
    `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}:${pick("second")}Z`,
  );
  const offsetMs = nowInTz.getTime() - now.getTime();
  const localMidnight = new Date(`${isoLocal}Z`);
  return new Date(localMidnight.getTime() - offsetMs);
}

export async function getTodayOrders(
  businessId: string,
  timezone: string,
): Promise<AdminOrder[]> {
  const supabase = await createSupabaseServerClient();
  const since = startOfTodayUtc(timezone).toISOString();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, created_at, customer_name, customer_phone, delivery_type, total_cents, status, cancelled_reason, order_items(product_name, quantity)",
    )
    .eq("business_id", businessId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  return (data ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    created_at: o.created_at,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    delivery_type: o.delivery_type as "delivery" | "pickup",
    total_cents: Number(o.total_cents),
    status: o.status as OrderStatus,
    cancelled_reason: o.cancelled_reason,
    items: (o.order_items ?? []).map((i) => ({
      product_name: i.product_name,
      quantity: i.quantity,
    })),
  }));
}

export async function getOrderDetail(orderId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, order_number, created_at, updated_at,
       customer_name, customer_phone,
       delivery_type, delivery_address, delivery_notes,
       subtotal_cents, delivery_fee_cents, total_cents,
       status, cancelled_reason, payment_method, payment_status,
       delivery_zone:delivery_zones(name, delivery_fee_cents),
       order_items(id, product_name, quantity, unit_price_cents, subtotal_cents, notes,
         order_item_modifiers(modifier_name, price_delta_cents)),
       order_status_history(status, notes, created_at)`,
    )
    .eq("id", orderId)
    .maybeSingle();
  return data;
}
