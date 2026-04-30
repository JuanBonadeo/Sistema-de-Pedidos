"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/currency";
import type { CustomerStats } from "@/lib/admin/reports-query";

const SHORT_MD = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
});

function formatPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return phone.replace(/^\+?\d{2,4}/, "··");
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload: { weekStart: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const date = SHORT_MD.format(new Date(`${p.weekStart}T12:00:00Z`));
  const newCount =
    payload.find((x) => x.dataKey === "newCount")?.value ?? 0;
  const returningCount =
    payload.find((x) => x.dataKey === "returningCount")?.value ?? 0;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        Semana del {date} {label ? null : null}
      </p>
      <p className="mt-1 text-xs text-zinc-700 tabular-nums">
        <span className="mr-2 inline-block size-2 rounded-sm bg-emerald-500" />
        {newCount} nuevos
      </p>
      <p className="text-xs text-zinc-700 tabular-nums">
        <span className="mr-2 inline-block size-2 rounded-sm bg-zinc-700" />
        {returningCount} recurrentes
      </p>
    </div>
  );
}

export function CustomersAnalysis({ data }: { data: CustomerStats }) {
  const { uniqueCount, newCount, returningCount, weekly, topCustomers } = data;
  const newPct = useMemo(
    () => (uniqueCount > 0 ? Math.round((newCount / uniqueCount) * 100) : 0),
    [uniqueCount, newCount],
  );

  const chartData = useMemo(
    () =>
      weekly.map((w) => ({
        ...w,
        short: SHORT_MD.format(new Date(`${w.weekStart}T12:00:00Z`)),
      })),
    [weekly],
  );

  return (
    <section className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Clientes
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Quiénes están comprando
          </h2>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Únicos
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900">
            {uniqueCount}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Nuevos
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-emerald-900">
            {newCount}
            <span className="ml-1 text-sm font-medium text-emerald-700">
              · {newPct}%
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-zinc-100 p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-700">
            Recurrentes
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900">
            {returningCount}
            <span className="ml-1 text-sm font-medium text-zinc-600">
              · {100 - newPct}%
            </span>
          </p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5" }} />
              <Legend
                iconType="square"
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              />
              <Bar
                dataKey="newCount"
                stackId="c"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="Nuevos"
              />
              <Bar
                dataKey="returningCount"
                stackId="c"
                fill="#27272a"
                radius={[4, 4, 0, 0]}
                name="Recurrentes"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {topCustomers.length > 0 ? (
        <div>
          <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Top clientes del período
          </p>
          <div className="overflow-hidden rounded-xl ring-1 ring-zinc-200/70">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-right">Pedidos</th>
                  <th className="px-4 py-2 text-right">Gasto</th>
                  <th className="hidden px-4 py-2 text-right sm:table-cell">
                    Último
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {topCustomers.map((c) => (
                  <tr key={c.customerId} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-zinc-900">{c.name}</p>
                      <p className="text-xs text-zinc-500 tabular-nums">
                        {formatPhone(c.phone)}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {c.orderCount}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
                      {formatCurrency(c.revenueCents)}
                    </td>
                    <td className="hidden px-4 py-2.5 text-right text-xs tabular-nums text-zinc-500 sm:table-cell">
                      {SHORT_MD.format(new Date(c.lastOrderAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
