import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type DailyMenuComponent = {
  id: string;
  label: string;
  description: string | null;
};

export type DailyMenuForMozo = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  components: DailyMenuComponent[];
};

/**
 * Menús del día disponibles HOY para mostrar al mozo en la pantalla de
 * toma de pedido. `todayDow` es 0..6 (0 = domingo) y debe calcularse en el
 * page para no caer en hydration mismatch ni mezclar TZs.
 *
 * En MVP esta vista es **solo informativa** — el mozo lee al cliente y, si
 * el cliente pide el menú del día, carga los productos individualmente. No
 * mandamos el menú entero como item porque `daily_menu_components` son
 * labels, no productos reales (no tienen station_id ni precio individual).
 * Cuando aparezca un caso real de "el mozo quiere mandarlo en un toque",
 * se mapea cada componente a un producto real (deuda eventual).
 */
export async function getDailyMenusForToday(
  businessId: string,
  todayDow: number,
): Promise<DailyMenuForMozo[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("daily_menus")
    .select(
      "id, name, description, price_cents, image_url, sort_order, daily_menu_components(id, label, description, sort_order)",
    )
    .eq("business_id", businessId)
    .eq("is_active", true)
    .eq("is_available", true)
    .contains("available_days", [todayDow])
    .order("sort_order");

  if (error) {
    console.error("getDailyMenusForToday", error);
    return [];
  }

  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    price_cents: Number(m.price_cents),
    image_url: m.image_url,
    components: (m.daily_menu_components ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
      })),
  }));
}
