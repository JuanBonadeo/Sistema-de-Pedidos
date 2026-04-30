"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { formatCurrency } from "@/lib/currency";

type ChannelKey = "delivery" | "pickup" | "dine_in";

type ChannelBreakdown = Record<
  ChannelKey,
  { count: number; revenueCents: number }
>;

const CHANNEL_META: Record<
  ChannelKey,
  { label: string; color: string; dot: string }
> = {
  delivery: { label: "Delivery", color: "#18181b", dot: "bg-zinc-900" },
  pickup: { label: "Take-away", color: "#10b981", dot: "bg-emerald-500" },
  dine_in: { label: "En mesa", color: "#f59e0b", dot: "bg-amber-500" },
};

const ORDER: ChannelKey[] = ["delivery", "pickup", "dine_in"];

export function ChannelDonut({
  data,
  rangeDays = 30,
}: {
  data: ChannelBreakdown;
  rangeDays?: number;
}) {
  const total = useMemo(
    () => ORDER.reduce((s, k) => s + data[k].count, 0),
    [data],
  );

  const pieData = useMemo(
    () =>
      ORDER.map((k) => ({
        key: k,
        name: CHANNEL_META[k].label,
        value: data[k].count,
        color: CHANNEL_META[k].color,
      })).filter((d) => d.value > 0),
    [data],
  );

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Canal de origen · últimos {rangeDays} días
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
          De dónde vienen tus pedidos
        </h2>
      </header>

      {total === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-sm text-zinc-600">
          Sin pedidos en este período.
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative size-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={450}
                  isAnimationActive={false}
                >
                  {pieData.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold tracking-tight tabular-nums text-zinc-900">
                {total}
              </span>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                pedidos
              </span>
            </div>
          </div>

          <ul className="flex-1 space-y-2.5">
            {ORDER.map((k) => {
              const item = data[k];
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <li
                  key={k}
                  className="grid grid-cols-[12px_1fr_auto] items-center gap-2.5"
                >
                  <span
                    className={`size-2.5 rounded-full ${CHANNEL_META[k].dot}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {CHANNEL_META[k].label}
                    </p>
                    <p className="text-xs tabular-nums text-zinc-500">
                      {item.count} ·{" "}
                      <span className="text-zinc-400">
                        {formatCurrency(item.revenueCents)}
                      </span>
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-zinc-900">
                    {pct.toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
