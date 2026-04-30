import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getBusiness } from "@/lib/tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { CocinaClient, type OrderForCocina } from "./cocina-client";

export const dynamic = "force-dynamic";

export default async function CocinaPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const service = createSupabaseServiceClient() as unknown as SupabaseClient;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Fetch today's orders with their items and table info
  const { data: orders } = await service
    .from("orders")
    .select(
      `id, order_number, delivery_type, created_at, customer_name, total_cents,
       table:tables(label),
       items:order_items(id, product_name, quantity, notes, kitchen_status)`,
    )
    .eq("business_id", business.id)
    .neq("status", "cancelled")
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: true });

  return (
    <CocinaClient
      businessSlug={business_slug}
      businessName={business.name}
      orders={(orders ?? []) as OrderForCocina[]}
    />
  );
}
