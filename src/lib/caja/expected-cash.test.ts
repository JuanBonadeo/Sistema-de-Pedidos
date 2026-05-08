import { describe, expect, it } from "vitest";

import { calculateExpectedCash } from "./expected-cash";

describe("calculateExpectedCash", () => {
  it("sin movimientos ni payments: devuelve solo el opening", () => {
    expect(
      calculateExpectedCash({
        opening_cash_cents: 100_000,
        payments: [],
        movimientos: [],
      }),
    ).toBe(100_000);
  });

  it("suma cash payments e ignora otros métodos", () => {
    expect(
      calculateExpectedCash({
        opening_cash_cents: 50_000,
        payments: [
          { method: "cash", amount_cents: 10_000 },
          { method: "cash", amount_cents: 25_000 },
          { method: "card_manual", amount_cents: 70_000 },
          { method: "mp_link", amount_cents: 30_000 },
          { method: "other", amount_cents: 5_000 },
        ],
        movimientos: [],
      }),
    ).toBe(50_000 + 10_000 + 25_000);
  });

  it("suma ingresos y resta sangrías", () => {
    expect(
      calculateExpectedCash({
        opening_cash_cents: 100_000,
        payments: [],
        movimientos: [
          { kind: "ingreso", amount_cents: 20_000 },
          { kind: "sangria", amount_cents: 30_000 },
          { kind: "sangria", amount_cents: 5_000 },
          { kind: "apertura", amount_cents: 999_999 }, // ignorada (audit)
          { kind: "cierre", amount_cents: 999_999 }, // ignorada
        ],
      }),
    ).toBe(100_000 + 20_000 - 30_000 - 5_000);
  });

  it("escenario completo: cash + ingreso + sangría + métodos varios", () => {
    expect(
      calculateExpectedCash({
        opening_cash_cents: 200_000,
        payments: [
          { method: "cash", amount_cents: 150_000 },
          { method: "cash", amount_cents: 80_000 },
          { method: "card_manual", amount_cents: 100_000 },
        ],
        movimientos: [
          { kind: "ingreso", amount_cents: 50_000 },
          { kind: "sangria", amount_cents: 70_000 },
        ],
      }),
    ).toBe(200_000 + 150_000 + 80_000 + 50_000 - 70_000);
  });
});
