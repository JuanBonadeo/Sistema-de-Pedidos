import { notFound } from "next/navigation";

import { CategoryBreakdownSection } from "@/components/admin/reports/category-breakdown";
import { CustomersAnalysis } from "@/components/admin/reports/customers-analysis";
import { PrepTimes } from "@/components/admin/reports/prep-times";
import { RangeSelector } from "@/components/admin/reports/range-selector";
import { ReservationFunnelSection } from "@/components/admin/reports/reservation-funnel";
import { RevenueChart } from "@/components/admin/reports/revenue-chart";
import { SummaryCards } from "@/components/admin/reports/summary-cards";
import { TopProducts } from "@/components/admin/reports/top-products";
import { PageHeader, PageShell } from "@/components/admin/shell/page-shell";
import {
  getReportData,
  REPORT_RANGES,
  type ReportRange,
} from "@/lib/admin/reports-query";
import { getBusiness } from "@/lib/tenant";

export default async function ReportesPage({
  params,
  searchParams,
}: {
  params: Promise<{ business_slug: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { business_slug } = await params;
  const { range: rawRange } = await searchParams;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const range: ReportRange = (REPORT_RANGES as readonly string[]).includes(
    rawRange ?? "",
  )
    ? (rawRange as ReportRange)
    : "7d";

  const data = await getReportData(business.id, business.timezone, range);
  const isEmpty =
    data.summary.orderCount === 0 && data.summary.cancelledCount === 0;

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        eyebrow="Analítica"
        title="Reportes"
        description="Cómo viene el negocio: ingresos, clientes, catálogo y reservas con comparación contra el período anterior."
        action={<RangeSelector slug={business_slug} active={range} />}
      />

      <SummaryCards summary={data.summary} comparison={data.comparison} />

      {isEmpty ? (
        <p className="rounded-2xl bg-white p-10 text-center text-sm italic text-zinc-500 ring-1 ring-zinc-200/70">
          No hay pedidos en el período seleccionado.
        </p>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
            <RevenueChart data={data.revenueByDay} />
            <TopProducts products={data.topProducts} />
          </div>

          <CustomersAnalysis data={data.customers} />

          <div className="grid gap-5 lg:grid-cols-2">
            {data.categories.length > 0 ? (
              <CategoryBreakdownSection data={data.categories} />
            ) : null}
            <PrepTimes data={data.prepTimes} />
          </div>

          {data.reservationFunnel ? (
            <ReservationFunnelSection data={data.reservationFunnel} />
          ) : null}
        </>
      )}
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
