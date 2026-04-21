import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminDailyMenuComponent = {
  id: string;
  label: string;
  description: string | null;
  sort_order: number;
};

export type AdminDailyMenu = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  available_days: number[];
  is_active: boolean;
  is_available: boolean;
  sort_order: number;
  components: AdminDailyMenuComponent[];
};

const SELECT =
  "id, name, slug, description, price_cents, image_url, available_days, is_active, is_available, sort_order, daily_menu_components(id, label, description, sort_order)";

function mapRow(
  row: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price_cents: number;
    image_url: string | null;
    available_days: number[] | null;
    is_active: boolean;
    is_available: boolean;
    sort_order: number;
    daily_menu_components:
      | {
          id: string;
          label: string;
          description: string | null;
          sort_order: number;
        }[]
      | null;
  },
): AdminDailyMenu {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price_cents: Number(row.price_cents),
    image_url: row.image_url,
    available_days: (row.available_days ?? []).slice().sort((a, b) => a - b),
    is_active: row.is_active,
    is_available: row.is_available,
    sort_order: row.sort_order,
    components: (row.daily_menu_components ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
        sort_order: c.sort_order,
      })),
  };
}

export async function getAdminDailyMenus(
  businessId: string,
): Promise<AdminDailyMenu[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("daily_menus")
    .select(SELECT)
    .eq("business_id", businessId)
    .order("sort_order");
  return (data ?? []).map(mapRow);
}

export async function getAdminDailyMenu(
  id: string,
): Promise<AdminDailyMenu | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("daily_menus")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? mapRow(data) : null;
}
