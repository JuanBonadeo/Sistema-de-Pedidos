import { describe, it, expect } from "vitest";

import {
  ALL_OPERATIONAL_STATUSES,
  canTransition,
  nextOpenedAt,
  type OperationalStatus,
} from "./state-machine";

// Matriz canónica del modelo simplificado (post 2026-05-08, migración 0038).
// 3 estados: libre, ocupada, pidio_cuenta.
// `true` = transición legal; las self-transitions también son legales (no-op).
const LEGAL_MATRIX: Record<
  OperationalStatus,
  Record<OperationalStatus, boolean>
> = {
  libre: {
    libre: true,
    ocupada: true,
    pidio_cuenta: false,
  },
  ocupada: {
    libre: true,
    ocupada: true,
    pidio_cuenta: true,
  },
  pidio_cuenta: {
    libre: true,
    ocupada: true,
    pidio_cuenta: true,
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
    expect(nextOpenedAt("ocupada", "pidio_cuenta", existing)).toBe(existing);
    expect(nextOpenedAt("pidio_cuenta", "ocupada", existing)).toBe(existing);
  });

  it("self-transition preserva opened_at salvo libre→libre", () => {
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
