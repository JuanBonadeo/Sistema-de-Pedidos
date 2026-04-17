import { formatCurrency } from "@/lib/currency";
import type { TopProduct } from "@/lib/admin/reports-query";

export function TopProducts({ products }: { products: TopProduct[] }) {
  return (
    <section className="bg-card rounded-xl p-4">
      <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
        Top productos
      </h2>
      {products.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm italic">
          Sin ventas en el período.
        </p>
      ) : (
        <ol className="mt-3 grid gap-2">
          {products.map((p, idx) => (
            <li
              key={p.product_name}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-baseline gap-3">
                <span className="text-muted-foreground w-5 text-right tabular-nums text-xs">
                  {idx + 1}.
                </span>
                <span className="truncate font-medium">{p.product_name}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold">{p.quantity}×</span>{" "}
                <span className="text-muted-foreground">
                  {formatCurrency(p.revenueCents)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
