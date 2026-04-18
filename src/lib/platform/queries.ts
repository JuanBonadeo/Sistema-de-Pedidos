import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type PlatformBusiness = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  logo_url: string | null;
  member_count: number;
  orders_30d: number;
  revenue_30d_cents: number;
};

export type PlatformOverview = {
  businesses: PlatformBusiness[];
  totals: {
    businesses: number;
    active_businesses: number;
    members: number;
    orders_30d: number;
    revenue_30d_cents: number;
  };
};

export async function ensurePlatformAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const service = createSupabaseServiceClient();
  const { data: profile } = await service
    .from("users")
    .select("is_platform_admin, email")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_platform_admin) return null;
  return { user, email: profile.email };
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const service = createSupabaseServiceClient();
  const sinceIso = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [{ data: businesses }, { data: recentOrders }] = await Promise.all([
    service
      .from("businesses")
      .select(
        "id, slug, name, timezone, is_active, created_at, logo_url, business_users(user_id)",
      )
      .order("created_at", { ascending: false }),
    service
      .from("orders")
      .select("business_id, total_cents, status")
      .gte("created_at", sinceIso),
  ]);

  const rows = businesses ?? [];
  const orders = recentOrders ?? [];

  const statsByBiz = new Map<
    string,
    { orders_30d: number; revenue_30d_cents: number }
  >();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const cur = statsByBiz.get(o.business_id) ?? {
      orders_30d: 0,
      revenue_30d_cents: 0,
    };
    cur.orders_30d += 1;
    cur.revenue_30d_cents += Number(o.total_cents);
    statsByBiz.set(o.business_id, cur);
  }

  const list: PlatformBusiness[] = rows.map((b) => {
    const stats = statsByBiz.get(b.id) ?? {
      orders_30d: 0,
      revenue_30d_cents: 0,
    };
    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      timezone: b.timezone,
      is_active: b.is_active,
      created_at: b.created_at,
      logo_url: b.logo_url,
      member_count: b.business_users?.length ?? 0,
      orders_30d: stats.orders_30d,
      revenue_30d_cents: stats.revenue_30d_cents,
    };
  });

  const totals = {
    businesses: list.length,
    active_businesses: list.filter((b) => b.is_active).length,
    members: list.reduce((a, b) => a + b.member_count, 0),
    orders_30d: list.reduce((a, b) => a + b.orders_30d, 0),
    revenue_30d_cents: list.reduce((a, b) => a + b.revenue_30d_cents, 0),
  };

  return { businesses: list, totals };
}

export type PlatformBusinessDetail = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  is_active: boolean;
  members: {
    user_id: string;
    email: string;
    role: string;
    created_at: string;
  }[];
};

export async function getBusinessDetail(
  id: string,
): Promise<PlatformBusinessDetail | null> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("businesses")
    .select(
      "id, slug, name, timezone, is_active, business_users(user_id, role, created_at, users:user_id(email))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    timezone: data.timezone,
    is_active: data.is_active,
    members: (data.business_users ?? []).map((m) => ({
      user_id: m.user_id,
      email: m.users?.email ?? "—",
      role: m.role,
      created_at: m.created_at,
    })),
  };
}
