/**
 * Seed para encender la demo del producto.
 *
 * NO toca el catálogo (productos / categorías) ni las mesas que ya existan.
 * Asume que ya corriste `npm run seed:demo-full` (o equivalente) para tener
 * negocio + categorías + productos + un floor plan.
 *
 * Lo que hace:
 *
 *   1. Stations de cocina: Cocina, Parrilla, Sandwichera, Fritera, Bar.
 *   2. Asocia cada categoría existente a una station por heurística de
 *      nombre (parrilla → Parrilla, vino/cerveza/bebida → Bar, etc.).
 *      Si la categoría ya tenía station_id, no la pisa.
 *   3. Crea (si no existe) un segundo floor plan "Terraza" con 6 mesas más,
 *      para mostrar multi-sector / multi-salón.
 *   4. Equipo: 1 admin + 1 encargada + 3 mozos (auth users con password
 *      `demo1234`). Idempotente.
 *   5. Caja Principal + turno abierto (apertura $50.000) con 4 cobros del día.
 *   6. Estado operativo: 4 mesas ocupadas con orders + items + comandas
 *      en distintos estados, 1 mesa con `pidio_cuenta`, mozos asignados.
 *   7. ~50 órdenes históricas en últimos 14 días para dashboards.
 *
 * Uso:
 *   npx tsx scripts/seed-demo.ts [slug]                 # append
 *   npx tsx scripts/seed-demo.ts [slug] --reset         # limpia operativo + reseed
 *
 * `--reset` borra del business: payments, caja_movimientos, caja_turnos,
 * comandas/comanda_items, order_items, orders, customers. NO toca catálogo,
 * stations ni floor plans.
 *
 * Default slug: "golf-jcr".
 *
 * Credenciales (todas password "demo1234"):
 *   admin@demo.test       → admin
 *   sofia@demo.test       → encargada
 *   pedro@demo.test       → mozo
 *   lucia@demo.test       → mozo
 *   diego@demo.test       → mozo
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const args = process.argv.slice(2);
const BUSINESS_SLUG = args.find((a) => !a.startsWith("--")) ?? "golf-jcr";
const RESET = args.includes("--reset");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing env vars.");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ────────────────────────────────────────────────────────────────

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pickWeighted<T>(items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of items) { r -= it.weight; if (r <= 0) return it.value; }
  return items[0]!.value;
}
function minsAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

// ── Stations ───────────────────────────────────────────────────────────────

const STATIONS = [
  { name: "Cocina",       sort_order: 0 },
  { name: "Parrilla",     sort_order: 1 },
  { name: "Sandwichera",  sort_order: 2 },
  { name: "Fritera",      sort_order: 3 },
  { name: "Bar",          sort_order: 4 },
] as const;

type StationName = typeof STATIONS[number]["name"];

/**
 * Mapea una categoría a su station por nombre. Heurística manual sobre el
 * nombre de la categoría (case-insensitive). Si nada matchea → Cocina.
 */
function categoryToStation(name: string): StationName {
  const s = name.toLowerCase();
  if (/(parrilla|asado|grilla)/.test(s)) return "Parrilla";
  if (/(sandwich|sándwich|tostado|hamburguesa|hamb)/.test(s)) return "Sandwichera";
  if (/(fritura|frita|empanada|panko|reboz|nugget)/.test(s)) return "Fritera";
  if (/(bebida|cerveza|vino|trago|espumante|champ|coctel|cóctel|agua|gaseosa|caf[eé]|infusi)/.test(s))
    return "Bar";
  return "Cocina";
}

// ── Equipo ─────────────────────────────────────────────────────────────────

const TEAM = [
  { email: "admin@demo.test",  name: "Carlos Admin",    role: "admin" },
  { email: "sofia@demo.test",  name: "Sofía Encargada", role: "encargado" },
  { email: "pedro@demo.test",  name: "Pedro Mozo",      role: "mozo" },
  { email: "lucia@demo.test",  name: "Lucía Moza",      role: "mozo" },
  { email: "diego@demo.test",  name: "Diego Mozo",      role: "mozo" },
] as const;

const TEAM_PASSWORD = "demo1234";

// ── Customers para órdenes/cobros ──────────────────────────────────────────

const CUSTOMER_NAMES = [
  "María González", "Juan Pérez", "Laura Fernández", "Diego Martínez",
  "Sofía Rodríguez", "Martín López", "Carolina Sánchez", "Pablo Romero",
  "Florencia Torres", "Sebastián Díaz", "Valentina Ruiz", "Mateo Acosta",
  "Camila Ortiz", "Lucas Benítez", "Agustina Silva", "Lautaro Castro",
  "Catalina Aguirre", "Tomás Vega", "Renata Flores", "Joaquín Rojas",
];

// ── Floor plan extra "Terraza" ─────────────────────────────────────────────

const TERRAZA_TABLES = [
  { label: "T1", seats: 4, shape: "circle", x: 100, y: 100, width: 90,  height: 90  },
  { label: "T2", seats: 4, shape: "circle", x: 250, y: 100, width: 90,  height: 90  },
  { label: "T3", seats: 6, shape: "rect",   x: 400, y: 100, width: 180, height: 100 },
  { label: "T4", seats: 2, shape: "circle", x: 100, y: 280, width: 80,  height: 80  },
  { label: "T5", seats: 2, shape: "circle", x: 250, y: 280, width: 80,  height: 80  },
  { label: "T6", seats: 8, shape: "rect",   x: 400, y: 280, width: 220, height: 120 },
];

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n━━━ Seed demo → "${BUSINESS_SLUG}" ${RESET ? "(RESET)" : "(append)"} ━━━\n`);

  // ── 0. Business ───────────────────────────────────────────────────────────
  const { data: business } = await supabase
    .from("businesses").select("id, name, timezone")
    .eq("slug", BUSINESS_SLUG).maybeSingle();
  if (!business) {
    console.error(`✗ Negocio "${BUSINESS_SLUG}" no existe. Corré antes seed:demo-full.`);
    process.exit(1);
  }
  console.log(`✓ Business: ${business.name}`);
  const businessId = business.id;

  // ── 0.5 Verificar pre-requisitos ──────────────────────────────────────────
  const [{ data: prods }, { data: cats }, { data: fps }] = await Promise.all([
    supabase.from("products").select("id, name, price_cents, category_id, station_id").eq("business_id", businessId).eq("is_active", true),
    supabase.from("categories").select("id, name, slug, station_id").eq("business_id", businessId).eq("is_active", true),
    supabase.from("floor_plans").select("id, name").eq("business_id", businessId),
  ]);
  if (!prods || prods.length === 0) {
    console.error(`✗ No hay productos. Corré antes seed:demo-full.`);
    process.exit(1);
  }
  if (!cats || cats.length === 0) {
    console.error(`✗ No hay categorías. Corré antes seed:demo-full.`);
    process.exit(1);
  }
  if (!fps || fps.length === 0) {
    console.error(`✗ No hay floor plans. Corré antes seed:demo-full.`);
    process.exit(1);
  }
  console.log(`✓ Catálogo: ${prods.length} productos en ${cats.length} categorías`);
  console.log(`✓ Floor plans existentes: ${fps.length}`);

  // ── 1. RESET selectivo (solo operativo) ───────────────────────────────────
  if (RESET) {
    console.log(`\n[reset] limpiando operativo...`);
    await supabase.from("payments").delete().eq("business_id", businessId);
    await supabase.from("caja_movimientos").delete().eq("business_id", businessId);
    await supabase.from("caja_turnos").delete().eq("business_id", businessId);

    const { data: ordersToDel } = await supabase
      .from("orders").select("id").eq("business_id", businessId);
    const orderIds = (ordersToDel ?? []).map((o) => o.id);
    if (orderIds.length > 0) {
      await supabase.from("comandas").delete().in("order_id", orderIds);
    }

    // Mesas: limpiar current_order_id antes de borrar orders
    const fpIds = fps.map((f) => f.id);
    const { data: tablesAll } = await supabase
      .from("tables").select("id").in("floor_plan_id", fpIds);
    if (tablesAll && tablesAll.length > 0) {
      await supabase.from("tables")
        .update({ current_order_id: null, opened_at: null, operational_status: "libre", mozo_id: null })
        .in("id", tablesAll.map((t) => t.id));
    }

    await supabase.from("orders").delete().eq("business_id", businessId);
    await supabase.from("customers").delete().eq("business_id", businessId);
    console.log(`  ✓ payments, caja, comandas, orders, customers + reset mesas`);
  }

  // ── 2. Stations (upsert idempotente) ──────────────────────────────────────
  console.log(`\n[stations] ${STATIONS.length} sectores...`);
  const stationIdByName = new Map<StationName, string>();
  for (const s of STATIONS) {
    const { data, error } = await supabase
      .from("stations")
      .upsert(
        { business_id: businessId, name: s.name, sort_order: s.sort_order, is_active: true },
        { onConflict: "business_id,name" },
      )
      .select("id, name").single();
    if (error || !data) { console.error(`  ✗ ${s.name}:`, error?.message); continue; }
    stationIdByName.set(s.name as StationName, data.id);
  }
  console.log(`  ✓ ${stationIdByName.size}/${STATIONS.length}`);

  // ── 3. Mappear categorías existentes a stations por heurística ────────────
  // Solo seteamos station_id en las categorías que NO tengan ya una asignada.
  console.log(`\n[mapeo] ${cats.length} categorías → stations...`);
  let mapped = 0;
  for (const c of cats) {
    if (c.station_id) continue; // respetamos lo que el admin ya configuró
    const station = categoryToStation(c.name);
    const stId = stationIdByName.get(station)!;
    const { error } = await supabase
      .from("categories").update({ station_id: stId }).eq("id", c.id);
    if (!error) {
      mapped++;
      console.log(`  · ${c.name.padEnd(34)} → ${station}`);
    }
  }
  console.log(`  ✓ ${mapped} categorías mapeadas (${cats.length - mapped} ya tenían station)`);

  // Releemos productos con category_id resuelto a station_id para luego
  // generar comandas con station correcto.
  type ProductRow = { id: string; name: string; price_cents: number; station_id: string | null };
  const productRows: ProductRow[] = [];
  // Construimos un Map de category_id → station_id (post-mapeo)
  const { data: catsRefreshed } = await supabase
    .from("categories").select("id, station_id").eq("business_id", businessId);
  const stationByCategory = new Map<string, string | null>();
  for (const c of catsRefreshed ?? []) {
    stationByCategory.set(c.id, (c.station_id as string | null) ?? null);
  }
  for (const p of prods) {
    const stationId = (p.station_id as string | null) ??
      (p.category_id ? stationByCategory.get(p.category_id) ?? null : null);
    productRows.push({
      id: p.id,
      name: p.name,
      price_cents: Number(p.price_cents),
      station_id: stationId,
    });
  }

  // ── 4. Floor plan "Terraza" (segundo salón) ───────────────────────────────
  console.log(`\n[floor plans] verificando "Terraza"...`);
  let terrazaId: string;
  const existingTerraza = fps.find((f) => f.name.toLowerCase() === "terraza");
  if (existingTerraza) {
    terrazaId = existingTerraza.id;
    console.log(`  · "Terraza" ya existía`);
  } else {
    const { data, error } = await supabase
      .from("floor_plans")
      .insert({ business_id: businessId, name: "Terraza", width: 700, height: 500 })
      .select("id").single();
    if (error || !data) { console.error(`  ✗ Terraza:`, error?.message); return; }
    terrazaId = data.id;
    console.log(`  ✓ "Terraza" creada`);
  }

  // Crear mesas T1..T6 si no existen
  for (const t of TERRAZA_TABLES) {
    const { data: existing } = await supabase
      .from("tables").select("id")
      .eq("floor_plan_id", terrazaId).eq("label", t.label).maybeSingle();
    if (existing) continue;
    await supabase.from("tables").insert({
      floor_plan_id: terrazaId,
      label: t.label,
      seats: t.seats,
      shape: t.shape,
      x: t.x, y: t.y, width: t.width, height: t.height,
      status: "active",
      operational_status: "libre",
    });
  }
  console.log(`  ✓ ${TERRAZA_TABLES.length} mesas T1..T6 listas`);

  // Recolectar TODAS las mesas activas del business (de todos los floor plans)
  const allFpIds = [...fps.map((f) => f.id), terrazaId].filter((id, i, arr) => arr.indexOf(id) === i);
  const { data: allTables } = await supabase
    .from("tables")
    .select("id, label, seats, floor_plan_id")
    .in("floor_plan_id", allFpIds)
    .eq("status", "active");
  type TableRow = { id: string; label: string; seats: number; floor_plan_id: string };
  const tableRows: TableRow[] = (allTables ?? []) as TableRow[];
  console.log(`  ✓ ${tableRows.length} mesas activas en total`);

  // ── 5. Equipo ─────────────────────────────────────────────────────────────
  console.log(`\n[equipo] ${TEAM.length} usuarios...`);
  const listRes = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUsers: { id: string; email?: string | null }[] =
    (listRes.data?.users ?? []) as { id: string; email?: string | null }[];

  const teamIdsByEmail = new Map<string, string>();
  for (const m of TEAM) {
    let userId: string | null =
      existingAuthUsers.find((u) => u.email?.toLowerCase() === m.email.toLowerCase())?.id ?? null;
    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: m.email,
        password: TEAM_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: m.name },
      });
      if (error || !data.user) { console.error(`  ✗ ${m.email}:`, error?.message); continue; }
      userId = data.user.id;
    }
    await supabase.from("users").upsert(
      { id: userId, email: m.email },
      { onConflict: "id" },
    );
    await supabase.from("business_users").upsert(
      { business_id: businessId, user_id: userId, role: m.role, full_name: m.name },
      { onConflict: "business_id,user_id" },
    );
    teamIdsByEmail.set(m.email, userId);
    console.log(`  ✓ ${m.role.padEnd(9)} ${m.email}`);
  }

  const encargadaId = teamIdsByEmail.get("sofia@demo.test")!;
  const mozoIds = ["pedro@demo.test", "lucia@demo.test", "diego@demo.test"]
    .map((e) => teamIdsByEmail.get(e)!).filter(Boolean);

  // ── 6. Caja + turno abierto ──────────────────────────────────────────────
  console.log(`\n[caja] caja principal + turno abierto...`);
  let { data: caja } = await supabase
    .from("cajas").select("id, name")
    .eq("business_id", businessId).eq("name", "Caja Principal").maybeSingle();
  if (!caja) {
    const { data, error } = await supabase
      .from("cajas")
      .insert({ business_id: businessId, name: "Caja Principal", is_active: true, sort_order: 0 })
      .select("id, name").single();
    if (error || !data) { console.error("  ✗ caja:", error?.message); return; }
    caja = data;
  }

  let { data: turno } = await supabase
    .from("caja_turnos").select("id, opening_cash_cents")
    .eq("caja_id", caja.id).eq("status", "open").maybeSingle();
  if (!turno) {
    const opening = 5000_000;
    const openedAt = minsAgo(180);
    const { data, error } = await supabase
      .from("caja_turnos")
      .insert({
        caja_id: caja.id, business_id: businessId,
        encargado_id: encargadaId,
        opening_cash_cents: opening, status: "open", opened_at: openedAt,
      })
      .select("id, opening_cash_cents").single();
    if (error || !data) { console.error("  ✗ turno:", error?.message); return; }
    turno = data;
    await supabase.from("caja_movimientos").insert({
      caja_turno_id: data.id, business_id: businessId,
      kind: "apertura", amount_cents: opening, reason: "Apertura de turno",
      created_by: encargadaId, created_at: openedAt,
    });
    console.log(`  ✓ turno abierto con $${opening / 100} de fondo`);
  } else {
    console.log(`  · turno ya estaba abierto`);
  }

  // ── 7. Customers para histórico/cobros ────────────────────────────────────
  console.log(`\n[customers] ${CUSTOMER_NAMES.length}...`);
  const customerIds: string[] = [];
  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    const name = CUSTOMER_NAMES[i]!;
    const phone = `+549341${5550000 + i}`;
    const { data } = await supabase
      .from("customers")
      .upsert(
        { business_id: businessId, name, phone, email: null },
        { onConflict: "business_id,phone" },
      )
      .select("id").single();
    if (data) customerIds.push(data.id);
  }
  console.log(`  ✓ ${customerIds.length}`);

  // ── 8. Histórico (últimos 14 días) ───────────────────────────────────────
  console.log(`\n[histórico] ~50 órdenes en últimos 14 días...`);
  let pastOk = 0;
  for (let i = 0; i < 50; i++) {
    const daysAgo = randInt(1, 14);
    const hour = randInt(12, 22);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(hour, randInt(0, 59), 0, 0);

    const deliveryType = pickWeighted([
      { value: "delivery" as const, weight: 4 },
      { value: "pickup" as const,   weight: 2 },
      { value: "dine_in" as const,  weight: 4 },
    ]);
    const status = pickWeighted([
      { value: "delivered" as const, weight: 9 },
      { value: "cancelled" as const, weight: 1 },
    ]);

    const itemCount = randInt(2, 5);
    const items = Array.from({ length: itemCount }, () => {
      const p = rand(productRows);
      const qty = randInt(1, 2);
      return {
        product_id: p.id, product_name: p.name,
        unit_price_cents: p.price_cents, quantity: qty,
        subtotal_cents: p.price_cents * qty,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.subtotal_cents, 0);
    const fee = deliveryType === "delivery" ? 80000 : 0;
    const customerId = rand(customerIds);
    const { data: cust } = await supabase
      .from("customers").select("name, phone").eq("id", customerId).maybeSingle();

    const { data: order } = await supabase
      .from("orders").insert({
        order_number: 0, business_id: businessId,
        customer_id: customerId,
        customer_name: cust?.name ?? "Cliente",
        customer_phone: cust?.phone ?? "+5493415550000",
        delivery_type: deliveryType, status,
        lifecycle_status: status === "cancelled" ? "cancelled" : "closed",
        subtotal_cents: subtotal, delivery_fee_cents: fee,
        discount_cents: 0, total_cents: subtotal + fee,
        payment_method: rand(["cash_on_delivery", "mercado_pago", "card_on_delivery"]),
        payment_status: status === "delivered" ? "paid" : "refunded",
        created_at: createdAt.toISOString(), updated_at: createdAt.toISOString(),
        closed_at: status === "delivered" ? createdAt.toISOString() : null,
        cancelled_at: status === "cancelled" ? createdAt.toISOString() : null,
        cancelled_reason: status === "cancelled" ? "Cliente canceló" : null,
      }).select("id").single();
    if (!order) continue;
    await supabase.from("order_items").insert(
      items.map((it) => ({ ...it, order_id: order.id })),
    );
    pastOk++;
  }
  console.log(`  ✓ ${pastOk} órdenes históricas`);

  // ── 8.5 Pedidos online del día de HOY (tab "Pedidos online") ─────────────
  // Esto puebla la tab "Pedidos online" de /admin/local, que filtra:
  //   delivery_type != 'dine_in' AND created_at >= startOfToday
  console.log(`\n[hoy online] ~15 pedidos delivery/pickup del día...`);
  let todayOk = 0;
  const now = new Date();
  for (let i = 0; i < 15; i++) {
    // distribuir a lo largo del día, antes de ahora
    const startOfDay = new Date(now);
    startOfDay.setHours(11, 0, 0, 0);
    const minsSinceOpen = Math.max(30, (now.getTime() - startOfDay.getTime()) / 60_000);
    const minsBack = randInt(0, Math.floor(minsSinceOpen));
    const createdAt = new Date(now.getTime() - minsBack * 60_000);

    const deliveryType = pickWeighted([
      { value: "delivery" as const, weight: 6 },
      { value: "pickup" as const,   weight: 3 },
      { value: "take_away" as const, weight: 1 },
    ]);
    // Mix de estados para que se vea movimiento real en la pantalla.
    const status = pickWeighted([
      { value: "pending" as const,    weight: 2 },
      { value: "confirmed" as const,  weight: 2 },
      { value: "preparing" as const,  weight: 3 },
      { value: "ready" as const,      weight: 2 },
      { value: "on_the_way" as const, weight: 2 },
      { value: "delivered" as const,  weight: 6 },
      { value: "cancelled" as const,  weight: 1 },
    ]);

    const itemCount = randInt(2, 5);
    const items = Array.from({ length: itemCount }, () => {
      const p = rand(productRows);
      const qty = randInt(1, 2);
      return {
        product_id: p.id, product_name: p.name,
        unit_price_cents: p.price_cents, quantity: qty,
        subtotal_cents: p.price_cents * qty,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.subtotal_cents, 0);
    const fee = deliveryType === "delivery" ? 80000 : 0;
    const customerId = rand(customerIds);
    const { data: cust } = await supabase
      .from("customers").select("name, phone").eq("id", customerId).maybeSingle();

    const lifecycle =
      status === "delivered" ? "closed"
      : status === "cancelled" ? "cancelled"
      : "open";

    const { data: order, error: oErr } = await supabase
      .from("orders").insert({
        order_number: 0, business_id: businessId,
        customer_id: customerId,
        customer_name: cust?.name ?? "Cliente",
        customer_phone: cust?.phone ?? "+5493415550000",
        delivery_type: deliveryType, status,
        lifecycle_status: lifecycle,
        subtotal_cents: subtotal, delivery_fee_cents: fee,
        discount_cents: 0, total_cents: subtotal + fee,
        delivery_address: deliveryType === "delivery"
          ? `Pellegrini ${randInt(100, 4000)}` : null,
        payment_method: rand(["cash_on_delivery", "mercado_pago", "card_on_delivery"]),
        payment_status: status === "delivered" ? "paid"
          : status === "cancelled" ? "refunded" : "pending",
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString(),
        closed_at: status === "delivered" ? createdAt.toISOString() : null,
        cancelled_at: status === "cancelled" ? createdAt.toISOString() : null,
        cancelled_reason: status === "cancelled" ? "Cliente canceló" : null,
      }).select("id").single();
    if (oErr) {
      console.error(`  ✗ orden ${i}:`, oErr.message);
      continue;
    }
    if (!order) continue;
    await supabase.from("order_items").insert(
      items.map((it) => ({ ...it, order_id: order.id })),
    );
    todayOk++;
  }
  console.log(`  ✓ ${todayOk} pedidos online de hoy`);

  // ── 9. Estado operativo de hoy ───────────────────────────────────────────
  console.log(`\n[hoy] estado operativo del salón...`);

  // Para mostrar multi-sector, distribuyo mesas ocupadas entre los floor plans.
  const salonTables = tableRows.filter((t) => t.floor_plan_id !== terrazaId);
  const terrazaTables = tableRows.filter((t) => t.floor_plan_id === terrazaId);

  type MesaSetup = {
    table: TableRow;
    state: "ocupada" | "pidio_cuenta";
    minutesAgo: number;
    itemCount: number;
    comandaPattern: ("pendiente" | "en_preparacion" | "listo" | "entregado")[];
    askedBill?: boolean;
    customerName: string;
    mozoIdx: number;
  };

  // Asignación fija: primera mesa del salón → Pedro, primera de terraza → Lucía
  if (salonTables[0]) {
    await supabase.from("tables").update({ mozo_id: mozoIds[0] }).eq("id", salonTables[0].id);
  }
  if (terrazaTables[0]) {
    await supabase.from("tables").update({ mozo_id: mozoIds[1] }).eq("id", terrazaTables[0].id);
  }

  // 5 mesas con setup. Repartidas entre salón y terraza.
  const setups: MesaSetup[] = [];
  if (salonTables[0]) setups.push({
    table: salonTables[0], state: "ocupada", minutesAgo: 35, itemCount: 4,
    comandaPattern: ["en_preparacion", "listo"],
    customerName: "Familia García", mozoIdx: 0,
  });
  if (salonTables[2]) setups.push({
    table: salonTables[2], state: "ocupada", minutesAgo: 12, itemCount: 3,
    comandaPattern: ["pendiente"],
    customerName: "Pareja", mozoIdx: 0,
  });
  if (salonTables[5]) setups.push({
    table: salonTables[5], state: "ocupada", minutesAgo: 55, itemCount: 5,
    comandaPattern: ["en_preparacion", "entregado"],
    customerName: "Reunión trabajo", mozoIdx: 2,
  });
  if (terrazaTables[0]) setups.push({
    table: terrazaTables[0], state: "pidio_cuenta", minutesAgo: 78, itemCount: 4,
    comandaPattern: ["entregado", "entregado"],
    askedBill: true, customerName: "Mesa Pérez", mozoIdx: 1,
  });
  if (terrazaTables[2]) setups.push({
    table: terrazaTables[2], state: "ocupada", minutesAgo: 28, itemCount: 4,
    comandaPattern: ["pendiente", "en_preparacion"],
    customerName: "Cumpleaños", mozoIdx: 1,
  });

  for (const s of setups) {
    const openedAt = minsAgo(s.minutesAgo);
    const mozoId = mozoIds[s.mozoIdx] ?? null;

    // Idempotencia: si la mesa ya tiene una order open, hay que sacarla del
    // medio antes de insertar la nuestra. El partial unique
    // `orders_one_open_per_table` rechaza un segundo INSERT con
    // SQLSTATE 23505. La forma más limpia es marcar la previa como cancelled
    // (no la borro porque puede tener payments/comandas históricas).
    const { data: prevOpen } = await supabase
      .from("orders").select("id")
      .eq("business_id", businessId)
      .eq("table_id", s.table.id)
      .eq("lifecycle_status", "open")
      .maybeSingle();
    if (prevOpen) {
      // Borrar comandas asociadas (cascade lleva comanda_items)
      await supabase.from("comandas").delete().eq("order_id", prevOpen.id);
      // Borrar payments si los hubiera
      await supabase.from("payments").delete().eq("order_id", prevOpen.id);
      // Y borrar la order (cascade lleva order_items)
      await supabase.from("orders").delete().eq("id", prevOpen.id);
    }
    // Reset de la mesa
    await supabase.from("tables")
      .update({ current_order_id: null, opened_at: null, operational_status: "libre" })
      .eq("id", s.table.id);

    // items: tomar productos cubriendo varias stations distintas
    const chosen: ProductRow[] = [];
    const wantStations: StationName[] = ["Cocina", "Parrilla", "Sandwichera", "Fritera", "Bar"];
    // Para que las comandas se rutéen a varios sectores, intento elegir uno
    // de cada station hasta llenar itemCount.
    for (const wantSt of wantStations) {
      if (chosen.length >= s.itemCount) break;
      const stId = stationIdByName.get(wantSt);
      const candidates = productRows.filter((p) => p.station_id === stId);
      if (candidates.length > 0) chosen.push(rand(candidates));
    }
    while (chosen.length < s.itemCount) chosen.push(rand(productRows));

    const items = chosen.map((p) => {
      const qty = randInt(1, 2);
      return {
        product_id: p.id, product_name: p.name,
        unit_price_cents: p.price_cents, quantity: qty,
        subtotal_cents: p.price_cents * qty,
        station_id: p.station_id,
      };
    });
    const subtotal = items.reduce((acc, it) => acc + it.subtotal_cents, 0);

    const { data: order, error: oErr } = await supabase
      .from("orders").insert({
        order_number: 0, business_id: businessId,
        customer_name: s.customerName,
        customer_phone: "+5493415559999",
        delivery_type: "dine_in",
        table_id: s.table.id, mozo_id: mozoId,
        status: "preparing", lifecycle_status: "open",
        subtotal_cents: subtotal, delivery_fee_cents: 0,
        discount_cents: 0, total_cents: subtotal,
        payment_method: "cash_on_delivery", payment_status: "pending",
        created_at: openedAt, updated_at: openedAt,
        bill_requested_at: s.askedBill ? minsAgo(5) : null,
      })
      .select("id, order_number").single();
    if (oErr || !order) {
      console.error(`  ✗ order mesa ${s.table.label}:`, oErr?.message);
      continue;
    }

    const { data: insertedItems, error: iErr } = await supabase
      .from("order_items")
      .insert(items.map((it) => ({ ...it, order_id: order.id })))
      .select("id, station_id");
    if (iErr || !insertedItems) {
      console.error(`  ✗ items mesa ${s.table.label}:`, iErr?.message);
      continue;
    }

    // Generar comandas: agrupamos items por station_id
    const itemsByStation = new Map<string, typeof insertedItems>();
    for (const it of insertedItems) {
      const sid = it.station_id as string | null;
      if (!sid) continue;
      const prev = itemsByStation.get(sid) ?? [];
      prev.push(it);
      itemsByStation.set(sid, prev);
    }

    if (itemsByStation.size === 0) {
      console.error(`  ⚠ mesa ${s.table.label}: ningún item tiene station_id; revisar mapeo de categorías`);
    }

    let comandasOk = 0;
    let batch = 0;
    for (const stId of itemsByStation.keys()) {
      batch += 1;
      const stItems = itemsByStation.get(stId)!;
      const status = s.comandaPattern[(batch - 1) % s.comandaPattern.length] ?? "pendiente";
      const emittedAt = openedAt;
      const deliveredAt = status === "entregado" ? minsAgo(3) : null;

      const { data: comanda, error: cErr } = await supabase
        .from("comandas").insert({
          order_id: order.id, station_id: stId, batch, status,
          emitted_at: emittedAt, delivered_at: deliveredAt,
        }).select("id").single();
      if (cErr || !comanda) {
        console.error(`  ✗ comanda mesa ${s.table.label} batch ${batch}:`, cErr?.message);
        continue;
      }
      comandasOk++;

      await supabase.from("comanda_items").insert(
        stItems.map((it) => ({ comanda_id: comanda.id, order_item_id: it.id })),
      );

      const kitchenStatus =
        status === "pendiente" ? "pending"
        : status === "en_preparacion" ? "preparing"
        : status === "listo" ? "ready"
        : "delivered";
      await supabase.from("order_items")
        .update({ kitchen_status: kitchenStatus })
        .in("id", stItems.map((it) => it.id));
    }

    await supabase.from("tables").update({
      operational_status: s.state,
      opened_at: openedAt,
      current_order_id: order.id,
      mozo_id: mozoId ?? null,
    }).eq("id", s.table.id);

    console.log(`  ✓ ${s.table.label.padEnd(4)} ${s.state.padEnd(13)} ${s.customerName.padEnd(20)} (${items.length} items / ${comandasOk} comandas)`);
  }

  // ── 10. Cobros del día (orders cerradas con payments) ────────────────────
  console.log(`\n[cobros] cobros del turno actual...`);
  let cobrosOk = 0;
  for (let i = 0; i < 4; i++) {
    const minsBack = randInt(60, 170);
    const itemCount = randInt(2, 4);
    const items = Array.from({ length: itemCount }, () => {
      const p = rand(productRows);
      const qty = randInt(1, 2);
      return {
        product_id: p.id, product_name: p.name,
        unit_price_cents: p.price_cents, quantity: qty,
        subtotal_cents: p.price_cents * qty,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.subtotal_cents, 0);
    const tip = i % 2 === 0 ? Math.round(subtotal * 0.1) : 0;
    const customerId = rand(customerIds);
    const { data: cust } = await supabase
      .from("customers").select("name, phone").eq("id", customerId).maybeSingle();

    const { data: order } = await supabase
      .from("orders").insert({
        order_number: 0, business_id: businessId,
        customer_id: customerId,
        customer_name: cust?.name ?? "Cliente",
        customer_phone: cust?.phone ?? "+5493415550000",
        delivery_type: "dine_in", status: "delivered",
        lifecycle_status: "closed",
        subtotal_cents: subtotal, delivery_fee_cents: 0,
        discount_cents: 0, tip_cents: tip,
        total_cents: subtotal, total_paid_cents: subtotal + tip,
        payment_method: "cash_on_delivery", payment_status: "paid",
        created_at: minsAgo(minsBack), updated_at: minsAgo(minsBack - 30),
        closed_at: minsAgo(minsBack - 30),
      }).select("id").single();
    if (!order) continue;

    await supabase.from("order_items").insert(
      items.map((it) => ({ ...it, order_id: order.id })),
    );

    const method = pickWeighted([
      { value: "cash" as const, weight: 4 },
      { value: "mp_qr" as const, weight: 3 },
      { value: "card_debit" as const, weight: 2 },
      { value: "card_credit" as const, weight: 2 },
    ]);

    const { error: pErr } = await supabase.from("payments").insert({
      order_id: order.id, business_id: businessId,
      caja_turno_id: turno!.id, method,
      amount_cents: subtotal, tip_cents: tip,
      payment_status: "completed",
      operated_by: encargadaId,
      attributed_mozo_id: rand(mozoIds),
      created_at: minsAgo(minsBack - 30),
    });
    if (!pErr) cobrosOk++;
  }
  console.log(`  ✓ ${cobrosOk} cobros del día`);

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log(`\n━━━ Listo ━━━`);
  console.log(`Slug:     ${BUSINESS_SLUG}`);
  console.log(`Login:    /${BUSINESS_SLUG}/admin/login`);
  console.log(`Password: ${TEAM_PASSWORD} (todos los usuarios demo)`);
  console.log();
  for (const m of TEAM) console.log(`  · ${m.role.padEnd(9)} ${m.email}`);
  console.log();
  console.log(`Pantallas:`);
  console.log(`  · /${BUSINESS_SLUG}/admin/local            (operativo: pedidos, comandas, salón, caja)`);
  console.log(`  · /${BUSINESS_SLUG}/mozo                   (vista mozo, "Mis mesas")`);
  console.log(`  · /${BUSINESS_SLUG}/admin                  (dashboards con datos históricos)`);
  console.log();
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
