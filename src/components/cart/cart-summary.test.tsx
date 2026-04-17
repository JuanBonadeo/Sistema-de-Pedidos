import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { CartSummary } from "./cart-summary";

describe("<CartSummary />", () => {
  it("shows formatted subtotal, delivery and total", () => {
    render(
      <CartSummary
        subtotalCents={1000000}
        deliveryFeeCents={150000}
        totalCents={1150000}
      />,
    );
    expect(screen.getByText(/\$\s?10\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?1\.500/)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?11\.500/)).toBeInTheDocument();
  });

  it("shows placeholder label when deliveryFeeCents is null", () => {
    render(
      <CartSummary
        subtotalCents={500000}
        deliveryFeeCents={null}
        deliveryFeeLabel="Ingresá tu dirección"
        totalCents={500000}
      />,
    );
    expect(screen.getByText("Ingresá tu dirección")).toBeInTheDocument();
  });
});
