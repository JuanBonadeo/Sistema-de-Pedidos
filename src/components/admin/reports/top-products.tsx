import { formatCurrency } from "@/lib/currency";
import type { TopProduct } from "@/lib/admin/reports-query";

export function TopProducts({ products }: { products: TopProduct[] }) {
  const max = Math.max(1, ...products.map((p) => p.quantity));
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Top productos
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
          Más vendidos del período
        </h2>
      </header>
      {products.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center text-sm italic text-zinc-500">
          Sin ventas en el período.
        </p>
      ) : (
        <ol className="mt-5 space-y-3">
          {products.map((p, idx) => (
            <li key={p.product_name} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="text-xs font-semibold tabular-nums text-zinc-400">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-sm font-medium text-zinc-900">
                    {p.product_name}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums">
                  <span className="font-semibold text-zinc-900">
                    {p.quantity}×
                  </span>{" "}
                  <span className="text-zinc-500">
                    {formatCurrency(p.revenueCents)}
                  </span>
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-zinc-100">
                <div
                  className="h-1 rounded-full transition-all duration-700"
                  style={{
                    width: `${(p.quantity / max) * 100}%`,
                    background: "var(--brand)",
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
