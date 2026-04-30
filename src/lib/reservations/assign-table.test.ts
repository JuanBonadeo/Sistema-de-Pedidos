import { describe, expect, it } from "vitest";

import { pickTable, pickTableExcluding } from "./assign-table";
import type { FloorTable, Reservation } from "./types";

function makeTable(id: string, seats: number, status: "active" | "disabled" = "active"): FloorTable {
  return {
    id,
    floor_plan_id: "fp",
    label: `Mesa ${id}`,
    seats,
    shape: "circle",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    status,
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("pickTable", () => {
  const windowStart = new Date("2026-04-21T20:00:00Z");
  const windowEnd = new Date("2026-04-21T22:00:00Z");

  it("returns the smallest fitting table when free", () => {
    const tables = [makeTable("a", 8), makeTable("b", 4), makeTable("c", 2)];
    const result = pickTable({
      tables,
      reservations: [],
      partySize: 3,
      windowStart,
      windowEnd,
    });
    expect(result?.id).toBe("b");
  });

  it("skips disabled tables", () => {
    const tables = [makeTable("a", 4, "disabled"), makeTable("b", 6)];
    const result = pickTable({
      tables,
      reservations: [],
      partySize: 3,
      windowStart,
      windowEnd,
    });
    expect(result?.id).toBe("b");
  });

  it("skips tables with overlapping live reservations", () => {
    const tables = [makeTable("a", 4), makeTable("b", 6)];
    const reservations: Reservation[] = [
      {
        id: "r1",
        business_id: "x",
        table_id: "a",
        user_id: null,
        customer_name: "Y",
        customer_phone: "0",
        party_size: 2,
        starts_at: "2026-04-21T19:00:00Z",
        ends_at: "2026-04-21T20:30:00Z",
        status: "confirmed",
        notes: null,
        source: "web",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];
    const result = pickTable({
      tables,
      reservations,
      partySize: 2,
      windowStart,
      windowEnd,
    });
    expect(result?.id).toBe("b");
  });

  it("returns null when no table fits", () => {
    const tables = [makeTable("a", 2)];
    const result = pickTable({
      tables,
      reservations: [],
      partySize: 5,
      windowStart,
      windowEnd,
    });
    expect(result).toBeNull();
  });

  it("ignores cancelled reservations on the table", () => {
    const tables = [makeTable("a", 4)];
    const reservations: Reservation[] = [
      {
        id: "r1",
        business_id: "x",
        table_id: "a",
        user_id: null,
        customer_name: "Y",
        customer_phone: "0",
        party_size: 2,
        starts_at: "2026-04-21T19:00:00Z",
        ends_at: "2026-04-21T22:00:00Z",
        status: "cancelled",
        notes: null,
        source: "web",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];
    const result = pickTable({
      tables,
      reservations,
      partySize: 2,
      windowStart,
      windowEnd,
    });
    expect(result?.id).toBe("a");
  });
});

describe("pickTableExcluding", () => {
  it("excludes specified ids and returns next-best fit", () => {
    const tables = [makeTable("a", 2), makeTable("b", 4), makeTable("c", 6)];
    const result = pickTableExcluding(
      {
        tables,
        reservations: [],
        partySize: 2,
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 60_000),
      },
      new Set(["a", "b"]),
    );
    expect(result?.id).toBe("c");
  });
});
