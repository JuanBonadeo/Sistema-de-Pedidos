/**
 * Bootstrap the first platform admin.
 *
 * Dev (uses defaults):
 *   pnpm tsx scripts/seed-platform-admin.ts
 *   → email=platform@pedidos.test, password=platform1234
 *
 * Prod (provide your own creds):
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   $env:PLATFORM_ADMIN_EMAIL="tu@email.com"
 *   $env:PLATFORM_ADMIN_PASSWORD="una-contra-larga-y-segura"
 *   pnpm tsx scripts/seed-platform-admin.ts
 *
 * Idempotent: safe to re-run.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const PLATFORM_EMAIL =
  process.env.PLATFORM_ADMIN_EMAIL ?? "platform@pedidos.test";
const PLATFORM_PASSWORD =
  process.env.PLATFORM_ADMIN_PASSWORD ?? "platform1234";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Check .env.local or set them as env vars.",
    );
    process.exit(1);
  }
  if (PLATFORM_PASSWORD.length < 8) {
    console.error("PLATFORM_ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }
  // Guardrail for prod: refuse the insecure default against a non-local URL.
  const isLocalSupabase =
    url.includes("localhost") || url.includes("127.0.0.1");
  if (!isLocalSupabase && PLATFORM_PASSWORD === "platform1234") {
    console.error(
      "Refusing to seed a platform admin on a non-local Supabase with the default password. Pass PLATFORM_ADMIN_PASSWORD as an env var.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  let userId =
    users.find((u) => u.email?.toLowerCase() === PLATFORM_EMAIL.toLowerCase())
      ?.id ?? null;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: PLATFORM_EMAIL,
      password: PLATFORM_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`✓ Created auth user ${PLATFORM_EMAIL} (${userId})`);
  } else {
    console.log(`· Auth user already exists: ${PLATFORM_EMAIL} (${userId})`);
  }

  const { error: usersErr } = await supabase
    .from("users")
    .upsert(
      { id: userId, email: PLATFORM_EMAIL, is_platform_admin: true },
      { onConflict: "id" },
    );
  if (usersErr) throw usersErr;

  console.log(
    `✓ Platform admin ready.\n  Login: <your-site>/super/login\n  Email: ${PLATFORM_EMAIL}\n  Pass:  ${PLATFORM_PASSWORD}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
