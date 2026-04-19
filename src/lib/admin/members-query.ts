import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type BusinessMember = {
  user_id: string;
  email: string;
  role: "admin" | "staff";
  created_at: string;
};

export async function listBusinessMembers(
  businessId: string,
): Promise<BusinessMember[]> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("business_users")
    .select("user_id, role, created_at, users:user_id(email)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((m) => ({
    user_id: m.user_id,
    email: m.users?.email ?? "—",
    role: m.role as BusinessMember["role"],
    created_at: m.created_at,
  }));
}
