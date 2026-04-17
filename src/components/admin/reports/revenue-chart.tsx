import { formatCurrency } from "@/lib/currency";
import type { DayBucket } from "@/lib/admin/reports-query";

function dayLabel(iso: string): string {
  // iso is "yyyy-MM-dd"; build a local-ish date for formatting only.
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d);
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
  });
}

export function RevenueChart({ data }: { data: DayBucket[] }) {
  const max = Math.max(...data.map((d) => d.revenueCents), 1);

  return (
    <section className="bg-card rounded-xl p-4">
      <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
        Ingresos por día
      </h2>
      <div className="mt-4 flex h-40 items-end gap-2">
        {data.map((d) => {
          const h = (d.revenueCents / max) * 100;
          return (
            <div
              key={d.date}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span className="text-muted-foreground text-[0.65rem] tabular-nums">
                {d.orderCount}
              </span>
              <div className="bg-muted relative flex w-full flex-1 items-end overflow-hidden rounded">
                <div
                  className="bg-primary w-full transition-all"
                  style={{ height: `${h}%` }}
                  title={`${dayLabel(d.date)} · ${formatCurrency(d.revenueCents)}`}
                />
              </div>
              <span className="text-muted-foreground truncate text-[0.65rem]">
                {dayLabel(d.date)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
