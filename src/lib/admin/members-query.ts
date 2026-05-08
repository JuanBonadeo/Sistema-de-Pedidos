import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type BusinessMember = {
  user_id: string;
  email: string;
  role: "admin" | "encargado" | "mozo";
  created_at: string;
  disabled_at: string | null;
  full_name: string | null;
  phone: string | null;
};

export async function listBusinessMembers(
  businessId: string,
  opts?: { includeDisabled?: boolean },
): Promise<BusinessMember[]> {
  const service = createSupabaseServiceClient();
  let query = service
    .from("business_users")
    .select(
      "user_id, role, created_at, disabled_at, full_name, phone, users:user_id(email)",
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (!opts?.includeDisabled) {
    query = query.is("disabled_at", null);
  }
  const { data } = await query;
  return (data ?? []).map((m) => ({
    user_id: m.user_id,
    email: m.users?.email ?? "—",
    role: m.role as BusinessMember["role"],
    created_at: m.created_at,
    disabled_at: (m as { disabled_at: string | null }).disabled_at,
    full_name: (m as { full_name: string | null }).full_name,
    phone: (m as { phone: string | null }).phone,
  }));
}
