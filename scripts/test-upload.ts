// Test: authed admin can upload to products bucket under its business prefix.
// We do this by signing in via Supabase JS (not SSR), uploading a tiny PNG,
// and verifying the returned public URL is reachable.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data: auth, error: authErr } = await sb.auth.signInWithPassword({
    email: "admin@pizzanapoli.test",
    password: "admin1234",
  });
  if (authErr || !auth.user) throw authErr ?? new Error("no user");

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: mem } = await service
    .from("business_users")
    .select("business_id")
    .eq("user_id", auth.user.id)
    .single();
  const businessId = mem!.business_id;
  console.log("businessId:", businessId);

  // tiny 1x1 red PNG
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x5b, 0xad, 0x33, 0xc3, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  const path = `${businessId}/${crypto.randomUUID()}.png`;
  const { error: upErr } = await sb.storage
    .from("products")
    .upload(path, pngBytes, { contentType: "image/png" });
  if (upErr) throw upErr;

  const { data } = sb.storage.from("products").getPublicUrl(path);
  console.log("Uploaded:", data.publicUrl);

  const res = await fetch(data.publicUrl);
  console.log("Fetch status:", res.status, res.headers.get("content-type"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
