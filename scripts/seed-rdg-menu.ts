/**
 * Seed: Restaurante del Golf — menú completo (168 productos)
 *
 * Uso:
 *   npx tsx scripts/seed-rdg-menu.ts <business_slug>
 *
 * Por defecto usa "jcr-golf". Cambia el slug si tu negocio se llama distinto.
 *
 * Idempotente: usa upsert por (business_id, slug) en categories y products.
 * Si lo corrés dos veces, los productos quedan iguales (no duplica).
 *
 * Variantes (modifier groups) que crea:
 *   - Empanadas: relleno (carne / jamón y queso / carne cortada a cuchillo +$600)
 *   - Papas fritas: estilo (bastón / española)
 *
 * El resto se carga como productos planos (cervezas con tamaños distintos
 * quedan separadas, helados igual, etc.) — coherente con cómo están en el
 * menú original.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const BUSINESS_SLUG = process.argv[2] ?? "jcr-golf";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// ─── Data ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Entradas",
  "Ensaladas",
  "Menu Clubman",
  "Pastas",
  "Salsas",
  "Minutas",
  "Guarniciones",
  "Nuestra Cocina",
  "Nuestra Parrilla",
  "Postres",
  "Bebidas - Sin Alcohol",
  "Bebidas - Cervezas",
  "Vinos Tintos - Malbec",
  "Vinos Tintos - Cabernet Sauvignon",
  "Vinos Tintos - Cabernet Franc",
  "Vinos Tintos - Pinot Noir",
  "Vinos Tintos - Blend/Corte",
  "Vinos Tintos - Merlot",
  "Vinos Blancos",
  "Vinos - Rosados",
  "Espumantes",
];

type ProductDef = {
  name: string;
  description?: string;
  price_cents: number;
  category: string;
};

const PRODUCTS: ProductDef[] = [
  // Entradas
  { name: "Jamón Crudo", price_cents: 1400000, category: "Entradas" },
  { name: "Ensalada Rusa", price_cents: 650000, category: "Entradas" },
  { name: "Vithel Tonné", price_cents: 1600000, category: "Entradas" },
  { name: "Arrollado casero", price_cents: 1550000, category: "Entradas" },
  // Empanadas se carga con modifier (ver más abajo). El producto base reemplaza
  // las dos filas separadas del menú original.
  { name: "Empanadas", price_cents: 400000, category: "Entradas", description: "Elegí el relleno" },
  { name: "Provoleta", price_cents: 1200000, category: "Entradas" },
  { name: "Provoleta Especial", description: "hojas verdes, jamón crudo y tomate asado", price_cents: 1600000, category: "Entradas" },
  { name: "Rabas con salsa tartara", price_cents: 1800000, category: "Entradas" },
  { name: "Calamarettes rebozados con rucula y parmesano", price_cents: 2700000, category: "Entradas" },
  { name: "Langostinos rebozados en panko con papas rejillas", price_cents: 2400000, category: "Entradas" },

  // Ensaladas
  { name: "Ensalada común", description: "hasta 2 gustos", price_cents: 500000, category: "Ensaladas" },
  { name: "Ensalada completa", description: "3 o más gustos (lechuga, rúcula, radicheta, zanahoria, tomate, cebolla, remolacha, choclo, huevo, apio, repollo)", price_cents: 600000, category: "Ensaladas" },
  { name: "Adicionales", description: "aceitunas, queso, jamón cocido", price_cents: 400000, category: "Ensaladas" },
  { name: "Rúcula y parmesano", price_cents: 700000, category: "Ensaladas" },
  { name: "Rúcula, parmesano y aceitunas negras", price_cents: 850000, category: "Ensaladas" },
  { name: "Capresse", description: "Boconcinos, tomates cherry, aceitunas negras y albahaca", price_cents: 1200000, category: "Ensaladas" },
  { name: "Pollo rebozado", description: "Tiritas de pollo rebozado, mix de hojas verdes, parmesano y choclo", price_cents: 2200000, category: "Ensaladas" },
  { name: "Del Golf", description: "hojas verdes, queso azul, nueces, panceta y peras", price_cents: 2400000, category: "Ensaladas" },

  // Menu Clubman
  { name: "Ñoquis o tallarines con salsa tuco o crema + gaseosa", description: "Infantil", price_cents: 1400000, category: "Menu Clubman" },
  { name: "Milanesa de ternera o milanesa de pollo con papas + gaseosa", description: "Infantil", price_cents: 2100000, category: "Menu Clubman" },

  // Pastas
  { name: "Tallarines", price_cents: 1600000, category: "Pastas" },
  { name: "Ñoquis de papa", price_cents: 1600000, category: "Pastas" },
  { name: "Ravioles de verdura", price_cents: 1800000, category: "Pastas" },
  { name: "Crepes de verdura", price_cents: 1800000, category: "Pastas" },
  { name: "Sorrentinos de muzzarella y jamón", price_cents: 2200000, category: "Pastas" },
  { name: "Sorrentinos de calabaza asada y muzzarella", price_cents: 2200000, category: "Pastas" },
  { name: "Sorrentinos negros de salmón", price_cents: 2500000, category: "Pastas" },

  // Salsas
  { name: "Bolognesa", price_cents: 450000, category: "Salsas" },
  { name: "Cuatro quesos", price_cents: 450000, category: "Salsas" },
  { name: "Pesto", price_cents: 450000, category: "Salsas" },
  { name: "Mediterránea", description: "tomate concasse, olivas negras, alcaparras y albahaca", price_cents: 500000, category: "Salsas" },
  { name: "Graten con salsa blanca", price_cents: 550000, category: "Salsas" },
  { name: "Parisien", price_cents: 550000, category: "Salsas" },
  { name: "Bagnacauda", price_cents: 450000, category: "Salsas" },
  { name: "Pomarola con langostinos", price_cents: 1450000, category: "Salsas" },

  // Minutas
  { name: "Omelette de jamón y queso", price_cents: 1100000, category: "Minutas" },
  { name: "Omelette de caprese", price_cents: 1200000, category: "Minutas" },
  { name: "Revuelto gramajo", price_cents: 1900000, category: "Minutas" },
  { name: "Milanesa", price_cents: 1900000, category: "Minutas" },
  { name: "Milanesa napolitana", price_cents: 2600000, category: "Minutas" },
  { name: "Milanesa de Entrecot", price_cents: 2750000, category: "Minutas" },
  { name: "Milanesa de entrecot napolitana", price_cents: 3250000, category: "Minutas" },
  { name: "Suprema", price_cents: 1650000, category: "Minutas" },
  { name: "Suprema napolitana", price_cents: 2200000, category: "Minutas" },
  { name: "Tortilla de espinaca y langostinos", price_cents: 2500000, category: "Minutas" },
  { name: "Tortilla de papa y cebolla", price_cents: 1400000, category: "Minutas" },
  { name: "Tortilla de verdura", price_cents: 1600000, category: "Minutas" },
  { name: "Merluza a la Romana", price_cents: 1700000, category: "Minutas" },

  // Guarniciones
  { name: "Espinacas al graten", price_cents: 1600000, category: "Guarniciones" },
  { name: "Puré", price_cents: 800000, category: "Guarniciones" },
  { name: "Puré de manzana", price_cents: 600000, category: "Guarniciones" },
  // Papas fritas se carga con modifier "Estilo" (bastón / española).
  { name: "Papas fritas", description: "Elegí estilo", price_cents: 850000, category: "Guarniciones" },
  { name: "Papas rejilla", price_cents: 950000, category: "Guarniciones" },
  { name: "Papas a la provenzal", price_cents: 1100000, category: "Guarniciones" },
  { name: "Papas a la crema", price_cents: 1200000, category: "Guarniciones" },
  { name: "Papas gratinadas", price_cents: 1500000, category: "Guarniciones" },

  // Nuestra Cocina
  { name: "Fillet de pollo con puerros, panceta y champignones", price_cents: 2900000, category: "Nuestra Cocina" },
  { name: "Lomo en reducción de coñac y crocante de panceta", price_cents: 3800000, category: "Nuestra Cocina" },
  { name: "Lomo relleno con queso provolone", price_cents: 3800000, category: "Nuestra Cocina" },
  { name: "Entrecot en salsa ahumada de hongos de pino", price_cents: 3600000, category: "Nuestra Cocina" },
  { name: "Matambrito a la pizza", price_cents: 3800000, category: "Nuestra Cocina" },
  { name: "Mollejas al jerez con verdeo y dados de papas", price_cents: 3700000, category: "Nuestra Cocina" },
  { name: "Costillas de cerdo a la barbacoa", price_cents: 2800000, category: "Nuestra Cocina" },
  { name: "Matambrito de cerdo al roquefort con nueces", price_cents: 3800000, category: "Nuestra Cocina" },
  { name: "Calamarettes a la leonesa", price_cents: 3200000, category: "Nuestra Cocina" },
  { name: "Salmón rosado con crema de camarones", price_cents: 3800000, category: "Nuestra Cocina" },
  { name: "Salmón en salsa de limón con salteado de espinacas y champignones", price_cents: 3800000, category: "Nuestra Cocina" },

  // Nuestra Parrilla
  { name: "Mollejas", price_cents: 2150000, category: "Nuestra Parrilla" },
  { name: "Chinchulines", price_cents: 1100000, category: "Nuestra Parrilla" },
  { name: "Chorizo", price_cents: 460000, category: "Nuestra Parrilla" },
  { name: "Morcilla", price_cents: 350000, category: "Nuestra Parrilla" },
  { name: "Asado de tira", price_cents: 3900000, category: "Nuestra Parrilla" },
  { name: "Entrecot", price_cents: 2750000, category: "Nuestra Parrilla" },
  { name: "Ojo de bife", price_cents: 3300000, category: "Nuestra Parrilla" },
  { name: "Lomo", price_cents: 3250000, category: "Nuestra Parrilla" },
  { name: "Filet de pollo", price_cents: 2100000, category: "Nuestra Parrilla" },
  { name: "Matambre de cerdo", price_cents: 3200000, category: "Nuestra Parrilla" },
  { name: "Brochette de lomo", price_cents: 3300000, category: "Nuestra Parrilla" },
  { name: "Brochette de pollo", price_cents: 2650000, category: "Nuestra Parrilla" },
  { name: "Salmón grille", price_cents: 3600000, category: "Nuestra Parrilla" },
  { name: "Pacu Grillado", price_cents: 2500000, category: "Nuestra Parrilla" },

  // Postres
  { name: "Helado Simple", price_cents: 450000, category: "Postres" },
  { name: "Helado doble", price_cents: 600000, category: "Postres" },
  { name: "Helado Sambayón", price_cents: 550000, category: "Postres" },
  { name: "Helado Sambayón Doble", price_cents: 750000, category: "Postres" },
  { name: "Ensalada de frutas", price_cents: 500000, category: "Postres" },
  { name: "Flan casero", price_cents: 700000, category: "Postres" },
  { name: "Macedonia", price_cents: 800000, category: "Postres" },
  { name: "Tortilla de manzanas Normanda", description: "para 4 personas con sambayon batido, ananá y cerezas al marrasquino", price_cents: 2600000, category: "Postres" },
  { name: "Tiramisú", price_cents: 1000000, category: "Postres" },
  { name: "Queso, higos en almibar, dulce de cayote y nueces", price_cents: 1500000, category: "Postres" },
  { name: "Mousse de chocolate", price_cents: 1000000, category: "Postres" },
  { name: "Mousse de naranjas", price_cents: 1000000, category: "Postres" },
  { name: "Panqueques de dulce de leche", price_cents: 900000, category: "Postres" },
  { name: "Pera al vino tinto con helado", price_cents: 900000, category: "Postres" },
  { name: "Sambayón batido con nueces", price_cents: 1400000, category: "Postres" },

  // Bebidas - Sin Alcohol
  { name: "Agua Mineral", price_cents: 300000, category: "Bebidas - Sin Alcohol" },
  { name: "Gaseosas", price_cents: 350000, category: "Bebidas - Sin Alcohol" },

  // Bebidas - Cervezas
  { name: "Andes Rubia 473 cc", price_cents: 450000, category: "Bebidas - Cervezas" },
  { name: "Stella Artois Rubia 473 cc", price_cents: 550000, category: "Bebidas - Cervezas" },
  { name: "Stella Artois Noire 473 cc", price_cents: 590000, category: "Bebidas - Cervezas" },
  { name: "Andes Rubia 1 Lt", price_cents: 750000, category: "Bebidas - Cervezas" },
  { name: "Stella Artois Rubia 1 Lt", price_cents: 850000, category: "Bebidas - Cervezas" },
  { name: "Stella Artois Noire 1 Lt", price_cents: 850000, category: "Bebidas - Cervezas" },

  // Vinos Tintos - Malbec
  { name: "Jockey Club Rosario", description: "Bodega Monteviejo", price_cents: 1600000, category: "Vinos Tintos - Malbec" },
  { name: "Jockey Club Rosario Reserva", description: "Bodega Monteviejo", price_cents: 2200000, category: "Vinos Tintos - Malbec" },
  { name: "Crios", description: "Susana Balbo", price_cents: 1100000, category: "Vinos Tintos - Malbec" },
  { name: "Las Perdices", price_cents: 1600000, category: "Vinos Tintos - Malbec" },
  { name: "Uno Bodega Antigal", price_cents: 1700000, category: "Vinos Tintos - Malbec" },
  { name: "Punto final Reserva", price_cents: 2200000, category: "Vinos Tintos - Malbec" },
  { name: "Las Perdices Reserva", price_cents: 2100000, category: "Vinos Tintos - Malbec" },
  { name: "Cuvelier Los Andes", price_cents: 3300000, category: "Vinos Tintos - Malbec" },
  { name: "Nicasia", price_cents: 1950000, category: "Vinos Tintos - Malbec" },
  { name: "Saint Felicien", price_cents: 2000000, category: "Vinos Tintos - Malbec" },
  { name: "D.V. Catena Malbec/Malbec", price_cents: 3900000, category: "Vinos Tintos - Malbec" },
  { name: "Colome Estate", price_cents: 2600000, category: "Vinos Tintos - Malbec" },
  { name: "Trumpeter", price_cents: 1450000, category: "Vinos Tintos - Malbec" },
  { name: "Trumpeter Reserve", price_cents: 1950000, category: "Vinos Tintos - Malbec" },
  { name: "Rutini", price_cents: 3800000, category: "Vinos Tintos - Malbec" },
  { name: "Salentein Reserva", price_cents: 1900000, category: "Vinos Tintos - Malbec" },
  { name: "Salentein Numina", price_cents: 3000000, category: "Vinos Tintos - Malbec" },

  // Vinos Tintos - Cabernet Sauvignon
  { name: "Cuvelier Los Andes Cabernet Sauvignon", price_cents: 2800000, category: "Vinos Tintos - Cabernet Sauvignon" },
  { name: "Angelica Zapata Alta", price_cents: 4000000, category: "Vinos Tintos - Cabernet Sauvignon" },

  // Vinos Tintos - Cabernet Franc
  { name: "Ala Colorada", price_cents: 2450000, category: "Vinos Tintos - Cabernet Franc" },
  { name: "Punto final Reserva Cabernet Franc", price_cents: 2200000, category: "Vinos Tintos - Cabernet Franc" },
  { name: "Saint Felicien Cabernet Franc", price_cents: 2200000, category: "Vinos Tintos - Cabernet Franc" },
  { name: "Salentein Numina Cabernet Franc", price_cents: 3000000, category: "Vinos Tintos - Cabernet Franc" },
  { name: "Rutini Cabernet Franc", price_cents: 3600000, category: "Vinos Tintos - Cabernet Franc" },

  // Vinos Tintos - Pinot Noir
  { name: "Las Perdices Reserva Pinot Noir", price_cents: 2300000, category: "Vinos Tintos - Pinot Noir" },
  { name: "Salentein Numina Pinot Noir", price_cents: 2900000, category: "Vinos Tintos - Pinot Noir" },

  // Vinos Tintos - Blend/Corte
  { name: "Las Perdices Red Blend", price_cents: 1600000, category: "Vinos Tintos - Blend/Corte" },
  { name: "Amalaya Corte de Origen", price_cents: 1800000, category: "Vinos Tintos - Blend/Corte" },
  { name: "Amalaya Gran Corte", price_cents: 2250000, category: "Vinos Tintos - Blend/Corte" },
  { name: "Amalaya Corte Unico", price_cents: 3900000, category: "Vinos Tintos - Blend/Corte" },
  { name: "Clos de los 7 by Michel Rolland", price_cents: 3400000, category: "Vinos Tintos - Blend/Corte" },
  { name: "Cuvelier Los Andes Coleccion", price_cents: 3400000, category: "Vinos Tintos - Blend/Corte" },
  { name: "D.V. Catena Cabernet/Malbec", price_cents: 3050000, category: "Vinos Tintos - Blend/Corte" },
  { name: "Rutini Cabernet/Malbec", price_cents: 2500000, category: "Vinos Tintos - Blend/Corte" },
  { name: "Milamore", description: "Dried Grapes", price_cents: 3600000, category: "Vinos Tintos - Blend/Corte" },
  { name: "Las Perdices Don Juan", price_cents: 3750000, category: "Vinos Tintos - Blend/Corte" },

  // Vinos Tintos - Merlot
  { name: "Cuvelier Los Andes Merlot", price_cents: 3850000, category: "Vinos Tintos - Merlot" },

  // Vinos Blancos
  { name: "Crios Chardonnay", price_cents: 1100000, category: "Vinos Blancos" },
  { name: "Las Perdices Sauvignon Blanc", price_cents: 1600000, category: "Vinos Blancos" },
  { name: "Trumpeter Sauvignon Blanc", price_cents: 1450000, category: "Vinos Blancos" },
  { name: "Salentein Reserva Sauvignon Blanc", price_cents: 1850000, category: "Vinos Blancos" },
  { name: "Salentein Numina Chardonnay", price_cents: 3000000, category: "Vinos Blancos" },
  { name: "DV Catena Chardonnay", price_cents: 2700000, category: "Vinos Blancos" },
  { name: "Rutini Chardonnay", price_cents: 3400000, category: "Vinos Blancos" },
  { name: "Rutini Sauvignon Blanc", price_cents: 2500000, category: "Vinos Blancos" },

  // Vinos - Rosados
  { name: "Crios Rosado", price_cents: 1100000, category: "Vinos - Rosados" },
  { name: "Trumpeter Reserve Rosado", price_cents: 1750000, category: "Vinos - Rosados" },
  { name: "Las Perdices Exploracion Rose", price_cents: 2650000, category: "Vinos - Rosados" },

  // Espumantes
  { name: "Amalaya Torrontes Riesling", price_cents: 1800000, category: "Espumantes" },
  { name: "Salentein Brut Nature", price_cents: 2450000, category: "Espumantes" },
  { name: "Baron B Extra Brut", price_cents: 5050000, category: "Espumantes" },
];

// Modifier groups: nombre del producto + grupo + opciones
type ModifierGroupDef = {
  product_name: string;
  group_name: string;
  is_required: boolean;
  min_selection: number;
  max_selection: number;
  modifiers: { name: string; price_delta_cents: number }[];
};

const MODIFIER_GROUPS: ModifierGroupDef[] = [
  {
    product_name: "Empanadas",
    group_name: "Relleno",
    is_required: true,
    min_selection: 1,
    max_selection: 1,
    modifiers: [
      { name: "Carne", price_delta_cents: 0 },
      { name: "Jamón y queso", price_delta_cents: 0 },
      { name: "Carne cortada a cuchillo", price_delta_cents: 60000 },
    ],
  },
  {
    product_name: "Papas fritas",
    group_name: "Estilo",
    is_required: true,
    min_selection: 1,
    max_selection: 1,
    modifiers: [
      { name: "Bastón", price_delta_cents: 0 },
      { name: "Española", price_delta_cents: 0 },
    ],
  },
];

// ─── Run ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding menú de Restaurante del Golf → business slug "${BUSINESS_SLUG}"\n`);

  // 1. Find business
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("slug", BUSINESS_SLUG)
    .maybeSingle();
  if (bizErr || !business) {
    console.error(`✗ No se encontró ningún negocio con slug "${BUSINESS_SLUG}".`);
    console.error(`  Pasale el slug correcto: npx tsx scripts/seed-rdg-menu.ts <slug>`);
    process.exit(1);
  }
  console.log(`✓ Negocio: ${business.name} (${business.id})\n`);

  // 2. Upsert categories
  console.log(`Insertando ${CATEGORIES.length} categorías...`);
  const categoryIdMap = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i += 1) {
    const name = CATEGORIES[i]!;
    const slug = slugify(name);
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        {
          business_id: business.id,
          name,
          slug,
          sort_order: i,
          is_active: true,
        },
        { onConflict: "business_id,slug" },
      )
      .select("id")
      .single();
    if (error || !data) {
      console.error(`  ✗ ${name}:`, error?.message);
      continue;
    }
    categoryIdMap.set(name, data.id);
  }
  console.log(`  ${categoryIdMap.size}/${CATEGORIES.length} ok\n`);

  // 3. Upsert products
  console.log(`Insertando ${PRODUCTS.length} productos...`);
  const productIdMap = new Map<string, string>();
  let okCount = 0;
  for (let i = 0; i < PRODUCTS.length; i += 1) {
    const p = PRODUCTS[i]!;
    const slug = slugify(p.name);
    const categoryId = categoryIdMap.get(p.category) ?? null;
    const { data, error } = await supabase
      .from("products")
      .upsert(
        {
          business_id: business.id,
          category_id: categoryId,
          name: p.name,
          slug,
          description: p.description ?? null,
          price_cents: p.price_cents,
          is_active: true,
          is_available: true,
          sort_order: i,
        },
        { onConflict: "business_id,slug" },
      )
      .select("id")
      .single();
    if (error || !data) {
      console.error(`  ✗ ${p.name}:`, error?.message);
      continue;
    }
    productIdMap.set(p.name, data.id);
    okCount += 1;
  }
  console.log(`  ${okCount}/${PRODUCTS.length} ok\n`);

  // 4. Modifier groups
  console.log(`Configurando ${MODIFIER_GROUPS.length} grupos de modifiers...`);
  for (const mg of MODIFIER_GROUPS) {
    const productId = productIdMap.get(mg.product_name);
    if (!productId) {
      console.error(`  ✗ ${mg.product_name}: producto no encontrado`);
      continue;
    }

    // Borrar grupos previos (reseteamos el modifier para evitar duplicados al re-correr)
    await supabase.from("modifier_groups").delete().eq("product_id", productId);

    const { data: groupRow, error: groupErr } = await supabase
      .from("modifier_groups")
      .insert({
        business_id: business.id,
        product_id: productId,
        name: mg.group_name,
        min_selection: mg.min_selection,
        max_selection: mg.max_selection,
        is_required: mg.is_required,
        sort_order: 0,
      })
      .select("id")
      .single();
    if (groupErr || !groupRow) {
      console.error(`  ✗ ${mg.product_name} → grupo:`, groupErr?.message);
      continue;
    }

    let mOk = 0;
    for (let j = 0; j < mg.modifiers.length; j += 1) {
      const m = mg.modifiers[j]!;
      const { error } = await supabase.from("modifiers").insert({
        group_id: groupRow.id,
        name: m.name,
        price_delta_cents: m.price_delta_cents,
        is_available: true,
        sort_order: j,
      });
      if (!error) mOk += 1;
      else console.error(`  ✗ ${mg.product_name} → ${m.name}:`, error.message);
    }
    console.log(`  ✓ ${mg.product_name}: ${mg.group_name} (${mOk}/${mg.modifiers.length} opciones)`);
  }
  console.log();
  console.log(`✓ Listo.`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
