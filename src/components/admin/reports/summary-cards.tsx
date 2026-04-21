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
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "flex flex-col justify-between gap-5 rounded-2xl p-5 ring-1 shadow-[0_18px_36px_-22px_var(--brand)]"
          : "flex flex-col justify-between gap-5 rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70 transition hover:ring-zinc-300"
      }
      style={
        accent
          ? {
              background: "var(--brand)",
              color: "var(--brand-foreground)",
              boxShadow: "0 18px 36px -22px var(--brand)",
            }
          : undefined
      }
    >
      <p
        className={
          accent
            ? "text-[0.65rem] font-semibold uppercase tracking-[0.14em] opacity-80"
            : "text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500"
        }
      >
        {label}
      </p>
      <div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint ? (
          <p
            className={
              accent ? "mt-1 text-xs opacity-80" : "mt-1 text-xs text-zinc-500"
            }
          >
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: ReportSummary }) {
  const totalActive = summary.orderCount;
  const totalAll = totalActive + summary.cancelledCount;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="Ingresos"
        value={formatCurrency(summary.revenueCents)}
        hint="Sin pedidos cancelados"
        accent
      />
      <Card
        label="Pedidos"
        value={summary.orderCount.toString()}
        hint={`Ticket prom. ${formatCurrency(summary.averageTicketCents)}`}
      />
      <Card
        label="Delivery · Retiro"
        value={`${summary.deliveryCount} · ${summary.pickupCount}`}
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
