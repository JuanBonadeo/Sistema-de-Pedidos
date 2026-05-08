// State machine pura de estados operacionales de mesa.
// Sin side effects, sin DB. Espejo de la matriz de CU-07.
//
// Modelo simplificado (post 2026-05-08, migración 0038):
//   - libre: nadie sentado.
//   - ocupada: alguien sentado (con o sin items cargados).
//   - pidio_cuenta: pidió la cuenta, hay que cobrar.
//
// Estados eliminados (vs el modelo anterior de 5):
//   - esperando_pedido: era un sub-estado de ocupada sin diferencia
//     operativa. Absorbido en `ocupada`.
//   - limpiar: agregaba una transición intermedia que nadie respetaba.
//     Post-cobro la mesa va directo a `libre`.
//
// Ver: wiki/casos-de-uso/CU-07-estados-mesa.md

export type OperationalStatus = "libre" | "ocupada" | "pidio_cuenta";

export const ALL_OPERATIONAL_STATUSES: readonly OperationalStatus[] = [
  "libre",
  "ocupada",
  "pidio_cuenta",
] as const;

const LEGAL_TRANSITIONS: Record<
  OperationalStatus,
  readonly OperationalStatus[]
> = {
  libre: ["ocupada"],
  ocupada: ["libre", "pidio_cuenta"],
  pidio_cuenta: ["ocupada", "libre"],
} as const;

/**
 * `from === to` se trata como no-op aceptado para que el call site no tenga
 * que filtrarlo. La action upstream igual decide si insertar audit log o no.
 */
export function canTransition(
  from: OperationalStatus,
  to: OperationalStatus,
): boolean {
  if (from === to) return true;
  return LEGAL_TRANSITIONS[from].includes(to);
}

/**
 * Calcula el próximo valor de `tables.opened_at` dada una transición.
 *   - libre → ocupada: setea ahora si era null (preserva si ya tenía valor).
 *   - X → libre: limpia.
 *   - resto: preserva el valor actual.
 */
export function nextOpenedAt(
  from: OperationalStatus,
  to: OperationalStatus,
  current: string | null,
): string | null {
  if (to === "libre") return null;
  if (from === "libre" && to === "ocupada") {
    return current ?? new Date().toISOString();
  }
  return current;
}
