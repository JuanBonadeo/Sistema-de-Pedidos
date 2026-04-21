import { Building2, ShoppingBag, TrendingUp, Users } from "lucide-react";

import { formatCurrency } from "@/lib/currency";
import type { PlatformOverview } from "@/lib/platform/queries";

export function PlatformStats({
  totals,
}: {
  totals: PlatformOverview["totals"];
}) {
  const cards = [
    {
      label: "Negocios",
      value: totals.businesses.toString(),
      hint: `${totals.active_businesses} activos`,
      icon: <Building2 className="size-4" strokeWidth={1.75} />,
      accent: true,
    },
    {
      label: "Miembros",
      value: totals.members.toString(),
      hint: "con acceso",
      icon: <Users className="size-4" strokeWidth={1.75} />,
    },
    {
      label: "Pedidos · 30d",
      value: totals.orders_30d.toString(),
      hint: "sin cancelados",
      icon: <ShoppingBag className="size-4" strokeWidth={1.75} />,
    },
    {
      label: "Ingresos · 30d",
      value: formatCurrency(totals.revenue_30d_cents),
      hint: "todos los negocios",
      icon: <TrendingUp className="size-4" strokeWidth={1.75} />,
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={
            c.accent
              ? "group relative flex flex-col justify-between gap-6 rounded-2xl bg-zinc-900 p-5 text-zinc-50 ring-1 ring-zinc-900"
              : "group relative flex flex-col justify-between gap-6 rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70 transition hover:ring-zinc-300"
          }
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={
                "text-[0.65rem] font-semibold uppercase tracking-[0.14em] " +
                (c.accent ? "text-zinc-400" : "text-zinc-500")
              }
            >
              {c.label}
            </span>
            <span
              className={
                "flex size-8 shrink-0 items-center justify-center rounded-xl transition " +
                (c.accent
                  ? "bg-white/10 text-white"
                  : "bg-zinc-100 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white")
              }
            >
              {c.icon}
            </span>
          </div>
          <div>
            <div className="text-3xl font-semibold tracking-tight tabular-nums">
              {c.value}
            </div>
            <div
              className={
                "mt-1.5 text-xs " +
                (c.accent ? "text-zinc-400" : "text-zinc-500")
              }
            >
              {c.hint}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
