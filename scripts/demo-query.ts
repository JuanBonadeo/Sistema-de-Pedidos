import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

config({ path: ".env.local" });

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug, name, timezone, settings")
    .eq("slug", "pizzanapoli")
    .single();

  console.log("Business:", business);

  const { data: products } = await supabase
    .from("products")
    .select(
      "name, slug, price_cents, category:categories(name), modifier_groups(name, min_selection, max_selection, modifiers(name, price_delta_cents))",
    )
    .eq("business_id", business!.id)
    .order("sort_order");

  console.log(`\nProducts (${products?.length}):`);
  for (const p of products ?? []) {
    console.log(
      `  [${p.category?.name ?? "-"}] ${p.name} · ${(p.price_cents / 100).toFixed(2)}`,
    );
    for (const g of p.modifier_groups ?? []) {
      console.log(
        `    └─ ${g.name} (${g.min_selection}-${g.max_selection}): ${g.modifiers.map((m) => `${m.name}+${m.price_delta_cents / 100}`).join(", ")}`,
      );
    }
  }

  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("name, delivery_fee_cents, estimated_minutes")
    .eq("business_id", business!.id)
    .order("sort_order");

  console.log("\nDelivery zones:");
  for (const z of zones ?? []) {
    console.log(
      `  ${z.name} · $${(z.delivery_fee_cents / 100).toFixed(2)} · ${z.estimated_minutes}min`,
    );
  }

  const { data: hours } = await supabase
    .from("business_hours")
    .select("day_of_week, opens_at, closes_at")
    .eq("business_id", business!.id)
    .order("day_of_week");

  console.log(`\nBusiness hours (${hours?.length} days):`);
  for (const h of hours ?? []) {
    console.log(
      `  day ${h.day_of_week}: ${h.opens_at} - ${h.closes_at}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
