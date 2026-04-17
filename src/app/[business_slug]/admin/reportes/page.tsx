import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { RangeSelector } from "@/components/admin/reports/range-selector";
import { RevenueChart } from "@/components/admin/reports/revenue-chart";
import { SummaryCards } from "@/components/admin/reports/summary-cards";
import { TopProducts } from "@/components/admin/reports/top-products";
import {
  getReportData,
  REPORT_RANGES,
  type ReportRange,
} from "@/lib/admin/reports-query";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${business_slug}/admin/login`);

  const range: ReportRange = (REPORT_RANGES as readonly string[]).includes(
    rawRange ?? "",
  )
    ? (rawRange as ReportRange)
    : "7d";

  const data = await getReportData(business.id, business.timezone, range);

  return (
    <div className="bg-background min-h-screen">
      <AdminNav
        slug={business_slug}
        businessName={business.name}
        userEmail={user.email ?? ""}
        userName={
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined)
        }
      />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">Reportes</h1>
          <RangeSelector slug={business_slug} active={range} />
        </div>

        <SummaryCards summary={data.summary} />

        {data.summary.orderCount === 0 &&
        data.summary.cancelledCount === 0 ? (
          <p className="text-muted-foreground bg-card rounded-xl p-8 text-center italic">
            No hay pedidos en el período seleccionado.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <RevenueChart data={data.revenueByDay} />
            <TopProducts products={data.topProducts} />
          </div>
        )}
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
