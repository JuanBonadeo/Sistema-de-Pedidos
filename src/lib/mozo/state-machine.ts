// State machine pura de estados operacionales de mesa.
// Sin side effects, sin DB. Espejo de la matriz de CU-07.
//
// Ver: wiki/casos-de-uso/CU-07-estados-mesa.md

export type OperationalStatus =
  | "libre"
  | "ocupada"
  | "esperando_pedido"
  | "esperando_cuenta"
  | "limpiar";

export const ALL_OPERATIONAL_STATUSES: readonly OperationalStatus[] = [
  "libre",
  "ocupada",
  "esperando_pedido",
  "esperando_cuenta",
  "limpiar",
] as const;

const LEGAL_TRANSITIONS: Record<
  OperationalStatus,
  readonly OperationalStatus[]
> = {
  libre: ["ocupada"],
  ocupada: ["libre", "esperando_pedido", "esperando_cuenta", "limpiar"],
  esperando_pedido: ["ocupada", "esperando_cuenta", "limpiar"],
  esperando_cuenta: ["esperando_pedido", "libre", "limpiar"],
  limpiar: ["libre"],
} as const;

/**
 * `from === to` se trata como no-op aceptado para que el call site no tenga que
 * filtrarlo. La action upstream igual decide si insertar audit log o no.
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
 * Reglas R2 de CU-07:
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
