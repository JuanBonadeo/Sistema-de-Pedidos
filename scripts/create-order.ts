import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: business } = await s
    .from("businesses")
    .select("id")
    .eq("slug", "pizzanapoli")
    .single();

  const { data: product } = await s
    .from("products")
    .select("id, name, price_cents")
    .eq("slug", "napolitana")
    .single();

  const { data: order } = await s
    .from("orders")
    .insert({
      order_number: 0,
      business_id: business!.id,
      customer_name: "Realtime Test",
      customer_phone: "+549111" + Date.now().toString().slice(-7),
      delivery_type: "pickup",
      subtotal_cents: Number(product!.price_cents),
      total_cents: Number(product!.price_cents),
    })
    .select("id, order_number")
    .single();

  await s.from("order_items").insert({
    order_id: order!.id,
    product_id: product!.id,
    product_name: product!.name,
    unit_price_cents: product!.price_cents,
    quantity: 1,
    subtotal_cents: product!.price_cents,
  });

  console.log(`Created order #${order!.order_number} (${order!.id})`);
}

main();
