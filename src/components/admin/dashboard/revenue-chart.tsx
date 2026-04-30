"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/currency";

type Day = { date: string; revenueCents: number; orders: number };

type Range = "7d" | "30d";

const SHORT_MONTH_DAY = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
});

const FULL_DATE = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function compactCurrency(cents: number): string {
  const value = cents / 100;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
}

type Datum = {
  date: string;
  isoDate: string;
  short: string;
  revenueCents: number;
  orders: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Datum }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const dateLabel = FULL_DATE.format(new Date(`${d.isoDate}T12:00:00Z`));
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        {dateLabel}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums text-zinc-900">
        {formatCurrency(d.revenueCents)}
      </p>
      <p className="text-xs text-zinc-500 tabular-nums">
        {d.orders} {d.orders === 1 ? "pedido" : "pedidos"}
      </p>
    </div>
  );
}

export function RevenueChart({ data }: { data: Day[] }) {
  const [range, setRange] = useState<Range>("30d");

  const chartData = useMemo<Datum[]>(() => {
    const slice = range === "7d" ? data.slice(-7) : data;
    return slice.map((d) => ({
      date: d.date,
      isoDate: d.date,
      short: SHORT_MONTH_DAY.format(new Date(`${d.date}T12:00:00Z`)),
      revenueCents: d.revenueCents,
      orders: d.orders,
    }));
  }, [data, range]);

  const totalRevenue = chartData.reduce((s, d) => s + d.revenueCents, 0);
  const totalOrders = chartData.reduce((s, d) => s + d.orders, 0);
  const max = Math.max(1, ...chartData.map((d) => d.revenueCents));

  const tickEvery = range === "30d" ? Math.max(1, Math.ceil(chartData.length / 8)) : 1;

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Tendencia de ingresos
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            {formatCurrency(totalRevenue)}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">
            {totalOrders} {totalOrders === 1 ? "pedido" : "pedidos"} · últimos{" "}
            {range === "7d" ? "7 días" : "30 días"}
          </p>
        </div>
        <div className="inline-flex rounded-full bg-zinc-100 p-1 text-xs font-semibold">
          {(["7d", "30d"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                "rounded-full px-3 py-1 transition " +
                (r === range
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800")
              }
            >
              {r === "7d" ? "7 días" : "30 días"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#18181b" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#f4f4f5"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="short"
              interval={tickEvery - 1}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              domain={[0, max * 1.15]}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => compactCurrency(v)}
              width={60}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#d4d4d8", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="revenueCents"
              stroke="#18181b"
              strokeWidth={2}
              fill="url(#revenueFill)"
              activeDot={{
                r: 5,
                fill: "#18181b",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
