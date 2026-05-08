import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

type GenericClient = SupabaseClient;

export type MozoMember = {
  user_id: string;
  full_name: string | null;
  role: "admin" | "encargado" | "mozo";
};

/**
 * Miembros activos del business con rol que opera salón.
 * Ordenados por rol (mozo primero, después encargado/admin) y nombre.
 *
 * El nombre se prefiere desde business_users.full_name (membership-scoped).
 * Si está vacío, cae a users.email para no dejar el dropdown vacío.
 */
export async function getMozosByBusiness(
  businessId: string,
): Promise<MozoMember[]> {
  const service = createSupabaseServiceClient() as unknown as GenericClient;
  const { data, error } = await service
    .from("business_users")
    .select("user_id, full_name, role, users!inner(email)")
    .eq("business_id", businessId)
    .is("disabled_at", null)
    .in("role", ["admin", "encargado", "mozo"]);

  if (error) {
    console.error("getMozosByBusiness", error);
    return [];
  }

  const rows = (data ?? []) as unknown as Array<{
    user_id: string;
    full_name: string | null;
    role: "admin" | "encargado" | "mozo";
    users: { email: string | null } | { email: string | null }[] | null;
  }>;

  return rows
    .map((r) => {
      const userObj = Array.isArray(r.users) ? r.users[0] : r.users;
      return {
        user_id: r.user_id,
        full_name: r.full_name?.trim() || userObj?.email || null,
        role: r.role,
      };
    })
    .sort((a, b) => {
      const rolePriority = { mozo: 0, encargado: 1, admin: 2 } as const;
      const roleDiff = rolePriority[a.role] - rolePriority[b.role];
      if (roleDiff !== 0) return roleDiff;
      return (a.full_name ?? "").localeCompare(b.full_name ?? "");
    });
}

export type ActiveTable = {
  id: string;
  label: string;
  operational_status: string;
};

/**
 * Mesas activas (no libres) asignadas a un mozo. Útil para la query "mis
 * mesas" del mozo y para dashboards futuros.
 */
export async function getMyTables(
  mozoId: string,
  businessId: string,
): Promise<ActiveTable[]> {
  const service = createSupabaseServiceClient() as unknown as GenericClient;
  const { data, error } = await service
    .from("tables")
    .select(
      "id, label, operational_status, floor_plans!inner(business_id)",
    )
    .eq("mozo_id", mozoId)
    .eq("floor_plans.business_id", businessId)
    .neq("operational_status", "libre");

  if (error) {
    console.error("getMyTables", error);
    return [];
  }
  return (data ?? []).map((t) => ({
    id: (t as { id: string }).id,
    label: (t as { label: string }).label,
    operational_status: (t as { operational_status: string })
      .operational_status,
  }));
}
