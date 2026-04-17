import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data } = await s
    .from("customers")
    .select("name, phone, email, created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  console.log(JSON.stringify(data, null, 2));
}

main();
