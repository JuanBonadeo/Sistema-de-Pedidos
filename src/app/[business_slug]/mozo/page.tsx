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

    // Órdenes dine_in **abiertas** (la "open" actual de cada mesa). Una por
    // mesa garantizada por el partial unique `orders_one_open_per_table`.
    // Si una mesa ya cobró y arrancó una nueva, solo nos importa la nueva.
    // Traemos customer_name + items para alimentar card y drawer.
    service
      .from("orders")
      .select(
        "id, order_number, table_id, delivery_type, total_cents, created_at, status, customer_name, order_items(product_name, quantity, cancelled_at)",
      )
      .eq("business_id", business.id)
      .eq("delivery_type", "dine_in")
      .eq("lifecycle_status", "open"),

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
      activeOrders={(activeOrders ?? []).map((o) => ({
        id: o.id as string,
        order_number: o.order_number as number,
        table_id: o.table_id as string | null,
        delivery_type: o.delivery_type as string,
        total_cents: Number(o.total_cents),
        created_at: o.created_at as string,
        status: o.status as string,
        customer_name: (o as { customer_name: string | null }).customer_name,
        items: ((o as { order_items?: Array<{ product_name: string; quantity: number; cancelled_at: string | null }> }).order_items ?? []),
      }))}
      mozos={mozos}
      currentUserId={ctx.user.id}
      role={ctx.role}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
