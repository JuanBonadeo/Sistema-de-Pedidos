import { describe, it, expect } from "vitest";
import { CreateOrderInput } from "./schema";

const UUID = "00000000-0000-4000-8000-000000000000";

const base = {
  business_slug: "pizzanapoli",
  delivery_type: "pickup" as const,
  customer_name: "Juan",
  customer_phone: "1155551234",
  items: [{ product_id: UUID, quantity: 1, modifier_ids: [] }],
};

describe("CreateOrderInput", () => {
  it("accepts a minimal pickup order", () => {
    expect(CreateOrderInput.safeParse(base).success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = CreateOrderInput.safeParse({ ...base, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects quantity 0", () => {
    const result = CreateOrderInput.safeParse({
      ...base,
      items: [{ ...base.items[0], quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty phone", () => {
    const result = CreateOrderInput.safeParse({ ...base, customer_phone: "" });
    expect(result.success).toBe(false);
  });

  it("rejects delivery without address", () => {
    const result = CreateOrderInput.safeParse({
      ...base,
      delivery_type: "delivery",
      delivery_zone_id: UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects delivery without zone", () => {
    const result = CreateOrderInput.safeParse({
      ...base,
      delivery_type: "delivery",
      delivery_address: "Calle 123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts delivery with address + zone", () => {
    const result = CreateOrderInput.safeParse({
      ...base,
      delivery_type: "delivery",
      delivery_address: "Calle 123",
      delivery_zone_id: UUID,
    });
    expect(result.success).toBe(true);
  });
});
