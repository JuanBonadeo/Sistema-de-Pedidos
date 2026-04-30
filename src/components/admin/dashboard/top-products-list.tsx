import { Flame } from "lucide-react";

import { formatCurrency } from "@/lib/currency";

type Product = {
  name: string;
  quantity: number;
  revenueCents: number;
};

export function TopProductsList({ products }: { products: Product[] }) {
  const max = Math.max(1, ...products.map((p) => p.quantity));

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Más pedidos · hoy
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
          Top productos
        </h2>
      </header>

      {products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200">
            <Flame className="size-4 text-zinc-500" />
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            Sin productos vendidos todavía.
          </p>
        </div>
      ) : (
        <ol className="mt-5 space-y-3.5">
          {products.map((p, i) => {
            const pct = (p.quantity / max) * 100;
            return (
              <li key={p.name} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[0.65rem] font-bold tabular-nums text-zinc-500">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-zinc-900">
                      {p.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-zinc-900">
                      {p.quantity}
                      <span className="ml-1 text-[0.65rem] font-medium uppercase tracking-wide text-zinc-400">
                        u
                      </span>
                    </span>
                    <span className="block text-[0.65rem] tabular-nums text-zinc-500">
                      {formatCurrency(p.revenueCents)}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background:
                        i === 0
                          ? "var(--brand, #18181b)"
                          : "#18181b",
                      opacity: i === 0 ? 1 : 0.85 - i * 0.08,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
