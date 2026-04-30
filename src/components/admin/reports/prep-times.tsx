"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PrepTimeStats } from "@/lib/admin/reports-query";

const SHORT_MD = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
});

export function PrepTimes({ data }: { data: PrepTimeStats }) {
  const chartData = useMemo(
    () =>
      data.daily.map((d) => ({
        ...d,
        short: SHORT_MD.format(new Date(`${d.date}T12:00:00Z`)),
      })),
    [data.daily],
  );
  const maxBucket = Math.max(1, ...data.buckets.map((b) => b.count));

  if (data.sampleSize === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
        <header>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Cocina
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Tiempo de preparación
          </h2>
        </header>
        <p className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center text-sm italic text-zinc-500">
          Sin datos de transición confirmed → ready en este período.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Cocina
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Tiempo de preparación
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {data.sampleSize} pedidos analizados · confirmed → ready
          </p>
        </div>
        <div className="flex items-center gap-5 text-right">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Promedio
            </p>
            <p className="text-2xl font-semibold tabular-nums text-zinc-900">
              {data.averageMinutes.toFixed(1)}
              <span className="ml-1 text-sm font-medium text-zinc-500">min</span>
            </p>
          </div>
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Mediana
            </p>
            <p className="text-2xl font-semibold tabular-nums text-zinc-900">
              {data.medianMinutes.toFixed(1)}
              <span className="ml-1 text-sm font-medium text-zinc-500">min</span>
            </p>
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {data.buckets.map((b) => {
          const widthPct = (b.count / maxBucket) * 100;
          const pct = data.sampleSize > 0 ? (b.count / data.sampleSize) * 100 : 0;
          return (
            <div key={b.label} className="rounded-xl bg-zinc-50 p-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {b.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                {b.count}
                <span className="ml-1 text-xs font-medium text-zinc-500">
                  · {pct.toFixed(0)}%
                </span>
              </p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-200/70">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {chartData.length > 1 ? (
        <div className="mt-6 h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#f4f4f5" />
              <XAxis
                dataKey="short"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${Math.round(v)}m`}
              />
              <Tooltip
                formatter={(v) => [`${Number(v).toFixed(1)} min`, "Promedio"]}
                cursor={{ stroke: "#d4d4d8" }}
              />
              <Line
                type="monotone"
                dataKey="averageMinutes"
                stroke="#18181b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#18181b" }}
                activeDot={{ r: 5, fill: "#18181b", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </section>
  );
}
