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
