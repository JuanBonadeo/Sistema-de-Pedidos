import { describe, it, expect } from "vitest";
import { formatCurrency } from "./currency";

describe("formatCurrency", () => {
  it("formats cents as ARS with no decimals", () => {
    expect(formatCurrency(1500)).toMatch(/\$\s?15/);
  });

  it("accepts bigint", () => {
    expect(formatCurrency(1000000n)).toMatch(/\$\s?10\.000/);
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toMatch(/\$\s?0/);
  });
});
