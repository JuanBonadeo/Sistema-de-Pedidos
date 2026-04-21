import { formatCurrency } from "@/lib/currency";
import type { DayBucket } from "@/lib/admin/reports-query";

function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d);
  return date
    .toLocaleDateString("es-AR", { weekday: "short", day: "2-digit" })
    .replace(".", "");
}

export function RevenueChart({ data }: { data: DayBucket[] }) {
  const max = Math.max(...data.map((d) => d.revenueCents), 1);
  const total = data.reduce((s, d) => s + d.revenueCents, 0);

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Ingresos por día
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Evolución del período
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Total
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-zinc-900">
            {formatCurrency(total)}
          </p>
        </div>
      </header>

      <div className="mt-8 flex h-48 items-end gap-2">
        {data.map((d) => {
          const h = Math.max(4, Math.round((d.revenueCents / max) * 100));
          const isLast = d === data[data.length - 1];
          return (
            <div
              key={d.date}
              className="group flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <span className="text-[0.65rem] font-medium tabular-nums text-zinc-500">
                {d.orderCount}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-lg transition-all duration-700"
                  style={{
                    height: `${h}%`,
                    background: isLast
                      ? "var(--brand)"
                      : d.revenueCents === 0
                        ? "var(--color-zinc-100, #f4f4f5)"
                        : "var(--color-zinc-300, #d4d4d8)",
                  }}
                  title={`${dayLabel(d.date)} · ${formatCurrency(d.revenueCents)}`}
                />
              </div>
              <span className="truncate text-[0.65rem] font-medium capitalize text-zinc-500">
                {dayLabel(d.date)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
