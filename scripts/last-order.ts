import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data } = await s
    .from("orders")
    .select(
      "order_number, customer_name, customer_phone, delivery_type, delivery_address, subtotal_cents, delivery_fee_cents, total_cents, order_items(product_name, quantity, subtotal_cents, order_item_modifiers(modifier_name))",
    )
    .order("created_at", { ascending: false })
    .limit(1);
  console.log(JSON.stringify(data, null, 2));
}

main();
