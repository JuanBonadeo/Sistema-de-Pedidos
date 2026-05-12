import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { calculateExpectedCash } from "./expected-cash";
import type {
  ActiveTurnoView,
  Caja,
  CajaMovimiento,
  CajaTurno,
  PaymentMethod,
  TurnoLiveStats,
} from "./types";

const EMPTY_BY_METHOD: Record<PaymentMethod, number> = {
  cash: 0,
  card_manual: 0,
  mp_link: 0,
  mp_qr: 0,
  other: 0,
};

export async function getCajasForBusiness(
  businessId: string,
): Promise<Caja[]> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("cajas")
    .select("id, business_id, name, is_active, sort_order")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []) as Caja[];
}

/**
 * Trae todas las cajas del business (activas + inactivas), pensada para
 * la pantalla de gestión donde el admin ve también las pausadas.
 */
export async function getAllCajasForBusiness(
  businessId: string,
): Promise<Caja[]> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("cajas")
    .select("id, business_id, name, is_active, sort_order")
    .eq("business_id", businessId)
    .order("is_active", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []) as Caja[];
}

export async function getActiveTurnos(
  businessId: string,
): Promise<ActiveTurnoView[]> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("caja_turnos")
    .select(
      "id, caja_id, business_id, encargado_id, opening_cash_cents, expected_cash_cents, closing_cash_cents, difference_cents, closing_notes, status, opened_at, closed_at, cajas!inner(name)",
    )
    .eq("business_id", businessId)
    .eq("status", "open")
    .order("opened_at", { ascending: true });

  if (!data || data.length === 0) return [];

  const encargadoIds = Array.from(
    new Set(data.map((row) => (row as { encargado_id: string }).encargado_id)),
  );
  const { data: encargados } = await service
    .from("users")
    .select("id, full_name")
    .in("id", encargadoIds);
  const nameById = new Map(
    (encargados ?? []).map((u) => [u.id as string, u.full_name as string | null]),
  );

  return data.map((row) => {
    const r = row as unknown as CajaTurno & {
      cajas: { name: string } | { name: string }[];
    };
    const cajaName = Array.isArray(r.cajas) ? r.cajas[0].name : r.cajas.name;
    return {
      id: r.id,
      caja_id: r.caja_id,
      business_id: r.business_id,
      encargado_id: r.encargado_id,
      opening_cash_cents: r.opening_cash_cents,
      expected_cash_cents: r.expected_cash_cents,
      closing_cash_cents: r.closing_cash_cents,
      difference_cents: r.difference_cents,
      closing_notes: r.closing_notes,
      status: r.status,
      opened_at: r.opened_at,
      closed_at: r.closed_at,
      caja_name: cajaName,
      encargado_name: nameById.get(r.encargado_id) ?? null,
    };
  });
}

/**
 * Carga un turno por id con cross-tenant defense (chequea business_id).
 * Devuelve null si no existe o pertenece a otro business.
 */
export async function getTurnoById(
  turnoId: string,
  businessId: string,
): Promise<CajaTurno | null> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("caja_turnos")
    .select(
      "id, caja_id, business_id, encargado_id, opening_cash_cents, expected_cash_cents, closing_cash_cents, difference_cents, closing_notes, status, opened_at, closed_at",
    )
    .eq("id", turnoId)
    .maybeSingle();
  if (!data) return null;
  const row = data as CajaTurno;
  if (row.business_id !== businessId) return null;
  return row;
}

/**
 * Turnos cerrados del día (calendario local del business — pero usamos
 * UTC y filtramos por opened_at >= hoy 00:00 UTC para mantenerlo simple).
 * Devuelve los snapshots con encargado_name y caja_name resueltos para
 * mostrar en el board admin.
 */
export async function getTurnosCerradosHoy(
  businessId: string,
): Promise<ActiveTurnoView[]> {
  const service = createSupabaseServiceClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data } = await service
    .from("caja_turnos")
    .select(
      "id, caja_id, business_id, encargado_id, opening_cash_cents, expected_cash_cents, closing_cash_cents, difference_cents, closing_notes, status, opened_at, closed_at, cajas!inner(name)",
    )
    .eq("business_id", businessId)
    .eq("status", "closed")
    .gte("opened_at", todayStart.toISOString())
    .order("closed_at", { ascending: false });

  if (!data || data.length === 0) return [];

  const encargadoIds = Array.from(
    new Set(data.map((row) => (row as { encargado_id: string }).encargado_id)),
  );
  const { data: encargados } = await service
    .from("users")
    .select("id, full_name")
    .in("id", encargadoIds);
  const nameById = new Map(
    (encargados ?? []).map((u) => [u.id as string, u.full_name as string | null]),
  );

  return data.map((row) => {
    const r = row as unknown as CajaTurno & {
      cajas: { name: string } | { name: string }[];
    };
    const cajaName = Array.isArray(r.cajas) ? r.cajas[0].name : r.cajas.name;
    return {
      ...r,
      caja_name: cajaName,
      encargado_name: nameById.get(r.encargado_id) ?? null,
    };
  });
}

export async function getMovimientosByTurno(
  turnoId: string,
  businessId: string,
): Promise<CajaMovimiento[]> {
  const turno = await getTurnoById(turnoId, businessId);
  if (!turno) return [];
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("caja_movimientos")
    .select(
      "id, caja_turno_id, business_id, kind, amount_cents, reason, created_by, created_at",
    )
    .eq("caja_turno_id", turnoId)
    .order("created_at", { ascending: true });
  return (data ?? []) as CajaMovimiento[];
}

/**
 * Payments paid del turno con la info que le interesa al staff: mesa
 * (si es dine_in), mozo atribuido, cliente, método, monto + propina.
 *
 * Usado por la tab Caja para listar cada cobro como un movimiento más
 * dentro de la lista cronológica del turno (junto a sangrías e ingresos).
 *
 * Cross-tenant: filtra por `business_id` del turno antes de leer.
 */
export type TurnoPayment = {
  id: string;
  method: PaymentMethod;
  amount_cents: number;
  tip_cents: number;
  created_at: string;
  order_id: string;
  order_number: number;
  delivery_type: string;
  table_label: string | null;
  customer_name: string | null;
  attributed_mozo_name: string | null;
};

export async function getPaymentsByTurno(
  turnoId: string,
  businessId: string,
): Promise<TurnoPayment[]> {
  const turno = await getTurnoById(turnoId, businessId);
  if (!turno) return [];
  const service = createSupabaseServiceClient();

  // Trae payments + order (mesa label, customer_name, delivery_type, mozo).
  // Solo "paid" — los pending/refunded no son ingresos reales.
  const { data } = await service
    .from("payments")
    .select(
      "id, method, amount_cents, tip_cents, created_at, attributed_mozo_id, order_id, orders!inner(order_number, delivery_type, customer_name, table_id, tables!orders_table_id_fkey(label))",
    )
    .eq("caja_turno_id", turnoId)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: true });

  type Row = {
    id: string;
    method: PaymentMethod;
    amount_cents: number;
    tip_cents: number;
    created_at: string;
    attributed_mozo_id: string | null;
    order_id: string;
    orders: {
      order_number: number;
      delivery_type: string;
      customer_name: string | null;
      table_id: string | null;
      tables: { label: string } | { label: string }[] | null;
    } | {
      order_number: number;
      delivery_type: string;
      customer_name: string | null;
      table_id: string | null;
      tables: { label: string } | { label: string }[] | null;
    }[] | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  // Resolver nombres de mozos en una sola query (evita N+1).
  const mozoIds = Array.from(
    new Set(rows.map((r) => r.attributed_mozo_id).filter((x): x is string => !!x)),
  );
  const mozoNameById = new Map<string, string>();
  if (mozoIds.length > 0) {
    const { data: bu } = await service
      .from("business_users")
      .select("user_id, full_name")
      .eq("business_id", businessId)
      .in("user_id", mozoIds);
    for (const m of (bu ?? []) as { user_id: string; full_name: string | null }[]) {
      if (m.full_name) mozoNameById.set(m.user_id, m.full_name);
    }
  }

  return rows.map((r) => {
    const ord = Array.isArray(r.orders) ? r.orders[0] : r.orders;
    const tbl = ord?.tables
      ? Array.isArray(ord.tables) ? ord.tables[0] : ord.tables
      : null;
    return {
      id: r.id,
      method: r.method,
      amount_cents: Number(r.amount_cents),
      tip_cents: Number(r.tip_cents),
      created_at: r.created_at,
      order_id: r.order_id,
      order_number: ord?.order_number ?? 0,
      delivery_type: ord?.delivery_type ?? "",
      table_label: tbl?.label ?? null,
      customer_name: ord?.customer_name ?? null,
      attributed_mozo_name: r.attributed_mozo_id
        ? mozoNameById.get(r.attributed_mozo_id) ?? null
        : null,
    };
  });
}

/**
 * Stats vivos del turno (calculadas on-the-fly, sin cache).
 *
 * Cross-tenant: chequea business_id del turno antes de leer payments.
 */
export async function getTurnoLiveStats(
  turnoId: string,
  businessId: string,
): Promise<TurnoLiveStats | null> {
  const turno = await getTurnoById(turnoId, businessId);
  if (!turno) return null;

  const service = createSupabaseServiceClient();

  const [paymentsRes, movimientosRes] = await Promise.all([
    service
      .from("payments")
      .select("method, amount_cents, tip_cents, payment_status")
      .eq("caja_turno_id", turnoId)
      .eq("payment_status", "paid"),
    service
      .from("caja_movimientos")
      .select("kind, amount_cents")
      .eq("caja_turno_id", turnoId),
  ]);

  const payments = (paymentsRes.data ?? []) as Array<{
    method: PaymentMethod;
    amount_cents: number;
    tip_cents: number;
  }>;
  const movimientos = (movimientosRes.data ?? []) as Array<{
    kind: "apertura" | "cierre" | "sangria" | "ingreso";
    amount_cents: number;
  }>;

  const ventas_por_metodo: Record<PaymentMethod, number> = { ...EMPTY_BY_METHOD };
  let total_ventas_cents = 0;
  let total_propinas_cents = 0;
  for (const p of payments) {
    ventas_por_metodo[p.method] = (ventas_por_metodo[p.method] ?? 0) + p.amount_cents;
    total_ventas_cents += p.amount_cents;
    total_propinas_cents += p.tip_cents;
  }

  const expected_cash_cents = calculateExpectedCash({
    opening_cash_cents: turno.opening_cash_cents,
    payments,
    movimientos,
  });

  return {
    turno_id: turnoId,
    total_ventas_cents,
    total_propinas_cents,
    ventas_por_metodo,
    cobros_count: payments.length,
    expected_cash_cents,
  };
}
