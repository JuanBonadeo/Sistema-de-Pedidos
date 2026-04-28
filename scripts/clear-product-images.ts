/**
 * Borra (set NULL) todas las imágenes de productos de un negocio.
 *
 * Uso:
 *   npx tsx scripts/clear-product-images.ts <business_slug>
 *
 * Por defecto usa "jcr-golf". No borra los productos — solo limpia la columna
 * `image_url`. Después podés volver a correr el generador desde el admin
 * o cargar fotos manualmente.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const BUSINESS_SLUG = process.argv[2] ?? "jcr-golf";

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

async function main() {
  console.log(`Limpiando imágenes de productos del negocio "${BUSINESS_SLUG}"...\n`);

  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("slug", BUSINESS_SLUG)
    .maybeSingle();
  if (bizErr || !business) {
    console.error(`✗ Negocio "${BUSINESS_SLUG}" no encontrado.`);
    process.exit(1);
  }
  console.log(`✓ Negocio: ${business.name} (${business.id})`);

  // Cuento cuántos productos tienen imagen actualmente
  const { count: withImage } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .not("image_url", "is", null);
  console.log(`  ${withImage ?? 0} productos con imagen.\n`);

  if ((withImage ?? 0) === 0) {
    console.log("Nada para limpiar. Salgo.");
    return;
  }

  const { error, count } = await supabase
    .from("products")
    .update({ image_url: null }, { count: "exact" })
    .eq("business_id", business.id)
    .not("image_url", "is", null);
  if (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
  console.log(`✓ Limpiadas ${count ?? 0} imágenes.`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
