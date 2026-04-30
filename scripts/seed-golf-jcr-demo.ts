/**
 * Seed de demo para el negocio "golf-jcr" (Restaurante del Golf).
 *
 * Carga:
 *   - ~15 customers
 *   - ~60 orders distribuidos en los últimos 30 días (delivered en su mayoría,
 *     algunos cancelled) — sirven para gráficos de ventas / reportes históricos
 *   - ~12 orders del día de hoy con mix de estados (pending → delivered, cancelled)
 *   - Floor plan + 12 mesas + reservation_settings + ~20 reservations
 *     (pasadas: completed / no_show / cancelled; hoy y próximos días: confirmed)
 *
 * Requiere haber corrido antes seed-rdg-menu.ts (necesita productos cargados).
 *
 * Uso:
 *   npx tsx scripts/seed-golf-jcr-demo.ts [business_slug]
 *
 * NO es idempotente: cada corrida agrega más pedidos / reservas. Usalo una vez.
 * Para limpiar: borrá el business_id correspondiente de orders / reservations a mano.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const BUSINESS_SLUG = process.argv[2] ?? "golf-jcr";

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

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWeighted<T>(weighted: readonly { value: T; weight: number }[]): T {
  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weighted) {
    r -= w.weight;
    if (r <= 0) return w.value;
  }
  return weighted[0]!.value;
}

// ─── Datos ──────────────────────────────────────────────────────────────────

const CUSTOMERS = [
  { name: "María González", phone: "+5493415551001", email: "maria.gonzalez@gmail.com" },
  { name: "Juan Pérez", phone: "+5493415551002", email: "juanperez@hotmail.com" },
  { name: "Laura Fernández", phone: "+5493415551003", email: "lfernandez@gmail.com" },
  { name: "Diego Martínez", phone: "+5493415551004", email: "diego.mtz@gmail.com" },
  { name: "Sofía Rodríguez", phone: "+5493415551005", email: "sofiar@yahoo.com" },
  { name: "Martín López", phone: "+5493415551006", email: null },
  { name: "Carolina Sánchez", phone: "+5493415551007", email: "caro.sanchez@gmail.com" },
  { name: "Pablo Romero", phone: "+5493415551008", email: "pablo.romero@gmail.com" },
  { name: "Florencia Torres", phone: "+5493415551009", email: "flortorres@gmail.com" },
  { name: "Sebastián Díaz", phone: "+5493415551010", email: "sdiaz@hotmail.com" },
  { name: "Valentina Ruiz", phone: "+5493415551011", email: "vruiz@gmail.com" },
  { name: "Mateo Acosta", phone: "+5493415551012", email: null },
  { name: "Camila Ortiz", phone: "+5493415551013", email: "camila.ortiz@gmail.com" },
  { name: "Lucas Benítez", phone: "+5493415551014", email: "lucasb@gmail.com" },
  { name: "Agustina Silva", phone: "+5493415551015", email: "asilva@gmail.com" },
];

const STREETS = [
  "Pellegrini", "Córdoba", "Rioja", "San Lorenzo", "Mendoza",
  "San Juan", "Salta", "Entre Ríos", "Sarmiento", "Mitre",
];

const NOTES_DELIVERY = [
  null, null, null,
  "Tocar timbre dos veces",
  "Dejar en portería",
  "Sin cebolla por favor",
  "Departamento al fondo",
  "Llamar al llegar",
];

const RESERVATION_NOTES = [
  null, null,
  "Cumpleaños",
  "Mesa cerca de la ventana si es posible",
  "Aniversario",
  "Vienen con un bebé, traer silla alta",
  "Un comensal celíaco",
  "Reunión de trabajo",
];

// Distribución de estados para órdenes del día:
const TODAY_STATUSES = [
  { value: "pending", weight: 2 },
  { value: "confirmed", weight: 2 },
  { value: "preparing", weight: 3 },
  { value: "ready", weight: 2 },
  { value: "on_the_way", weight: 2 },
  { value: "delivered", weight: 4 },
  { value: "cancelled", weight: 1 },
] as const;

const PAST_STATUSES = [
  { value: "delivered", weight: 18 },
  { value: "cancelled", weight: 2 },
] as const;

const PAYMENT_METHODS = ["cash_on_delivery", "mercado_pago", "card_on_delivery"] as const;

// ─── Run ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Demo seed → business slug "${BUSINESS_SLUG}"\n`);

  // 1. Business
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name, timezone")
    .eq("slug", BUSINESS_SLUG)
    .maybeSingle();
  if (bizErr || !business) {
    console.error(`✗ No se encontró negocio con slug "${BUSINESS_SLUG}".`);
    process.exit(1);
  }
  console.log(`✓ ${business.name} (${business.id})\n`);

  // 2. Productos (necesarios para armar items)
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, price_cents, category_id")
    .eq("business_id", business.id)
    .eq("is_active", true);
  if (prodErr || !products || products.length === 0) {
    console.error(`✗ No hay productos. Corré antes seed-rdg-menu.ts`);
    process.exit(1);
  }
  console.log(`✓ ${products.length} productos disponibles`);

  // 3. Customers
  console.log(`\nCargando ${CUSTOMERS.length} customers...`);
  const customerRows: { id: string; name: string; phone: string }[] = [];
  for (const c of CUSTOMERS) {
    const { data, error } = await supabase
      .from("customers")
      .upsert(
        { business_id: business.id, name: c.name, phone: c.phone, email: c.email },
        { onConflict: "business_id,phone" },
      )
      .select("id, name, phone")
      .single();
    if (error || !data) {
      console.error(`  ✗ ${c.name}:`, error?.message);
      continue;
    }
    customerRows.push(data);
  }
  console.log(`  ${customerRows.length}/${CUSTOMERS.length} ok`);

  // 4. Orders — armado en una función reutilizable
  async function createOrder(opts: {
    customer: { id: string; name: string; phone: string };
    status: string;
    deliveryType: "delivery" | "pickup";
    createdAt: Date;
    paymentStatus?: string;
    paymentMethod?: string;
    cancelledReason?: string | null;
  }) {
    const { customer, status, deliveryType, createdAt } = opts;
    const itemCount = randInt(1, 5);
    const chosenProducts = Array.from({ length: itemCount }, () => rand(products));

    let subtotal = 0;
    const itemsToInsert: {
      product_id: string;
      product_name: string;
      unit_price_cents: number;
      quantity: number;
      subtotal_cents: number;
    }[] = [];
    for (const p of chosenProducts) {
      const qty = randInt(1, 3);
      const itemSubtotal = Number(p.price_cents) * qty;
      subtotal += itemSubtotal;
      itemsToInsert.push({
        product_id: p.id,
        product_name: p.name,
        unit_price_cents: Number(p.price_cents),
        quantity: qty,
        subtotal_cents: itemSubtotal,
      });
    }

    const deliveryFee = deliveryType === "delivery" ? 80000 : 0;
    const total = subtotal + deliveryFee;

    const street = `${rand(STREETS)} ${randInt(100, 4000)}`;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: 0,
        business_id: business.id,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        delivery_type: deliveryType,
        delivery_address: deliveryType === "delivery" ? street : null,
        delivery_notes: deliveryType === "delivery" ? rand(NOTES_DELIVERY) : null,
        status,
        subtotal_cents: subtotal,
        delivery_fee_cents: deliveryFee,
        discount_cents: 0,
        total_cents: total,
        payment_method: opts.paymentMethod ?? rand(PAYMENT_METHODS),
        payment_status:
          opts.paymentStatus ??
          (status === "delivered" ? "paid" : status === "cancelled" ? "refunded" : "pending"),
        cancelled_reason:
          opts.cancelledReason ??
          (status === "cancelled" ? rand(["Cliente canceló", "Sin stock", "Demora excesiva"]) : null),
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString(),
      })
      .select("id, order_number")
      .single();

    if (error || !order) {
      console.error(`  ✗ order:`, error?.message);
      return null;
    }

    const itemsWithOrderId = itemsToInsert.map((it) => ({ ...it, order_id: order.id }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsWithOrderId);
    if (itemsErr) console.error(`  ✗ items orden #${order.order_number}:`, itemsErr.message);

    return order;
  }

  // 4a. Pedidos pasados (últimos 30 días)
  const PAST_ORDER_COUNT = 60;
  console.log(`\nCargando ${PAST_ORDER_COUNT} pedidos pasados (últimos 30 días)...`);
  let pastOk = 0;
  for (let i = 0; i < PAST_ORDER_COUNT; i += 1) {
    const daysAgo = randInt(1, 30);
    const hour = randInt(12, 23);
    const minute = randInt(0, 59);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(hour, minute, 0, 0);

    const status = pickWeighted(PAST_STATUSES);
    const deliveryType: "delivery" | "pickup" = Math.random() < 0.6 ? "delivery" : "pickup";
    const customer = rand(customerRows);

    const order = await createOrder({ customer, status, deliveryType, createdAt });
    if (order) pastOk += 1;
  }
  console.log(`  ${pastOk}/${PAST_ORDER_COUNT} ok`);

  // 4b. Pedidos del día de hoy
  const TODAY_ORDER_COUNT = 14;
  console.log(`\nCargando ${TODAY_ORDER_COUNT} pedidos del día de hoy...`);
  let todayOk = 0;
  for (let i = 0; i < TODAY_ORDER_COUNT; i += 1) {
    const now = new Date();
    const createdAt = new Date(now);
    // Repartidos a lo largo del día, pero antes de "ahora"
    const hoursAgo = randInt(0, Math.max(1, now.getHours()));
    createdAt.setHours(now.getHours() - hoursAgo, randInt(0, 59), 0, 0);
    if (createdAt > now) createdAt.setTime(now.getTime() - randInt(60, 3600) * 1000);

    const status = pickWeighted(TODAY_STATUSES);
    const deliveryType: "delivery" | "pickup" = Math.random() < 0.65 ? "delivery" : "pickup";
    const customer = rand(customerRows);

    const order = await createOrder({ customer, status, deliveryType, createdAt });
    if (order) todayOk += 1;
  }
  console.log(`  ${todayOk}/${TODAY_ORDER_COUNT} ok`);

  // 5. Reservas — primero asegurar floor_plan, mesas y settings
  console.log(`\nConfigurando floor_plan + mesas + reservation_settings...`);

  // Floor plan (uno solo)
  let floorPlanId: string;
  const { data: existingFp } = await supabase
    .from("floor_plans")
    .select("id")
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();
  if (existingFp) {
    floorPlanId = existingFp.id;
    console.log(`  ✓ floor_plan ya existía (${floorPlanId})`);
  } else {
    const { data: fp, error: fpErr } = await supabase
      .from("floor_plans")
      .insert({ business_id: business.id, name: "Salón principal", width: 1000, height: 700 })
      .select("id")
      .single();
    if (fpErr || !fp) {
      console.error(`  ✗ floor_plan:`, fpErr?.message);
      return;
    }
    floorPlanId = fp.id;
    console.log(`  ✓ floor_plan creado`);
  }

  // Mesas — solo crear si no hay
  const { data: existingTables } = await supabase
    .from("tables")
    .select("id, label, seats")
    .eq("floor_plan_id", floorPlanId);

  let tableRows: { id: string; seats: number }[] = existingTables ?? [];
  if (tableRows.length === 0) {
    const tablesDef = [
      { label: "1", seats: 2, shape: "circle", x: 100, y: 100, width: 80, height: 80 },
      { label: "2", seats: 2, shape: "circle", x: 250, y: 100, width: 80, height: 80 },
      { label: "3", seats: 4, shape: "square", x: 400, y: 100, width: 100, height: 100 },
      { label: "4", seats: 4, shape: "square", x: 550, y: 100, width: 100, height: 100 },
      { label: "5", seats: 4, shape: "square", x: 700, y: 100, width: 100, height: 100 },
      { label: "6", seats: 6, shape: "rect", x: 100, y: 280, width: 180, height: 100 },
      { label: "7", seats: 6, shape: "rect", x: 350, y: 280, width: 180, height: 100 },
      { label: "8", seats: 6, shape: "rect", x: 600, y: 280, width: 180, height: 100 },
      { label: "9", seats: 8, shape: "rect", x: 100, y: 450, width: 220, height: 120 },
      { label: "10", seats: 8, shape: "rect", x: 400, y: 450, width: 220, height: 120 },
      { label: "11", seats: 4, shape: "circle", x: 700, y: 470, width: 100, height: 100 },
      { label: "12", seats: 2, shape: "circle", x: 850, y: 470, width: 80, height: 80 },
    ];
    const { data: inserted, error: tErr } = await supabase
      .from("tables")
      .insert(tablesDef.map((t) => ({ ...t, floor_plan_id: floorPlanId })))
      .select("id, seats");
    if (tErr || !inserted) {
      console.error(`  ✗ tables:`, tErr?.message);
      return;
    }
    tableRows = inserted;
    console.log(`  ✓ ${inserted.length} mesas creadas`);
  } else {
    console.log(`  ✓ ${tableRows.length} mesas ya existían`);
  }

  // Reservation settings
  const schedule: Record<string, { open: boolean; slots: string[] }> = {
    "0": { open: true, slots: ["12:00", "13:00", "13:30", "20:30", "21:00", "21:30"] },
    "1": { open: false, slots: [] },
    "2": { open: true, slots: ["12:00", "13:00", "13:30", "20:30", "21:00", "21:30"] },
    "3": { open: true, slots: ["12:00", "13:00", "13:30", "20:30", "21:00", "21:30"] },
    "4": { open: true, slots: ["12:00", "13:00", "13:30", "20:30", "21:00", "21:30", "22:00"] },
    "5": { open: true, slots: ["12:00", "13:00", "13:30", "20:30", "21:00", "21:30", "22:00"] },
    "6": { open: true, slots: ["12:00", "13:00", "13:30", "20:30", "21:00", "21:30", "22:00"] },
  };

  await supabase.from("reservation_settings").upsert(
    {
      business_id: business.id,
      slot_duration_min: 90,
      buffer_min: 15,
      lead_time_min: 60,
      advance_days_max: 30,
      max_party_size: 12,
      schedule,
    },
    { onConflict: "business_id" },
  );
  console.log(`  ✓ reservation_settings`);

  // 6. Reservas
  console.log(`\nCargando reservas...`);

  async function createReservation(opts: {
    customer: { id: string; name: string; phone: string };
    startsAt: Date;
    partySize: number;
    status: "confirmed" | "completed" | "no_show" | "cancelled";
    table: { id: string; seats: number };
  }) {
    const endsAt = new Date(opts.startsAt.getTime() + 90 * 60 * 1000);
    const { error } = await supabase.from("reservations").insert({
      business_id: business.id,
      table_id: opts.table.id,
      customer_name: opts.customer.name,
      customer_phone: opts.customer.phone,
      party_size: opts.partySize,
      starts_at: opts.startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: opts.status,
      notes: rand(RESERVATION_NOTES),
      source: Math.random() < 0.7 ? "web" : "admin",
    });
    if (error) {
      // Probable conflicto de overlap — lo ignoramos en el demo
      return false;
    }
    return true;
  }

  // 6a. Reservas pasadas (últimos 14 días, completed / no_show / cancelled)
  let pastResOk = 0;
  for (let i = 0; i < 14; i += 1) {
    const daysAgo = randInt(1, 14);
    const slotHour = rand([12, 13, 20, 21]);
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() - daysAgo);
    startsAt.setHours(slotHour, rand([0, 30]), 0, 0);

    const partySize = randInt(2, 8);
    const table = tableRows.find((t) => t.seats >= partySize) ?? rand(tableRows);
    const status = pickWeighted([
      { value: "completed" as const, weight: 8 },
      { value: "no_show" as const, weight: 1 },
      { value: "cancelled" as const, weight: 2 },
    ]);

    const ok = await createReservation({
      customer: rand(customerRows),
      startsAt,
      partySize,
      status,
      table,
    });
    if (ok) pastResOk += 1;
  }
  console.log(`  ${pastResOk} reservas pasadas`);

  // 6b. Reservas hoy + próximos días (confirmed)
  let futureResOk = 0;
  for (let i = 0; i < 12; i += 1) {
    const daysAhead = randInt(0, 10);
    const slotHour = rand([12, 13, 20, 21]);
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + daysAhead);
    startsAt.setHours(slotHour, rand([0, 30]), 0, 0);

    const partySize = randInt(2, 8);
    const table = tableRows.find((t) => t.seats >= partySize) ?? rand(tableRows);

    const ok = await createReservation({
      customer: rand(customerRows),
      startsAt,
      partySize,
      status: "confirmed",
      table,
    });
    if (ok) futureResOk += 1;
  }
  console.log(`  ${futureResOk} reservas futuras (hoy + próximos días)`);

  console.log(`\n✓ Listo. Demo cargada en "${BUSINESS_SLUG}".`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
