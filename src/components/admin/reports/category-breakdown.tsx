import { formatCurrency } from "@/lib/currency";
import type { CategoryBreakdown } from "@/lib/admin/reports-query";

const PALETTE = [
  "#18181b",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

export function CategoryBreakdownSection({
  data,
}: {
  data: CategoryBreakdown[];
}) {
  if (data.length === 0) return null;

  const totalRevenue = data.reduce((s, c) => s + c.revenueCents, 0);
  const totalQuantity = data.reduce((s, c) => s + c.quantity, 0);
  const max = Math.max(1, ...data.map((c) => c.revenueCents));

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Catálogo
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Ingresos por categoría
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">
            {totalQuantity} unidades · {formatCurrency(totalRevenue)}
          </p>
        </div>
      </header>

      <ul className="mt-5 space-y-3.5">
        {data.map((c, i) => {
          const pct = totalRevenue > 0 ? (c.revenueCents / totalRevenue) * 100 : 0;
          const widthPct = (c.revenueCents / max) * 100;
          const color = PALETTE[i % PALETTE.length]!;
          return (
            <li key={c.categoryId ?? "none"} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ background: color }}
                  />
                  <span className="truncate text-sm font-medium text-zinc-900">
                    {c.categoryName}
                  </span>
                  <span className="text-xs tabular-nums text-zinc-400">
                    · {c.productCount}{" "}
                    {c.productCount === 1 ? "producto" : "productos"}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-zinc-900">
                    {formatCurrency(c.revenueCents)}
                  </span>
                  <span className="block text-[0.65rem] tabular-nums text-zinc-500">
                    {c.quantity} u · {pct.toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${widthPct}%`, background: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
