/**
 * Constantes compartidas para iconos y colores de supercategorías.
 *
 * Server-safe: solo strings, sin imports de lucide ni clases tailwind.
 * El render visual (componente lucide + clases tailwind) vive en
 * `components/super-categories/visual.tsx` para que tailwind purge no se
 * confunda con concatenación dinámica.
 *
 * Cuando agregues un nuevo ícono o color, sumalo acá Y en el componente
 * de render. Las migraciones existentes guardan el slug en DB; agregar
 * uno nuevo no requiere migración (es solo `text not null`).
 */

export const SUPER_CATEGORY_ICONS = [
  "salad",
  "utensils-crossed",
  "wine",
  "cake",
  "coffee",
  "beer",
  "pizza",
  "ice-cream",
  "sparkles",
  "star",
  "sandwich",
  "soup",
  "cooking-pot",
  "croissant",
  "more-horizontal",
] as const;

export type SuperCategoryIconSlug = (typeof SUPER_CATEGORY_ICONS)[number];

export const SUPER_CATEGORY_COLORS = [
  "lime",
  "orange",
  "sky",
  "pink",
  "amber",
  "red",
  "emerald",
  "rose",
  "violet",
  "zinc",
] as const;

export type SuperCategoryColorSlug = (typeof SUPER_CATEGORY_COLORS)[number];
