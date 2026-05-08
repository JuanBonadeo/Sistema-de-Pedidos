import { describe, it, expect } from "vitest";

import {
  ALL_OPERATIONAL_STATUSES,
  canTransition,
  nextOpenedAt,
  type OperationalStatus,
} from "./state-machine";

// Matriz canónica de CU-07 (5x5).
// `null` para self-transitions (legal por convención no-op).
const LEGAL_MATRIX: Record<
  OperationalStatus,
  Record<OperationalStatus, boolean>
> = {
  libre: {
    libre: true,
    ocupada: true,
    esperando_pedido: false,
    esperando_cuenta: false,
    limpiar: false,
  },
  ocupada: {
    libre: true,
    ocupada: true,
    esperando_pedido: true,
    esperando_cuenta: true,
    limpiar: true,
  },
  esperando_pedido: {
    libre: false,
    ocupada: true,
    esperando_pedido: true,
    esperando_cuenta: true,
    limpiar: true,
  },
  esperando_cuenta: {
    libre: true,
    ocupada: false,
    esperando_pedido: true,
    esperando_cuenta: true,
    limpiar: true,
  },
  limpiar: {
    libre: true,
    ocupada: false,
    esperando_pedido: false,
    esperando_cuenta: false,
    limpiar: true,
  },
};

describe("canTransition (CU-07)", () => {
  for (const from of ALL_OPERATIONAL_STATUSES) {
    for (const to of ALL_OPERATIONAL_STATUSES) {
      const expected = LEGAL_MATRIX[from][to];
      it(`${from} → ${to} → ${expected}`, () => {
        expect(canTransition(from, to)).toBe(expected);
      });
    }
  }

  it("self-transitions siempre devuelven true (no-op)", () => {
    for (const s of ALL_OPERATIONAL_STATUSES) {
      expect(canTransition(s, s)).toBe(true);
    }
  });
});

describe("nextOpenedAt (CU-07 R2)", () => {
  it("libre → ocupada con current null setea timestamp ISO", () => {
    const before = Date.now();
    const next = nextOpenedAt("libre", "ocupada", null);
    const after = Date.now();
    expect(next).not.toBeNull();
    const ts = new Date(next!).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("libre → ocupada con current existente preserva el valor", () => {
    const existing = "2026-01-01T00:00:00.000Z";
    expect(nextOpenedAt("libre", "ocupada", existing)).toBe(existing);
  });

  it("X → libre limpia opened_at desde cualquier estado", () => {
    const existing = "2026-01-01T00:00:00.000Z";
    for (const from of ALL_OPERATIONAL_STATUSES) {
      expect(nextOpenedAt(from, "libre", existing)).toBeNull();
    }
  });

  it("transiciones intermedias preservan opened_at", () => {
    const existing = "2026-01-01T00:00:00.000Z";
    expect(nextOpenedAt("ocupada", "esperando_pedido", existing)).toBe(existing);
    expect(nextOpenedAt("esperando_pedido", "esperando_cuenta", existing)).toBe(
      existing,
    );
    expect(nextOpenedAt("esperando_cuenta", "esperando_pedido", existing)).toBe(
      existing,
    );
    expect(nextOpenedAt("ocupada", "limpiar", existing)).toBe(existing);
    expect(nextOpenedAt("esperando_cuenta", "limpiar", existing)).toBe(existing);
  });

  it("self-transition preserva opened_at", () => {
    const existing = "2026-01-01T00:00:00.000Z";
    for (const s of ALL_OPERATIONAL_STATUSES) {
      if (s === "libre") {
        expect(nextOpenedAt(s, s, existing)).toBeNull(); // libre→libre limpia
      } else {
        expect(nextOpenedAt(s, s, existing)).toBe(existing);
      }
    }
  });
});
