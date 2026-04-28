import "server-only";

import { cache } from "react";

import type {
  Density,
  FontKey,
  IconStroke,
  IconStyle,
  Mode,
  RadiusScale,
  ShadowScale,
} from "@/lib/branding/tokens";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/database.types";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];

export type BusinessSettings = {
  // Colors
  primary_color?: string;
  primary_foreground?: string;
  secondary_color?: string;
  secondary_foreground?: string;
  accent_color?: string;
  accent_foreground?: string;
  background_color?: string;
  background_color_dark?: string;
  surface_color?: string;
  muted_color?: string;
  border_color?: string;
  success_color?: string;
  warning_color?: string;
  destructive_color?: string;
  // Typography
  font_heading?: FontKey;
  font_body?: FontKey;
  // Shape
  radius_scale?: RadiusScale;
  shadow_scale?: ShadowScale;
  density?: Density;
  // Iconography
  icon_stroke_width?: IconStroke;
  icon_style?: IconStyle;
  // Mode
  default_mode?: Mode;
  // Logo variants
  logo_url?: string;
  logo_mark_url?: string;
  logo_mono_url?: string;
  favicon_url?: string;
};

export const getBusiness = cache(async (slug: string): Promise<Business | null> => {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export function getBusinessSettings(business: Business): BusinessSettings {
  return (business.settings ?? {}) as BusinessSettings;
}
