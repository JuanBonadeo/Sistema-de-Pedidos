// ============================================
// Cálculo puro del efectivo esperado en caja al cerrar turno.
//
// Fórmula (R6 de CU-06):
//   expected_cash = opening_cash
//                 + sum(payments cash paid del turno)
//                 + sum(ingresos)
//                 − sum(sangrías)
//
// Las propinas tipeadas en el posnet (`tip_cents` con method='card_manual')
// no entran al efectivo de la caja. Las propinas en cash sí entran (van con
// el `amount_cents` del payment cash).
//
// Función pura y sin I/O para testear con casos límite sin tocar DB.
// ============================================

import type { CajaMovimientoKind, PaymentMethod } from "./types";

export type ExpectedCashInput = {
  opening_cash_cents: number;
  payments: Array<{ method: PaymentMethod; amount_cents: number }>;
  movimientos: Array<{ kind: CajaMovimientoKind; amount_cents: number }>;
};

export function calculateExpectedCash(input: ExpectedCashInput): number {
  const cashPayments = input.payments
    .filter((p) => p.method === "cash")
    .reduce((acc, p) => acc + p.amount_cents, 0);

  const ingresos = input.movimientos
    .filter((m) => m.kind === "ingreso")
    .reduce((acc, m) => acc + m.amount_cents, 0);

  const sangrias = input.movimientos
    .filter((m) => m.kind === "sangria")
    .reduce((acc, m) => acc + m.amount_cents, 0);

  return input.opening_cash_cents + cashPayments + ingresos - sangrias;
}
