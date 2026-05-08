// ============================================
// Tipos del dominio Caja (CU-06).
//
// Las filas pelotas pelotas vienen de Supabase tipadas via Database — esto
// son los DTO que cruzan a UI sin metadata sensible. `business_id` se omite
// del tipo público porque la cross-tenant defense vive en cada query/action.
// ============================================

export type Caja = {
  id: string;
  business_id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};

export type CajaTurnoStatus = "open" | "closed";

export type CajaTurno = {
  id: string;
  caja_id: string;
  business_id: string;
  encargado_id: string;
  opening_cash_cents: number;
  expected_cash_cents: number | null;
  closing_cash_cents: number | null;
  difference_cents: number | null;
  closing_notes: string | null;
  status: CajaTurnoStatus;
  opened_at: string;
  closed_at: string | null;
};

export type CajaMovimientoKind = "apertura" | "cierre" | "sangria" | "ingreso";

export type CajaMovimiento = {
  id: string;
  caja_turno_id: string;
  business_id: string;
  kind: CajaMovimientoKind;
  amount_cents: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

// Métodos de cobro definidos en CU-04. Importable desde lib/billing también.
export type PaymentMethod =
  | "cash"
  | "card_manual"
  | "mp_link"
  | "mp_qr"
  | "other";

export type TurnoLiveStats = {
  turno_id: string;
  // Total cobrado en payments paid del turno (incluye amount_cents, no propinas).
  total_ventas_cents: number;
  total_propinas_cents: number;
  ventas_por_metodo: Record<PaymentMethod, number>;
  cobros_count: number;
  // expected_cash = opening + cash payments + ingresos − sangrías.
  expected_cash_cents: number;
};

export type ActiveTurnoView = CajaTurno & {
  caja_name: string;
  encargado_name: string | null;
};
