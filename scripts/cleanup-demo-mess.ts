/**
 * Cleanup del seed-demo anterior (que metió categorías y productos nuevos
 * por error). Borra solo lo que claramente fue agregado por ese seed,
 * usando slugs hardcodeados.
 *
 * NO toca:
 *   - Categorías que ya existían en seed-rdg-menu (entradas, pastas, postres,
 *     guarniciones, etc.) — incluso si mi seed les pisó station_id, eso
 *     es benigno y se "arregla" volviendo a correr seed-rdg-menu o el seed
 *     nuevo, que vuelve a setear station_id por heurística.
 *   - Productos cuyos slugs coinciden con seed-rdg-menu (provoleta,
 *     mollejas, papas-fritas, etc.). Esos productos quedaron con price/
 *     description de mi seed pisado encima — para restaurar valores
 *     originales, correr `npm run seed:demo-full` (que upsertea con los
 *     precios originales).
 *
 * Uso:
 *   npx tsx scripts/cleanup-demo-mess.ts [slug]
 *
 * Default slug: "golf-jcr".
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SLUG = process.argv[2] ?? "golf-jcr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing env vars.");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Slugs únicos de mi seed (no estaban en seed-rdg-menu) ───────────────────

const PRODUCT_SLUGS_TO_DELETE = [
  // Entradas/Cocina
  "ensalada-cesar", "burrata-con-tomates", "rabas",
  "sorrentinos-de-jamon-y-queso", "noquis-con-tuco", "tallarines-a-la-bolognesa",
  // Pizzas (categoría entera era nueva)
  "pizza-muzzarella", "pizza-napolitana", "pizza-fugazzeta", "pizza-calabresa",
  // Cocina (platos nuevos)
  "suprema-a-la-maryland", "lomo-al-champignon", "salmon-a-la-plancha",
  // Parrilla
  "bife-de-chorizo", "vacio", "pollo-grillado",
  // Sándwiches/Tostados/Hamburguesas
  "sandwich-de-lomo", "sandwich-vegetariano", "sandwich-de-pollo",
  "tostado-mixto", "tostado-completo",
  "hamburguesa-clasica", "hamburguesa-doble-cheddar", "hamburguesa-veggie",
  // Frituras
  "papas-con-cheddar-y-panceta", "aros-de-cebolla", "bastones-de-muzzarella",
  "nuggets-de-pollo",
  // Empanadas (mías eran productos nuevos)
  "empanada-de-carne", "empanada-de-jamon-y-queso", "empanada-de-pollo",
  // Guarniciones nuevas
  "pure-de-papas", "verduras-grilladas",
  // Postres extras
  "helado", "brownie-con-helado",
  // Bebidas
  "agua-saborizada", "gaseosa-coca-cola", "gaseosa-sprite", "limonada",
  // Cervezas
  "quilmes-473cc", "stella-artois-473cc", "patagonia-amber-lager",
  // Vinos
  "malbec-trumpeter", "malbec-rutini", "chardonnay-saint-felicien",
  // Tragos (categoría entera era nueva)
  "aperol-spritz", "fernet-con-coca", "gin-tonic",
];

const CATEGORY_SLUGS_TO_DELETE = [
  // Categorías inventadas que no existían en seed-rdg-menu
  "pizzas", "cocina", "sandwiches", "tostados", "hamburguesas",
  "frituras", "empanadas", "bebidas", "cervezas", "vinos", "tragos",
  "parrilla",
];

async function main() {
  console.log(`\n━━━ Cleanup demo mess → "${SLUG}" ━━━\n`);

  const { data: business } = await supabase
    .from("businesses").select("id, name").eq("slug", SLUG).maybeSingle();
  if (!business) {
    console.error(`✗ Negocio "${SLUG}" no encontrado.`);
    process.exit(1);
  }
  console.log(`✓ ${business.name}\n`);

  // 1. Borrar productos por slug
  console.log(`[productos] borrando ${PRODUCT_SLUGS_TO_DELETE.length} slugs...`);
  const { data: prodIds } = await supabase
    .from("products")
    .select("id, slug")
    .eq("business_id", business.id)
    .in("slug", PRODUCT_SLUGS_TO_DELETE);

  if (prodIds && prodIds.length > 0) {
    const ids = prodIds.map((p) => p.id);

    // Antes de borrar, sacar de order_items la referencia (los nombres
    // quedan como snapshot, está bien). Si la FK es ON DELETE SET NULL,
    // se hace solo. Si es restrict, fallaría.
    const { error: delErr } = await supabase
      .from("products").delete().in("id", ids);
    if (delErr) {
      console.error(`  ✗ ${delErr.message}`);
      console.error(`  ⓘ probablemente hay order_items que referencian estos productos.`);
      console.error(`  ⓘ corré primero el cleanup con --reset-operativo para borrar orders/items.`);
    } else {
      console.log(`  ✓ ${prodIds.length} productos borrados`);
      for (const p of prodIds) console.log(`    · ${p.slug}`);
    }
  } else {
    console.log(`  · nada que borrar`);
  }

  // 2. Borrar categorías por slug. Si quedan productos huérfanos
  // (los que tenían category_id de estas), su category_id se setea null
  // (la FK es on delete set null por convenio del schema).
  console.log(`\n[categorías] borrando ${CATEGORY_SLUGS_TO_DELETE.length} slugs...`);
  const { data: catIds } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("business_id", business.id)
    .in("slug", CATEGORY_SLUGS_TO_DELETE);

  if (catIds && catIds.length > 0) {
    const ids = catIds.map((c) => c.id);
    const { error: delErr } = await supabase
      .from("categories").delete().in("id", ids);
    if (delErr) {
      console.error(`  ✗ ${delErr.message}`);
    } else {
      console.log(`  ✓ ${catIds.length} categorías borradas`);
      for (const c of catIds) console.log(`    · ${c.slug} (${c.name})`);
    }
  } else {
    console.log(`  · nada que borrar`);
  }

  console.log(`\n━━━ Listo ━━━`);
  console.log(`Próximos pasos sugeridos:`);
  console.log(`  1. npm run seed:demo-full  (restaura precios sobreescritos en provoleta, mollejas, etc.)`);
  console.log(`  2. npm run seed:demo:reset (estado operativo + stations + mozos + caja)`);
  console.log();
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
