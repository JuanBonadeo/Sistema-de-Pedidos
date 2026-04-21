import { formatCurrency } from "@/lib/currency";

type Day = { date: string; revenueCents: number; orders: number };

function shortDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("es-AR", { weekday: "short" })
    .format(d)
    .replace(".", "");
}

export function RevenueSparkline({ data }: { data: Day[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenueCents));
  const todayKey = data[data.length - 1]?.date;

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Últimos 7 días
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Ingresos por día
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Total semanal
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-zinc-900">
            {formatCurrency(data.reduce((s, d) => s + d.revenueCents, 0))}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-7 gap-2">
        {data.map((d) => {
          const h = Math.max(8, Math.round((d.revenueCents / max) * 120));
          const isToday = d.date === todayKey;
          return (
            <div key={d.date} className="flex flex-col items-center gap-2">
              <div className="flex h-[120px] w-full items-end">
                <div
                  className={
                    "w-full rounded-lg transition-all duration-500 " +
                    (isToday
                      ? "bg-zinc-900"
                      : d.revenueCents === 0
                        ? "bg-zinc-100"
                        : "bg-zinc-300 group-hover:bg-zinc-400")
                  }
                  style={{ height: `${h}px` }}
                  title={`${formatCurrency(d.revenueCents)} · ${d.orders} pedidos`}
                />
              </div>
              <span
                className={
                  "text-[0.65rem] font-medium tabular-nums " +
                  (isToday ? "text-zinc-900" : "text-zinc-500")
                }
              >
                {shortDay(d.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
