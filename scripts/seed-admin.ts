import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const ADMIN_EMAIL = "admin@pizzanapoli.test";
const ADMIN_PASSWORD = "admin1234";
const BUSINESS_SLUG = "pizzanapoli";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email === email)?.id ?? null;
}

async function main() {
  // 1. Ensure auth user exists
  let userId = await findUserIdByEmail(ADMIN_EMAIL);

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user ${ADMIN_EMAIL} (${userId})`);
  } else {
    console.log(`Auth user ${ADMIN_EMAIL} already exists (${userId})`);
  }

  // 2. Upsert public.users row
  const { error: usersErr } = await supabase
    .from("users")
    .upsert({ id: userId, email: ADMIN_EMAIL }, { onConflict: "id" });
  if (usersErr) throw usersErr;

  // 3. Find business by slug
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", BUSINESS_SLUG)
    .single();
  if (bizErr) throw bizErr;

  // 4. Upsert business_users membership
  const { error: membershipErr } = await supabase
    .from("business_users")
    .upsert(
      { business_id: business.id, user_id: userId, role: "admin" },
      { onConflict: "business_id,user_id" },
    );
  if (membershipErr) throw membershipErr;

  console.log(
    `✓ Admin ready: email=${ADMIN_EMAIL} password=${ADMIN_PASSWORD} business=${BUSINESS_SLUG}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
