/**
 * Branding tokens — single source of truth for the per-business theming system.
 *
 * Values here are consumed by:
 *   - src/app/[business_slug]/layout.tsx (CSS variable injection)
 *   - src/app/layout.tsx (font preloading)
 *   - src/components/admin/settings/* (admin UI selectors + previews)
 *   - src/app/globals.css (defaults under :root)
 *
 * Add new tokens by: extending the enum + default + map here, wiring it in
 * the layout's <style> output, and exposing a selector in the admin form.
 */

export const FONT_KEYS = [
  "geist",
  "inter",
  "poppins",
  "dm-sans",
  "work-sans",
  "manrope",
  "space-grotesk",
  "outfit",
  "figtree",
  "bricolage",
  "playfair",
  "instrument-serif",
  "lora",
  "fraunces",
  "cormorant",
  "libre-baskerville",
] as const;
export type FontKey = (typeof FONT_KEYS)[number];

export type FontOption = {
  key: FontKey;
  label: string;
  cssVar: string;
  category: "sans" | "serif" | "display";
  sample: string;
};

export const FONT_OPTIONS: readonly FontOption[] = [
  // Sans — utility / body-friendly
  { key: "geist",             label: "Geist",             cssVar: "var(--font-geist-sans)",        category: "sans",    sample: "Neutral y moderna" },
  { key: "inter",             label: "Inter",             cssVar: "var(--font-inter)",             category: "sans",    sample: "Clásica, prolija" },
  { key: "poppins",           label: "Poppins",           cssVar: "var(--font-poppins)",           category: "sans",    sample: "Amigable, geométrica" },
  { key: "dm-sans",           label: "DM Sans",           cssVar: "var(--font-dm-sans)",           category: "sans",    sample: "Compacta y clara" },
  { key: "work-sans",         label: "Work Sans",         cssVar: "var(--font-work-sans)",         category: "sans",    sample: "Robusta, legible" },
  { key: "manrope",           label: "Manrope",           cssVar: "var(--font-manrope)",           category: "sans",    sample: "Moderna, equilibrada" },
  { key: "space-grotesk",     label: "Space Grotesk",     cssVar: "var(--font-space-grotesk)",     category: "sans",    sample: "Técnica, distintiva" },
  { key: "outfit",            label: "Outfit",            cssVar: "var(--font-outfit)",            category: "sans",    sample: "Geométrica, fresca" },
  { key: "figtree",           label: "Figtree",           cssVar: "var(--font-figtree)",           category: "sans",    sample: "Cálida, aplicada" },
  // Display
  { key: "bricolage",         label: "Bricolage Grotesque", cssVar: "var(--font-bricolage)",       category: "display", sample: "Editorial, expresiva" },
  // Serif
  { key: "playfair",          label: "Playfair Display",  cssVar: "var(--font-playfair)",          category: "serif",   sample: "Elegante, alto contraste" },
  { key: "instrument-serif",  label: "Instrument Serif",  cssVar: "var(--font-instrument-serif)",  category: "serif",   sample: "Refinada y moderna" },
  { key: "lora",              label: "Lora",              cssVar: "var(--font-lora)",              category: "serif",   sample: "Humanista, cálida" },
  { key: "fraunces",          label: "Fraunces",          cssVar: "var(--font-fraunces)",          category: "serif",   sample: "Variable, con carácter" },
  { key: "cormorant",         label: "Cormorant Garamond", cssVar: "var(--font-cormorant)",        category: "serif",   sample: "Delicada, aristocrática" },
  { key: "libre-baskerville", label: "Libre Baskerville", cssVar: "var(--font-libre-baskerville)", category: "serif",   sample: "Clásica, confiable" },
] as const;

export function fontCssVar(key: FontKey | undefined, fallback: FontKey): string {
  const found = FONT_OPTIONS.find((o) => o.key === (key ?? fallback));
  return (found ?? FONT_OPTIONS[0]!).cssVar;
}

// ── Shape ────────────────────────────────────────────────────────────────
export const RADIUS_SCALE = ["sharp", "standard", "soft", "pill"] as const;
export type RadiusScale = (typeof RADIUS_SCALE)[number];
// Drives `--radius` which globals.css cascades to Tailwind `--radius-sm..4xl`.
export const RADIUS_PX: Record<RadiusScale, string> = {
  sharp:    "0.125rem",
  standard: "0.625rem",
  soft:     "1rem",
  pill:     "1.5rem",
};

export const SHADOW_SCALE = ["flat", "subtle", "elevated"] as const;
export type ShadowScale = (typeof SHADOW_SCALE)[number];
export const SHADOW_VALUE: Record<ShadowScale, string> = {
  flat:     "0 0 #0000",
  subtle:   "0 1px 2px 0 rgb(0 0 0 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.04)",
  elevated: "0 10px 30px -10px rgb(0 0 0 / 0.18), 0 2px 6px -2px rgb(0 0 0 / 0.08)",
};

export const DENSITY_SCALE = ["comfortable", "compact"] as const;
export type Density = (typeof DENSITY_SCALE)[number];

// ── Iconography ──────────────────────────────────────────────────────────
export const ICON_STROKE_SCALE = ["thin", "regular", "medium", "bold"] as const;
export type IconStroke = (typeof ICON_STROKE_SCALE)[number];
export const ICON_STROKE_VALUE: Record<IconStroke, string> = {
  thin:    "1.25",
  regular: "1.5",
  medium:  "1.75",
  bold:    "2",
};

// Rounded = soft curves on stroke endings & corners (default Lucide feel).
// Sharp   = hard corners — reads more industrial, technical, precise.
export const ICON_STYLE_SCALE = ["rounded", "sharp"] as const;
export type IconStyle = (typeof ICON_STYLE_SCALE)[number];
export const ICON_STYLE_VALUE: Record<
  IconStyle,
  { linecap: "round" | "butt"; linejoin: "round" | "miter" }
> = {
  rounded: { linecap: "round", linejoin: "round" },
  sharp:   { linecap: "butt",  linejoin: "miter" },
};

// ── Mode ─────────────────────────────────────────────────────────────────
export const MODE_SCALE = ["light", "dark"] as const;
export type Mode = (typeof MODE_SCALE)[number];

// ── Defaults ─────────────────────────────────────────────────────────────
// If a business hasn't set a token, these are the fallbacks.
export const BRANDING_DEFAULTS = {
  primary_color: "#0F172A",
  primary_foreground: "#FFFFFF",
  secondary_color: "#F4F4F5",
  secondary_foreground: "#18181B",
  accent_color: "#E11D48",
  accent_foreground: "#FFFFFF",
  background_color: "#FFFFFF",
  background_color_dark: "#0B0B0D",
  surface_color: "#FAFAFA",
  muted_color: "#F4F4F5",
  border_color: "#E4E4E7",
  success_color: "#10B981",
  warning_color: "#F59E0B",
  destructive_color: "#EF4444",
  font_heading: "geist" satisfies FontKey,
  font_body: "geist" satisfies FontKey,
  radius_scale: "standard" satisfies RadiusScale,
  shadow_scale: "subtle" satisfies ShadowScale,
  density: "comfortable" satisfies Density,
  icon_stroke_width: "medium" satisfies IconStroke,
  icon_style: "rounded" satisfies IconStyle,
  default_mode: "light" satisfies Mode,
} as const;

export type BrandingDefaults = typeof BRANDING_DEFAULTS;
