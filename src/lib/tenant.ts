import "server-only";

import { cache } from "react";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/database.types";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];

export type BusinessSettings = {
  primary_color?: string;
  primary_foreground?: string;
  logo_url?: string;
};

export const getBusiness = cache(async (slug: string): Promise<Business | null> => {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
});

export function getBusinessSettings(business: Business): BusinessSettings {
  return (business.settings ?? {}) as BusinessSettings;
}
