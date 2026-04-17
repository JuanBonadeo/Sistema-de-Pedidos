import { formatCurrency } from "@/lib/currency";
import type { ReportSummary } from "@/lib/admin/reports-query";

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-card grid gap-1 rounded-xl p-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-extrabold">{value}</p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

export function SummaryCards({ summary }: { summary: ReportSummary }) {
  const totalActive = summary.orderCount;
  const totalAll = totalActive + summary.cancelledCount;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="Ingresos"
        value={formatCurrency(summary.revenueCents)}
        hint="Sin pedidos cancelados"
      />
      <Card
        label="Pedidos"
        value={summary.orderCount.toString()}
        hint={`Ticket promedio ${formatCurrency(summary.averageTicketCents)}`}
      />
      <Card
        label="Delivery / Retiro"
        value={`${summary.deliveryCount} / ${summary.pickupCount}`}
        hint={`${pct(summary.deliveryCount, totalActive)} delivery`}
      />
      <Card
        label="Cancelados"
        value={summary.cancelledCount.toString()}
        hint={`${pct(summary.cancelledCount, totalAll)} del total`}
      />
    </div>
  );
}
