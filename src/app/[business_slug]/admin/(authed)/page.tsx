import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  CircleDollarSign,
  Flame,
  Receipt,
  Timer,
} from "lucide-react";

import { DailyMenuPreview } from "@/components/admin/dashboard/daily-menu-preview";
import { DashboardHeader } from "@/components/admin/dashboard/dashboard-header";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import { RevenueSparkline } from "@/components/admin/dashboard/revenue-sparkline";
import { StatTile } from "@/components/admin/dashboard/stat-tile";
import { TopProductsList } from "@/components/admin/dashboard/top-products-list";
import { PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess } from "@/lib/admin/context";
import { getAdminDailyMenus } from "@/lib/admin/daily-menu-query";
import { getDashboardOverview } from "@/lib/admin/dashboard-query";
import { getTodayOrders } from "@/lib/admin/orders-query";
import { currentDayOfWeek } from "@/lib/day-of-week";
import { formatCurrency } from "@/lib/currency";
import { getBusiness } from "@/lib/tenant";

function trend(
  today: number,
  yesterday: number,
): { direction: "up" | "down" | "flat"; label: string } {
  if (yesterday === 0 && today === 0) {
    return { direction: "flat", label: "sin datos ayer" };
  }
  if (yesterday === 0) {
    return { direction: "up", label: "primer día" };
  }
  const diff = today - yesterday;
  const pct = Math.round((diff / yesterday) * 100);
  const direction: "up" | "down" | "flat" =
    diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const sign = diff > 0 ? "+" : "";
  return { direction, label: `${sign}${pct}% vs ayer` };
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureAdminAccess(business.id, business_slug);

  const [overview, menus, orders] = await Promise.all([
    getDashboardOverview(business.id, business.timezone),
    getAdminDailyMenus(business.id),
    getTodayOrders(business.id, business.timezone),
  ]);

  const todayDow = currentDayOfWeek(business.timezone);

  return (
    <PageShell width="wide" className="space-y-10">
      <DashboardHeader
        businessName={business.name}
        userName={ctx.userName}
        timezone={business.timezone}
        slug={business_slug}
        isActive={business.is_active ?? true}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          eyebrow="Pedidos hoy"
          value={overview.today.orderCount.toString()}
          sub="sin cancelados"
          icon={<Receipt className="size-4" strokeWidth={1.75} />}
          trend={trend(overview.today.orderCount, overview.yesterday.orderCount)}
          accent="brand"
        />
        <StatTile
          eyebrow="Ingresos hoy"
          value={formatCurrency(overview.today.revenueCents)}
          sub={`ticket prom. ${formatCurrency(overview.today.averageTicketCents)}`}
          icon={<CircleDollarSign className="size-4" strokeWidth={1.75} />}
          trend={trend(
            overview.today.revenueCents,
            overview.yesterday.revenueCents,
          )}
        />
        <StatTile
          eyebrow="En curso"
          value={overview.today.activeOrderCount.toString()}
          sub={
            overview.today.activeOrderCount === 0
              ? "cocina tranquila"
              : "pedidos abiertos"
          }
          icon={<Flame className="size-4" strokeWidth={1.75} />}
        />
        <StatTile
          eyebrow="Cancelados hoy"
          value={overview.today.cancelledCount.toString()}
          sub="pedidos no facturados"
          icon={<Timer className="size-4" strokeWidth={1.75} />}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RevenueSparkline data={overview.week.dailyRevenue} />
        </div>
        <div className="lg:col-span-2">
          <DailyMenuPreview
            slug={business_slug}
            menus={menus}
            todayDow={todayDow}
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentOrders orders={orders} slug={business_slug} />
        </div>
        <div className="space-y-5 lg:col-span-2">
          <TopProductsList products={overview.topProducts} />
          <Link
            href={`/${business_slug}/admin/reportes`}
            className="group flex items-center justify-between rounded-2xl bg-zinc-900 p-5 text-zinc-50 transition hover:bg-zinc-800"
          >
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Reportes
              </p>
              <p className="mt-1 text-base font-semibold">
                Analítica completa
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Rango custom · top productos · ingresos diarios
              </p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-white/10 transition group-hover:bg-white/20">
              <ArrowUpRight className="size-4" />
            </span>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
