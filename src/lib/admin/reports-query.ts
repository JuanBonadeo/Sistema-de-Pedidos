import "server-only";

import { formatInTimeZone, toZonedTime } from "date-fns-tz";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const REPORT_RANGES = ["today", "yesterday", "7d", "30d"] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export type ReportSummary = {
  range: ReportRange;
  startIso: string;
  endIso: string;
  orderCount: number;
  revenueCents: number;
  averageTicketCents: number;
  deliveryCount: number;
  pickupCount: number;
  cancelledCount: number;
};

export type DayBucket = {
  date: string; // yyyy-MM-dd in business tz
  orderCount: number;
  revenueCents: number;
};

export type TopProduct = {
  product_name: string;
  quantity: number;
  revenueCents: number;
};

export type ReportData = {
  summary: ReportSummary;
  revenueByDay: DayBucket[];
  topProducts: TopProduct[];
};

function startOfDayInTz(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  zoned.setHours(0, 0, 0, 0);
  const offsetMs = toZonedTime(date, timezone).getTime() - date.getTime();
  return new Date(zoned.getTime() - offsetMs);
}

function computeRange(
  range: ReportRange,
  timezone: string,
  now: Date = new Date(),
): { start: Date; end: Date; days: number } {
  const todayStart = startOfDayInTz(now, timezone);
  const oneDayMs = 24 * 60 * 60 * 1000;
  switch (range) {
    case "today":
      return { start: todayStart, end: now, days: 1 };
    case "yesterday": {
      const start = new Date(todayStart.getTime() - oneDayMs);
      return { start, end: todayStart, days: 1 };
    }
    case "7d":
      return {
        start: new Date(todayStart.getTime() - 6 * oneDayMs),
        end: now,
        days: 7,
      };
    case "30d":
      return {
        start: new Date(todayStart.getTime() - 29 * oneDayMs),
        end: now,
        days: 30,
      };
  }
}

export async function getReportData(
  businessId: string,
  timezone: string,
  range: ReportRange,
): Promise<ReportData> {
  const { start, end, days } = computeRange(range, timezone);
  const supabase = await createSupabaseServerClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, created_at, total_cents, status, delivery_type, order_items(product_name, quantity, subtotal_cents)",
    )
    .eq("business_id", businessId)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  const rows = orders ?? [];

  let orderCount = 0;
  let revenueCents = 0;
  let deliveryCount = 0;
  let pickupCount = 0;
  let cancelledCount = 0;
  const dayMap = new Map<string, DayBucket>();
  const productMap = new Map<string, TopProduct>();

  // Pre-fill day buckets so empty days show on the chart.
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = formatInTimeZone(d, timezone, "yyyy-MM-dd");
    dayMap.set(key, { date: key, orderCount: 0, revenueCents: 0 });
  }

  for (const o of rows) {
    if (o.status === "cancelled") {
      cancelledCount++;
      continue;
    }
    orderCount++;
    const cents = Number(o.total_cents);
    revenueCents += cents;
    if (o.delivery_type === "delivery") deliveryCount++;
    else pickupCount++;

    const key = formatInTimeZone(o.created_at, timezone, "yyyy-MM-dd");
    const bucket = dayMap.get(key);
    if (bucket) {
      bucket.orderCount++;
      bucket.revenueCents += cents;
    }

    for (const item of o.order_items ?? []) {
      const existing = productMap.get(item.product_name) ?? {
        product_name: item.product_name,
        quantity: 0,
        revenueCents: 0,
      };
      existing.quantity += item.quantity;
      existing.revenueCents += Number(item.subtotal_cents);
      productMap.set(item.product_name, existing);
    }
  }

  const summary: ReportSummary = {
    range,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    orderCount,
    revenueCents,
    averageTicketCents:
      orderCount > 0 ? Math.round(revenueCents / orderCount) : 0,
    deliveryCount,
    pickupCount,
    cancelledCount,
  };

  const revenueByDay = [...dayMap.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return { summary, revenueByDay, topProducts };
}
