import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const PLATFORM_EMAIL = process.env.PLATFORM_ADMIN_EMAIL ?? "platform@pedidos.test";
const PLATFORM_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD ?? "platform1234";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ perPage: 200 });
  let userId = users.find((u) => u.email === PLATFORM_EMAIL)?.id ?? null;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: PLATFORM_EMAIL,
      password: PLATFORM_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user ${PLATFORM_EMAIL} (${userId})`);
  } else {
    console.log(`Auth user ${PLATFORM_EMAIL} already exists (${userId})`);
  }

  const { error: usersErr } = await supabase
    .from("users")
    .upsert(
      { id: userId, email: PLATFORM_EMAIL, is_platform_admin: true },
      { onConflict: "id" },
    );
  if (usersErr) throw usersErr;

  console.log(
    `✓ Platform admin ready: email=${PLATFORM_EMAIL} password=${PLATFORM_PASSWORD}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
