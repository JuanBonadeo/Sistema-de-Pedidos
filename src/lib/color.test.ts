import { describe, it, expect } from "vitest";
import { hexToHsl } from "./color";

describe("hexToHsl", () => {
  it("converts brand red #E11D48", () => {
    expect(hexToHsl("#E11D48")).toBe("347 77% 50%");
  });

  it("accepts hex without leading #", () => {
    expect(hexToHsl("E11D48")).toBe("347 77% 50%");
  });

  it("converts pure white to 0 0% 100%", () => {
    expect(hexToHsl("#FFFFFF")).toBe("0 0% 100%");
  });

  it("converts pure black to 0 0% 0%", () => {
    expect(hexToHsl("#000000")).toBe("0 0% 0%");
  });

  it("is case-insensitive", () => {
    expect(hexToHsl("#e11d48")).toBe(hexToHsl("#E11D48"));
  });

  it("throws on invalid input", () => {
    expect(() => hexToHsl("not-a-color")).toThrow();
    expect(() => hexToHsl("#ABC")).toThrow();
  });
});
