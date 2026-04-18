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
      icon: <Building2 className="size-4" />,
    },
    {
      label: "Miembros",
      value: totals.members.toString(),
      hint: "con acceso",
      icon: <Users className="size-4" />,
    },
    {
      label: "Pedidos 30d",
      value: totals.orders_30d.toString(),
      hint: "sin cancelados",
      icon: <ShoppingBag className="size-4" />,
    },
    {
      label: "Ingresos 30d",
      value: formatCurrency(totals.revenue_30d_cents),
      hint: "todos los negocios",
      icon: <TrendingUp className="size-4" />,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-card grid gap-1 rounded-xl border p-4"
        >
          <div className="text-muted-foreground flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider">
            {c.icon}
            {c.label}
          </div>
          <div className="text-2xl font-extrabold">{c.value}</div>
          <div className="text-muted-foreground text-xs">{c.hint}</div>
        </div>
      ))}
    </div>
  );
}
