"use client";

import { useMemo } from "react";
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
import type { DayBucket } from "@/lib/admin/reports-query";

const SHORT_MD = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
});
const FULL_DATE = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function compactCurrency(cents: number): string {
  const v = cents / 100;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${Math.round(v)}`;
}

type Datum = {
  isoDate: string;
  short: string;
  revenueCents: number;
  orderCount: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Datum }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload;
  const date = FULL_DATE.format(new Date(`${d.isoDate}T12:00:00Z`));
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        {date}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums text-zinc-900">
        {formatCurrency(d.revenueCents)}
      </p>
      <p className="text-xs text-zinc-500 tabular-nums">
        {d.orderCount} {d.orderCount === 1 ? "pedido" : "pedidos"}
      </p>
    </div>
  );
}

export function RevenueChart({ data }: { data: DayBucket[] }) {
  const chartData = useMemo<Datum[]>(
    () =>
      data.map((d) => ({
        isoDate: d.date,
        short: SHORT_MD.format(new Date(`${d.date}T12:00:00Z`)),
        revenueCents: d.revenueCents,
        orderCount: d.orderCount,
      })),
    [data],
  );

  const totalRevenue = chartData.reduce((s, d) => s + d.revenueCents, 0);
  const totalOrders = chartData.reduce((s, d) => s + d.orderCount, 0);
  const max = Math.max(1, ...chartData.map((d) => d.revenueCents));
  const tickEvery = Math.max(1, Math.ceil(chartData.length / 8));

  const best = chartData.reduce<Datum | null>(
    (acc, d) => (acc === null || d.revenueCents > acc.revenueCents ? d : acc),
    null,
  );

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Ingresos por día
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900">
            {formatCurrency(totalRevenue)}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">
            {totalOrders} {totalOrders === 1 ? "pedido" : "pedidos"} · {chartData.length}{" "}
            {chartData.length === 1 ? "día" : "días"}
          </p>
        </div>
        {best && best.revenueCents > 0 ? (
          <div className="text-right">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Mejor día
            </p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-zinc-900">
              {SHORT_MD.format(new Date(`${best.isoDate}T12:00:00Z`))}
            </p>
            <p className="text-xs tabular-nums text-emerald-600">
              {formatCurrency(best.revenueCents)}
            </p>
          </div>
        ) : null}
      </header>

      <div className="mt-6 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="reportRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#18181b" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f4f4f5" />
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
              width={64}
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
              fill="url(#reportRevenueFill)"
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
    </section>
  );
}
