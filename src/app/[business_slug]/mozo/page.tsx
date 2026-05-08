import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getFloorPlansForBusiness } from "@/lib/admin/floor-plan/queries";
import { ensureMozoAccess } from "@/lib/mozo/auth";
import { getMozosByBusiness } from "@/lib/mozo/queries";
import { listForUser, countUnread } from "@/lib/notifications/queries";
import { getBusiness } from "@/lib/tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { MozoClient } from "./mozo-client";
import type { ReservationForMozo, OrderForMozo } from "./mozo-client";

export const dynamic = "force-dynamic";

export default async function MozoPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureMozoAccess(business.id, business_slug);

  const service = createSupabaseServiceClient() as unknown as SupabaseClient;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [
    floorPlans,
    { data: reservations },
    { data: activeOrders },
    mozos,
    notifications,
    unreadCount,
  ] = await Promise.all([
    getFloorPlansForBusiness(business.id),

    // Reservas confirmadas de hoy
    service
      .from("reservations")
      .select("id, table_id, customer_name, customer_phone, party_size, starts_at, status, notes")
      .eq("business_id", business.id)
      .in("status", ["confirmed", "seated"])
      .gte("starts_at", todayStart.toISOString())
      .lt("starts_at", tomorrowStart.toISOString())
      .order("starts_at", { ascending: true }),

    // Órdenes dine_in activas de hoy
    service
      .from("orders")
      .select("id, order_number, table_id, delivery_type, total_cents, created_at, status")
      .eq("business_id", business.id)
      .eq("delivery_type", "dine_in")
      .neq("status", "cancelled")
      .gte("created_at", todayStart.toISOString()),

    getMozosByBusiness(business.id),

    listForUser({ userId: ctx.user.id, businessId: business.id, role: ctx.role, limit: 10 }),

    countUnread({ userId: ctx.user.id, businessId: business.id, role: ctx.role }),
  ]);

  return (
    <MozoClient
      businessSlug={business_slug}
      businessName={business.name}
      businessId={business.id}
      floorPlans={floorPlans}
      reservations={(reservations ?? []) as ReservationForMozo[]}
      activeOrders={(activeOrders ?? []) as OrderForMozo[]}
      mozos={mozos}
      currentUserId={ctx.user.id}
      role={ctx.role}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
