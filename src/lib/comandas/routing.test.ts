import { describe, expect, it } from "vitest";

import { resolveStation } from "./routing";

describe("resolveStation", () => {
  it("usa el override del producto si está presente", () => {
    const result = resolveStation(
      { station_id: "prod-station", category: { station_id: "cat-station" } },
      "global",
    );
    expect(result).toBe("prod-station");
  });

  it("cae en la station de la categoría si el producto no la tiene", () => {
    const result = resolveStation(
      { station_id: null, category: { station_id: "cat-station" } },
      "global",
    );
    expect(result).toBe("cat-station");
  });

  it("usa el fallback global si ni producto ni categoría tienen station", () => {
    const result = resolveStation(
      { station_id: null, category: { station_id: null } },
      "global",
    );
    expect(result).toBe("global");
  });

  it("devuelve null si no hay producto, categoría ni fallback", () => {
    const result = resolveStation({ station_id: null, category: null });
    expect(result).toBeNull();
  });

  it("trata category null como si la categoría no tuviera station", () => {
    const result = resolveStation(
      { station_id: null, category: null },
      "global",
    );
    expect(result).toBe("global");
  });
});
