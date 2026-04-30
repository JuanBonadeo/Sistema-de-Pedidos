/**
 * Seed denso para "golf-jcr" — pensado para que el dashboard y reportes
 * tengan métricas reales que vendan el producto.
 *
 * Carga:
 *   - 70 customers con `created_at` distribuidos a lo largo del último año
 *     (incluyendo varios nuevos en últimos 7 días + algunos hoy/ayer)
 *   - ~3500–4500 orders en los últimos 365 días con estacionalidad:
 *       · más volumen viernes/sábado/domingo
 *       · peak de almuerzo (12–15) y cena (20–23)
 *       · curva de crecimiento ~+40 % de hace 12 meses a hoy
 *       · 5 % cancelados, resto delivered
 *       · mix delivery / pickup / dine_in (45 / 25 / 30)
 *   - 25–35 orders hoy con estados mixtos (pending → on_the_way → delivered → cancelled)
 *   - Floor plan + 12 mesas + 80 reservas (pasadas + futuras)
 *
 * Reset por default (borra orders/order_items/order_status_history/reservations/customers
 * del business). Pasar --no-reset para apilar sobre lo existente.
 *
 * Uso:
 *   npx tsx scripts/seed-golf-jcr-full.ts [slug] [--no-reset]
 *
 * Requiere productos cargados (correr antes seed-rdg-menu.ts).
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const args = process.argv.slice(2);
const BUSINESS_SLUG = args.find((a) => !a.startsWith("--")) ?? "golf-jcr";
const RESET = !args.includes("--no-reset");

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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Datos ──────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "María", "Juan", "Laura", "Diego", "Sofía", "Martín", "Carolina", "Pablo",
  "Florencia", "Sebastián", "Valentina", "Mateo", "Camila", "Lucas", "Agustina",
  "Lautaro", "Catalina", "Tomás", "Renata", "Joaquín", "Julieta", "Bautista",
  "Isabella", "Benjamín", "Emma", "Santiago", "Mía", "Felipe", "Olivia",
  "Nicolás", "Lola", "Bruno", "Antonella", "Gonzalo", "Delfina", "Federico",
  "Mariana", "Ignacio", "Victoria", "Leandro", "Pilar", "Maximiliano",
  "Constanza", "Franco", "Bianca", "Ezequiel", "Abril", "Rodrigo", "Malena",
  "Hernán", "Romina", "Gabriel", "Sabrina", "Marcos", "Daniela", "Andrés",
  "Paula", "Ariel", "Jimena", "Cristian", "Vanesa", "Esteban", "Lorena",
  "Walter", "Natalia", "Rubén", "Silvina", "Marcelo", "Gisela", "Damián",
];

const LAST_NAMES = [
  "González", "Rodríguez", "Fernández", "López", "Martínez", "García",
  "Pérez", "Sánchez", "Romero", "Sosa", "Díaz", "Torres", "Gómez", "Álvarez",
  "Ruiz", "Acosta", "Ortiz", "Benítez", "Silva", "Castro", "Aguirre", "Vega",
  "Flores", "Rojas", "Molina", "Herrera", "Medina", "Suárez", "Ramos",
  "Domínguez", "Ríos", "Luna", "Mendoza", "Cabrera", "Quiroga", "Ferrari",
  "Costa", "Bianchi", "Russo", "Esposito",
];

const STREETS = [
  "Pellegrini", "Córdoba", "Rioja", "San Lorenzo", "Mendoza", "San Juan",
  "Salta", "Entre Ríos", "Sarmiento", "Mitre", "Belgrano", "Moreno",
  "Rivadavia", "9 de Julio", "Buenos Aires", "Italia", "Corrientes",
];

const NOTES_DELIVERY = [
  null, null, null, null,
  "Tocar timbre dos veces", "Dejar en portería", "Sin cebolla por favor",
  "Departamento al fondo", "Llamar al llegar", "Dejar con vecino del 2°",
  "Casa con portón verde", "Sin sal por favor",
];

const PAYMENT_METHODS = ["cash_on_delivery", "mercado_pago", "card_on_delivery"] as const;

const DELIVERY_TYPES = [
  { value: "delivery" as const, weight: 45 },
  { value: "pickup" as const, weight: 25 },
  { value: "dine_in" as const, weight: 30 },
];

const TODAY_STATUSES = [
  { value: "pending", weight: 2 },
  { value: "confirmed", weight: 2 },
  { value: "preparing", weight: 3 },
  { value: "ready", weight: 2 },
  { value: "on_the_way", weight: 2 },
  { value: "delivered", weight: 6 },
  { value: "cancelled", weight: 1 },
] as const;

const RESERVATION_NOTES = [
  null, null, null,
  "Cumpleaños", "Mesa cerca de la ventana si es posible", "Aniversario",
  "Vienen con un bebé, traer silla alta", "Un comensal celíaco",
  "Reunión de trabajo", "Mesa tranquila si se puede",
];

// ─── Run ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `Full seed → "${BUSINESS_SLUG}" ${RESET ? "(RESET)" : "(append)"}\n`,
  );

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, timezone")
    .eq("slug", BUSINESS_SLUG)
    .maybeSingle();
  if (!business) {
    console.error(`✗ Negocio "${BUSINESS_SLUG}" no encontrado.`);
    process.exit(1);
  }
  console.log(`✓ ${business.name} (tz=${business.timezone})`);

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents")
    .eq("business_id", business.id)
    .eq("is_active", true);
  if (!products || products.length === 0) {
    console.error(`✗ Sin productos. Corré seed-rdg-menu.ts antes.`);
    process.exit(1);
  }
  console.log(`✓ ${products.length} productos`);

  // Concentración 80/20: top 7 productos pesan más
  const sortedByPrice = [...products].sort(
    (a, b) => Number(b.price_cents) - Number(a.price_cents),
  );
  const weightedProducts = products.map((p, i) => {
    const inTopByName = sortedByPrice.slice(0, 7).some((tp) => tp.id === p.id);
    return { value: p, weight: inTopByName ? 8 : 3 + (i % 4) };
  });

  if (RESET) {
    console.log(`\nLimpieza...`);
    // El cascade borra order_items, order_item_modifiers, order_status_history.
    const { error: ordersErr } = await supabase
      .from("orders")
      .delete()
      .eq("business_id", business.id);
    if (ordersErr) console.error("  ✗ orders:", ordersErr.message);
    const { error: resErr } = await supabase
      .from("reservations")
      .delete()
      .eq("business_id", business.id);
    if (resErr) console.error("  ✗ reservations:", resErr.message);
    const { error: custErr } = await supabase
      .from("customers")
      .delete()
      .eq("business_id", business.id);
    if (custErr) console.error("  ✗ customers:", custErr.message);
    console.log(`  ✓ orders + reservations + customers limpiados`);
  }

  // 1. Customers ─────────────────────────────────────────────────────────────
  const CUSTOMER_COUNT = 70;
  console.log(`\nCustomers (${CUSTOMER_COUNT})...`);

  const phoneSet = new Set<string>();
  const customerInputs: {
    name: string;
    phone: string;
    email: string | null;
    created_at: string;
  }[] = [];

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const fn = rand(FIRST_NAMES);
    const ln = rand(LAST_NAMES);
    const name = `${fn} ${ln}`;
    let phone = `+549341${randInt(4000000, 9999999)}`;
    while (phoneSet.has(phone)) {
      phone = `+549341${randInt(4000000, 9999999)}`;
    }
    phoneSet.add(phone);
    const slug = `${fn}.${ln}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const email =
      Math.random() < 0.7
        ? `${slug}${randInt(0, 99)}@${rand(["gmail.com", "hotmail.com", "yahoo.com"])}`
        : null;

    // created_at: 30 % en últimos 7 días (incluye hoy/ayer), resto distribuido en el año
    let daysAgo: number;
    const r = Math.random();
    if (r < 0.05) daysAgo = 0;
    else if (r < 0.1) daysAgo = 1;
    else if (r < 0.3) daysAgo = randInt(2, 7);
    else if (r < 0.6) daysAgo = randInt(8, 60);
    else daysAgo = randInt(60, 360);

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(randInt(8, 23), randInt(0, 59), 0, 0);

    customerInputs.push({
      name,
      phone,
      email,
      created_at: createdAt.toISOString(),
    });
  }

  const customerRows: { id: string; name: string; phone: string }[] = [];
  for (const batch of chunk(customerInputs, 50)) {
    const rows = batch.map((c) => ({ ...c, business_id: business.id }));
    const { data, error } = await supabase
      .from("customers")
      .upsert(rows, { onConflict: "business_id,phone" })
      .select("id, name, phone");
    if (error) {
      console.error("  ✗ batch:", error.message);
      continue;
    }
    if (data) customerRows.push(...data);
  }
  console.log(`  ✓ ${customerRows.length} customers cargados`);

  if (customerRows.length === 0) {
    console.error("Sin customers, abortando.");
    return;
  }

  // 2. Orders helper ─────────────────────────────────────────────────────────
  type OrderInput = {
    customer: { id: string; name: string; phone: string };
    status: string;
    delivery_type: "delivery" | "pickup" | "dine_in";
    created_at: Date;
  };

  type ItemDraft = {
    product_id: string;
    product_name: string;
    unit_price_cents: number;
    quantity: number;
    subtotal_cents: number;
  };

  function buildItemDrafts(): ItemDraft[] {
    const itemCount = randInt(1, 5);
    return Array.from({ length: itemCount }, () => {
      const p = pickWeighted(weightedProducts);
      const qty = randInt(1, 3);
      const unit = Number(p.price_cents);
      return {
        product_id: p.id,
        product_name: p.name,
        unit_price_cents: unit,
        quantity: qty,
        subtotal_cents: unit * qty,
      };
    });
  }

  function buildOrderRow(o: OrderInput, items: ItemDraft[]) {
    const subtotal = items.reduce((s, it) => s + it.subtotal_cents, 0);
    const deliveryFee = o.delivery_type === "delivery" ? 80000 : 0;
    const total = subtotal + deliveryFee;
    const street = `${rand(STREETS)} ${randInt(100, 4000)}`;
    return {
      order_number: 0,
      business_id: business.id,
      customer_id: o.customer.id,
      customer_name: o.customer.name,
      customer_phone: o.customer.phone,
      delivery_type: o.delivery_type,
      delivery_address: o.delivery_type === "delivery" ? street : null,
      delivery_notes:
        o.delivery_type === "delivery" ? rand(NOTES_DELIVERY) : null,
      status: o.status,
      subtotal_cents: subtotal,
      delivery_fee_cents: deliveryFee,
      discount_cents: 0,
      total_cents: total,
      payment_method: rand(PAYMENT_METHODS),
      payment_status:
        o.status === "delivered"
          ? "paid"
          : o.status === "cancelled"
            ? "refunded"
            : "pending",
      cancelled_reason:
        o.status === "cancelled"
          ? rand(["Cliente canceló", "Sin stock", "Demora excesiva"])
          : null,
      created_at: o.created_at.toISOString(),
      updated_at: o.created_at.toISOString(),
    };
  }

  async function insertBatch(inputs: OrderInput[]): Promise<number> {
    let ok = 0;
    for (const batch of chunk(inputs, 80)) {
      const itemsByIndex = batch.map(() => buildItemDrafts());
      const orderRows = batch.map((b, i) => buildOrderRow(b, itemsByIndex[i]!));
      const { data: inserted, error } = await supabase
        .from("orders")
        .insert(orderRows)
        .select("id");
      if (error || !inserted) {
        console.error("  ✗ orders batch:", error?.message);
        continue;
      }
      const allItems: (ItemDraft & { order_id: string })[] = [];
      for (let i = 0; i < inserted.length; i++) {
        const orderId = inserted[i]!.id;
        for (const it of itemsByIndex[i]!) {
          allItems.push({ ...it, order_id: orderId });
        }
      }
      for (const ib of chunk(allItems, 500)) {
        const { error: itemErr } = await supabase
          .from("order_items")
          .insert(ib);
        if (itemErr) console.error("  ✗ items:", itemErr.message);
      }
      ok += inserted.length;
    }
    return ok;
  }

  // 3. Pedidos pasados (~365 días con estacionalidad) ────────────────────────
  console.log(`\nGenerando pedidos del último año...`);
  const pastInputs: OrderInput[] = [];

  // Por día: base count crece con el tiempo (de 5 a 14), boost weekend
  for (let daysAgo = 365; daysAgo >= 1; daysAgo--) {
    const day = new Date();
    day.setDate(day.getDate() - daysAgo);
    const dow = day.getDay();
    // Crecimiento lineal de 5 a 14 a lo largo del año
    const growthFactor = 1 + ((365 - daysAgo) / 365) * 0.8;
    const baseCount = Math.round(6 * growthFactor);
    // Weekend boost: vie/sáb/dom (5,6,0) +60 %, lunes -40 %
    let dowFactor = 1;
    if (dow === 5 || dow === 6) dowFactor = 1.6;
    else if (dow === 0) dowFactor = 1.4;
    else if (dow === 1) dowFactor = 0.6;
    else if (dow === 2) dowFactor = 0.85;
    const dayCount = Math.max(
      1,
      Math.round(baseCount * dowFactor + randInt(-2, 3)),
    );

    for (let i = 0; i < dayCount; i++) {
      // Hora con peaks
      const hourBucket = pickWeighted([
        { value: "lunch", weight: 35 },
        { value: "afternoon", weight: 8 },
        { value: "dinner", weight: 50 },
        { value: "late", weight: 7 },
      ]);
      let hour: number;
      if (hourBucket === "lunch") hour = randInt(12, 15);
      else if (hourBucket === "afternoon") hour = randInt(16, 19);
      else if (hourBucket === "dinner") hour = randInt(20, 22);
      else hour = randInt(22, 23);

      const createdAt = new Date(day);
      createdAt.setHours(hour, randInt(0, 59), randInt(0, 59), 0);

      const status = pickWeighted([
        { value: "delivered", weight: 95 },
        { value: "cancelled", weight: 5 },
      ]);

      const customer = rand(customerRows);

      pastInputs.push({
        customer,
        status,
        delivery_type: pickWeighted(DELIVERY_TYPES),
        created_at: createdAt,
      });
    }
  }

  console.log(`  ${pastInputs.length} órdenes a insertar (en chunks)`);
  const pastOk = await insertBatch(pastInputs);
  console.log(`  ✓ ${pastOk} órdenes pasadas`);

  // 4. Pedidos de hoy ────────────────────────────────────────────────────────
  console.log(`\nPedidos de hoy...`);
  const TODAY_COUNT = randInt(25, 35);
  const todayInputs: OrderInput[] = [];
  const now = new Date();
  for (let i = 0; i < TODAY_COUNT; i++) {
    const startOfDay = new Date(now);
    startOfDay.setHours(11, 0, 0, 0);
    const minutesIntoDay = Math.max(
      30,
      (now.getTime() - startOfDay.getTime()) / 60000,
    );
    const offsetMinutes = randInt(0, Math.floor(minutesIntoDay));
    const createdAt = new Date(startOfDay.getTime() + offsetMinutes * 60000);
    if (createdAt > now) createdAt.setTime(now.getTime() - 60000 * randInt(1, 30));

    todayInputs.push({
      customer: rand(customerRows),
      status: pickWeighted(TODAY_STATUSES),
      delivery_type: pickWeighted(DELIVERY_TYPES),
      created_at: createdAt,
    });
  }

  const todayOk = await insertBatch(todayInputs);
  console.log(`  ✓ ${todayOk} órdenes de hoy`);

  // 5. Floor plan + mesas + reservas ─────────────────────────────────────────
  console.log(`\nFloor plan + mesas + reservas...`);

  let floorPlanId: string;
  const { data: existingFp } = await supabase
    .from("floor_plans")
    .select("id")
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();
  if (existingFp) {
    floorPlanId = existingFp.id;
  } else {
    const { data: fp } = await supabase
      .from("floor_plans")
      .insert({
        business_id: business.id,
        name: "Salón principal",
        width: 1000,
        height: 700,
      })
      .select("id")
      .single();
    floorPlanId = fp!.id;
  }

  const { data: existingTables } = await supabase
    .from("tables")
    .select("id, seats")
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
    const { data } = await supabase
      .from("tables")
      .insert(tablesDef.map((t) => ({ ...t, floor_plan_id: floorPlanId })))
      .select("id, seats");
    tableRows = data ?? [];
  }

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

  let resOk = 0;
  // 60 reservas pasadas (90 días)
  for (let i = 0; i < 60; i++) {
    const daysAgo = randInt(1, 90);
    const slotHour = rand([12, 13, 20, 21]);
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() - daysAgo);
    startsAt.setHours(slotHour, rand([0, 30]), 0, 0);
    const partySize = randInt(2, 8);
    const table =
      tableRows.find((t) => t.seats >= partySize) ?? rand(tableRows);
    const status = pickWeighted([
      { value: "completed" as const, weight: 75 },
      { value: "no_show" as const, weight: 10 },
      { value: "cancelled" as const, weight: 15 },
    ]);
    const endsAt = new Date(startsAt.getTime() + 90 * 60_000);
    const customer = rand(customerRows);
    const { error } = await supabase.from("reservations").insert({
      business_id: business.id,
      table_id: table.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      party_size: partySize,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status,
      notes: rand(RESERVATION_NOTES),
      source: Math.random() < 0.7 ? "web" : "admin",
    });
    if (!error) resOk++;
  }

  // 20 confirmadas hoy + próximos 14 días
  for (let i = 0; i < 20; i++) {
    const daysAhead = randInt(0, 14);
    const slotHour = rand([12, 13, 20, 21]);
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + daysAhead);
    startsAt.setHours(slotHour, rand([0, 30]), 0, 0);
    const partySize = randInt(2, 8);
    const table =
      tableRows.find((t) => t.seats >= partySize) ?? rand(tableRows);
    const endsAt = new Date(startsAt.getTime() + 90 * 60_000);
    const customer = rand(customerRows);
    const { error } = await supabase.from("reservations").insert({
      business_id: business.id,
      table_id: table.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      party_size: partySize,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
      notes: rand(RESERVATION_NOTES),
      source: Math.random() < 0.7 ? "web" : "admin",
    });
    if (!error) resOk++;
  }
  console.log(`  ✓ ${resOk} reservas`);

  console.log(
    `\n✓ Listo. Demo full cargada en "${BUSINESS_SLUG}":` +
      `\n  customers: ${customerRows.length}` +
      `\n  orders pasadas: ${pastOk}` +
      `\n  orders hoy: ${todayOk}` +
      `\n  reservas: ${resOk}`,
  );
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
