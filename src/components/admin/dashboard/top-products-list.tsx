import { Flame } from "lucide-react";

export function TopProductsList({
  products,
}: {
  products: { name: string; quantity: number }[];
}) {
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
        <ol className="mt-5 space-y-3">
          {products.map((p, i) => (
            <li key={p.name} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="text-xs font-semibold tabular-nums text-zinc-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-sm font-medium text-zinc-900">
                    {p.name}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
                  {p.quantity}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-zinc-100">
                <div
                  className="h-1 rounded-full bg-zinc-900 transition-all duration-700"
                  style={{ width: `${(p.quantity / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
