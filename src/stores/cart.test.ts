import { describe, it, expect } from "vitest";
import {
  cartItemSubtotal,
  cartTotal,
  cartCount,
  type CartItem,
} from "./cart";

const item = (q: number, price: number, mods: number[] = []): CartItem => ({
  id: crypto.randomUUID(),
  product_id: crypto.randomUUID(),
  product_name: "x",
  unit_price_cents: price,
  quantity: q,
  modifiers: mods.map((p) => ({
    modifier_id: crypto.randomUUID(),
    group_id: crypto.randomUUID(),
    name: "m",
    price_delta_cents: p,
  })),
});

describe("cart math", () => {
  it("subtotal includes modifiers times quantity", () => {
    expect(cartItemSubtotal(item(2, 1000, [100, 200]))).toBe(2600);
  });

  it("subtotal with no modifiers", () => {
    expect(cartItemSubtotal(item(3, 500))).toBe(1500);
  });

  it("total sums all items", () => {
    expect(cartTotal([item(1, 1000, [100]), item(2, 500)])).toBe(2100);
  });

  it("count sums quantities", () => {
    expect(cartCount([item(2, 100), item(3, 100), item(1, 100)])).toBe(6);
  });
});
