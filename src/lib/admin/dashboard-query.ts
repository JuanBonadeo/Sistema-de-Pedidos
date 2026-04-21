import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardOverview = {
  today: {
    orderCount: number;
    revenueCents: number;
    activeOrderCount: number;
    cancelledCount: number;
    averageTicketCents: number;
  };
  yesterday: {
    orderCount: number;
    revenueCents: number;
  };
  week: {
    orderCount: number;
    revenueCents: number;
    dailyRevenue: { date: string; revenueCents: number; orders: number }[];
  };
  topProducts: { name: string; quantity: number }[];
};

function startOfDayUtc(tz: string, daysAgo = 0): Date {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - daysAgo);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const pick = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const isoLocal = `${pick("year")}-${pick("month")}-${pick("day")}T00:00:00`;
  const nowInTz = new Date(
    `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}:${pick("second")}Z`,
  );
  const offsetMs = nowInTz.getTime() - now.getTime();
  const localMidnight = new Date(`${isoLocal}Z`);
  return new Date(localMidnight.getTime() - offsetMs);
}

function dayKey(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export async function getDashboardOverview(
  businessId: string,
  timezone: string,
): Promise<DashboardOverview> {
  const supabase = await createSupabaseServerClient();

  const startToday = startOfDayUtc(timezone, 0);
  const startYesterday = startOfDayUtc(timezone, 1);
  const start7d = startOfDayUtc(timezone, 6);

  const { data: weekRows } = await supabase
    .from("orders")
    .select("created_at, total_cents, status")
    .eq("business_id", businessId)
    .gte("created_at", start7d.toISOString());

  const { data: todayItems } = await supabase
    .from("order_items")
    .select("product_name, quantity, orders!inner(business_id, created_at, status)")
    .eq("orders.business_id", businessId)
    .gte("orders.created_at", startToday.toISOString())
    .neq("orders.status", "cancelled");

  type Row = { created_at: string; total_cents: number; status: string };
  const rows: Row[] = (weekRows ?? []).map((r) => ({
    created_at: r.created_at,
    total_cents: Number(r.total_cents),
    status: r.status as string,
  }));

  const inRange = (r: Row, start: Date, end?: Date) => {
    const t = new Date(r.created_at).getTime();
    return t >= start.getTime() && (!end || t < end.getTime());
  };

  const todayRows = rows.filter((r) => inRange(r, startToday));
  const yesterdayRows = rows.filter((r) =>
    inRange(r, startYesterday, startToday),
  );

  const todayNotCancelled = todayRows.filter((r) => r.status !== "cancelled");
  const todayRevenue = todayNotCancelled.reduce(
    (s, r) => s + r.total_cents,
    0,
  );
  const todayCancelled = todayRows.filter((r) => r.status === "cancelled").length;
  const activeStatuses = new Set(["pending", "confirmed", "preparing", "ready", "on_the_way"]);
  const activeOrderCount = todayRows.filter((r) =>
    activeStatuses.has(r.status),
  ).length;

  const yesterdayNotCancelled = yesterdayRows.filter(
    (r) => r.status !== "cancelled",
  );
  const yesterdayRevenue = yesterdayNotCancelled.reduce(
    (s, r) => s + r.total_cents,
    0,
  );

  const weekNotCancelled = rows.filter((r) => r.status !== "cancelled");
  const weekRevenue = weekNotCancelled.reduce((s, r) => s + r.total_cents, 0);

  const dailyBuckets = new Map<string, { revenueCents: number; orders: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = startOfDayUtc(timezone, i);
    dailyBuckets.set(dayKey(d, timezone), { revenueCents: 0, orders: 0 });
  }
  for (const r of weekNotCancelled) {
    const k = dayKey(new Date(r.created_at), timezone);
    const bucket = dailyBuckets.get(k);
    if (bucket) {
      bucket.revenueCents += r.total_cents;
      bucket.orders += 1;
    }
  }

  const productCounts = new Map<string, number>();
  for (const it of todayItems ?? []) {
    const name = (it as { product_name: string }).product_name;
    const qty = Number((it as { quantity: number }).quantity) || 0;
    productCounts.set(name, (productCounts.get(name) ?? 0) + qty);
  }
  const topProducts = Array.from(productCounts.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    today: {
      orderCount: todayNotCancelled.length,
      revenueCents: todayRevenue,
      activeOrderCount,
      cancelledCount: todayCancelled,
      averageTicketCents:
        todayNotCancelled.length > 0
          ? Math.round(todayRevenue / todayNotCancelled.length)
          : 0,
    },
    yesterday: {
      orderCount: yesterdayNotCancelled.length,
      revenueCents: yesterdayRevenue,
    },
    week: {
      orderCount: weekNotCancelled.length,
      revenueCents: weekRevenue,
      dailyRevenue: Array.from(dailyBuckets.entries()).map(([date, v]) => ({
        date,
        revenueCents: v.revenueCents,
        orders: v.orders,
      })),
    },
    topProducts,
  };
}
