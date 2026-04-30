/**
 * Seed de estado operativo del mozo para demo.
 *
 * Pobla las mesas con:
 *  - operational_status variados (ocupada, esperando_pedido, esperando_cuenta, limpiar)
 *  - opened_at para las mesas ocupadas
 *  - Órdenes dine_in de hoy linkeadas a las mesas
 *  - order_items con kitchen_status variados
 *  - Reservas de hoy (confirmed)
 *
 * Requiere haber corrido seed-golf-jcr-demo.ts antes (necesita mesas y productos).
 *
 * Uso:
 *   npx tsx scripts/seed-mozo-demo.ts [business_slug]
 *
 * Es idempotente en el sentido de que actualiza el estado — pero agrega
 * órdenes nuevas cada vez. Para limpiar: borrá las orders de hoy a mano.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const BUSINESS_SLUG = process.argv[2] ?? "golf-jcr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing env vars.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function minsAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

function todayAt(h: number, m = 0): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const CUSTOMER_NAMES = [
  "María González", "Diego Martínez", "Sofía Rodríguez",
  "Pablo Romero", "Laura Fernández", "Martín López",
  "Carolina Sánchez", "Agustina Silva", "Lucas Benítez",
];

const RESERVATION_NOTES = [
  null, null, "Cumpleaños", "Mesa cerca de la ventana",
  "Aniversario", "Vienen con un bebé", "Un comensal celíaco",
];

async function main() {
  console.log(`Mozo demo seed → "${BUSINESS_SLUG}"\n`);

  // Business
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("slug", BUSINESS_SLUG)
    .maybeSingle();
  if (!business) { console.error("Negocio no encontrado."); process.exit(1); }
  console.log(`✓ ${business.name}\n`);

  // Floor plan + mesas
  const { data: fp } = await supabase
    .from("floor_plans")
    .select("id")
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();
  if (!fp) { console.error("Sin floor plan. Corré seed-golf-jcr-demo.ts primero."); process.exit(1); }

  const { data: tables } = await supabase
    .from("tables")
    .select("id, label, seats")
    .eq("floor_plan_id", fp.id)
    .eq("status", "active")
    .order("label");
  if (!tables || tables.length === 0) { console.error("Sin mesas activas."); process.exit(1); }
  console.log(`✓ ${tables.length} mesas\n`);

  // Productos
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .limit(30);
  if (!products || products.length === 0) { console.error("Sin productos."); process.exit(1); }
  console.log(`✓ ${products.length} productos\n`);

  // ── Estado de mesas ───────────────────────────────────────────────────────
  // Asignamos operational_status a cada mesa según su índice para que la demo
  // tenga variedad visual. Con 12 mesas:
  // 0,1 → ocupada (con orden dine_in)
  // 2   → esperando_pedido (con orden)
  // 3   → esperando_cuenta (con orden)
  // 4   → limpiar
  // 5+  → libre

  type MesaState = {
    operational_status: "libre" | "ocupada" | "esperando_pedido" | "esperando_cuenta" | "limpiar";
    opened_at: string | null;
  };

  const mesaStates: MesaState[] = [
    { operational_status: "ocupada",          opened_at: minsAgo(38) },
    { operational_status: "esperando_cuenta", opened_at: minsAgo(72) },
    { operational_status: "ocupada",          opened_at: minsAgo(14) },
    { operational_status: "esperando_pedido", opened_at: minsAgo(5)  },
    { operational_status: "limpiar",          opened_at: null         },
    { operational_status: "ocupada",          opened_at: minsAgo(22) },
  ];

  console.log("Actualizando estados de mesas...");
  for (let i = 0; i < tables.length; i++) {
    const state = mesaStates[i] ?? { operational_status: "libre" as const, opened_at: null };
    const { error } = await supabase
      .from("tables")
      .update({ operational_status: state.operational_status, opened_at: state.opened_at })
      .eq("id", tables[i]!.id);
    if (error) console.error(`  ✗ mesa ${tables[i]!.label}:`, error.message);
    else console.log(`  ✓ Mesa ${tables[i]!.label} → ${state.operational_status}`);
  }

  // ── Órdenes dine_in de hoy ────────────────────────────────────────────────
  // Creamos órdenes para las mesas que no están libres ni en limpiar
  const mesasConOrden = tables
    .map((t, i) => ({ ...t, state: mesaStates[i] }))
    .filter((t) =>
      t.state &&
      t.state.operational_status !== "libre" &&
      t.state.operational_status !== "limpiar",
    );

  const kitchenStatusByMesaStatus: Record<string, "pending" | "preparing" | "ready" | "delivered"> = {
    ocupada: "preparing",
    esperando_pedido: "pending",
    esperando_cuenta: "ready",
  };

  console.log(`\nCreando ${mesasConOrden.length} órdenes dine_in...`);

  for (const mesa of mesasConOrden) {
    const itemCount = 2 + Math.floor(Math.random() * 3);
    const chosenProducts = Array.from({ length: itemCount }, () => rand(products));
    let subtotal = 0;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        business_id: business.id,
        order_number: 0,
        customer_name: rand(CUSTOMER_NAMES),
        customer_phone: "+5493415551000",
        delivery_type: "dine_in",
        table_id: mesa.id,
        status: "preparing",
        subtotal_cents: 0, // se recalcula abajo
        delivery_fee_cents: 0,
        discount_cents: 0,
        total_cents: 0,
        payment_method: "cash_on_delivery",
        payment_status: "pending",
        created_at: mesa.state?.opened_at ?? minsAgo(10),
        updated_at: mesa.state?.opened_at ?? minsAgo(10),
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      console.error(`  ✗ orden para mesa ${mesa.label}:`, orderErr?.message);
      continue;
    }

    const kitchenStatus = kitchenStatusByMesaStatus[mesa.state?.operational_status ?? "ocupada"] ?? "preparing";

    const items = chosenProducts.map((p) => {
      const qty = 1 + Math.floor(Math.random() * 2);
      const itemSubtotal = Number(p.price_cents) * qty;
      subtotal += itemSubtotal;
      return {
        order_id: order.id,
        product_id: p.id,
        product_name: p.name,
        unit_price_cents: Number(p.price_cents),
        quantity: qty,
        subtotal_cents: itemSubtotal,
        kitchen_status: kitchenStatus,
      };
    });

    await supabase.from("order_items").insert(items);
    await supabase
      .from("orders")
      .update({ subtotal_cents: subtotal, total_cents: subtotal })
      .eq("id", order.id);

    // Linkear current_order_id en la mesa
    await supabase
      .from("tables")
      .update({ current_order_id: order.id })
      .eq("id", mesa.id);

    console.log(`  ✓ Mesa ${mesa.label} → orden #${order.order_number} (${kitchenStatus})`);
  }

  // ── Reservas de hoy ───────────────────────────────────────────────────────
  console.log("\nCreando reservas de hoy...");

  const slots = [
    { h: 13, m: 0 }, { h: 13, m: 30 },
    { h: 20, m: 30 }, { h: 21, m: 0 }, { h: 21, m: 30 },
  ];

  // Usar mesas que están libres o como referencia futura
  const mesasLibres = tables.slice(4); // las que no tienen orden

  let resOk = 0;
  for (let i = 0; i < Math.min(slots.length, mesasLibres.length); i++) {
    const slot = slots[i]!;
    const mesa = mesasLibres[i]!;
    const startsAt = new Date();
    startsAt.setHours(slot.h, slot.m, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 90 * 60_000);

    const { error } = await supabase.from("reservations").insert({
      business_id: business.id,
      table_id: mesa.id,
      customer_name: rand(CUSTOMER_NAMES),
      customer_phone: "+5493415551000",
      party_size: 2 + Math.floor(Math.random() * 5),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
      notes: rand(RESERVATION_NOTES),
      source: "web",
    });

    if (error) {
      // Puede fallar por exclusion constraint (overlap) — ignorar en demo
      console.log(`  ~ Mesa ${mesa.label} ${slot.h}:${String(slot.m).padStart(2, "0")} → overlap, omitida`);
    } else {
      console.log(`  ✓ Mesa ${mesa.label} reservada a las ${slot.h}:${String(slot.m).padStart(2, "0")}`);
      resOk++;
    }
  }
  console.log(`  ${resOk} reservas creadas`);

  console.log(`\n✓ Demo de mozo lista en "${BUSINESS_SLUG}". Abrí /${BUSINESS_SLUG}/mozo.`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
