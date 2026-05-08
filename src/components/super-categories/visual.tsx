"use client";

import {
  Beer,
  Cake,
  Coffee,
  CookingPot,
  Croissant,
  IceCream,
  MoreHorizontal,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";

import {
  type SuperCategoryColorSlug,
  type SuperCategoryIconSlug,
} from "@/lib/super-categories/visual";

const ICON_COMPONENTS: Record<SuperCategoryIconSlug, LucideIcon> = {
  salad: Salad,
  "utensils-crossed": UtensilsCrossed,
  wine: Wine,
  cake: Cake,
  coffee: Coffee,
  beer: Beer,
  pizza: Pizza,
  "ice-cream": IceCream,
  sparkles: Sparkles,
  star: Star,
  sandwich: Sandwich,
  soup: Soup,
  "cooking-pot": CookingPot,
  croissant: Croissant,
  "more-horizontal": MoreHorizontal,
};

export function resolveSuperCategoryIcon(slug: string | null | undefined): LucideIcon {
  if (!slug) return UtensilsCrossed;
  return ICON_COMPONENTS[slug as SuperCategoryIconSlug] ?? UtensilsCrossed;
}

/**
 * Pares de clases Tailwind por color. Explícitos para que el purge no se
 * confunda con concatenación dinámica.
 */
export const COLOR_CLASSES: Record<
  SuperCategoryColorSlug,
  {
    text: string;
    textActive: string;
    bg: string;
    bgStrong: string;
    ring: string;
  }
> = {
  lime: {
    text: "text-lime-700",
    textActive: "text-lime-300",
    bg: "bg-lime-50",
    bgStrong: "bg-lime-100",
    ring: "ring-lime-200",
  },
  orange: {
    text: "text-orange-700",
    textActive: "text-orange-300",
    bg: "bg-orange-50",
    bgStrong: "bg-orange-100",
    ring: "ring-orange-200",
  },
  sky: {
    text: "text-sky-700",
    textActive: "text-sky-300",
    bg: "bg-sky-50",
    bgStrong: "bg-sky-100",
    ring: "ring-sky-200",
  },
  pink: {
    text: "text-pink-700",
    textActive: "text-pink-300",
    bg: "bg-pink-50",
    bgStrong: "bg-pink-100",
    ring: "ring-pink-200",
  },
  amber: {
    text: "text-amber-700",
    textActive: "text-amber-300",
    bg: "bg-amber-50",
    bgStrong: "bg-amber-100",
    ring: "ring-amber-200",
  },
  red: {
    text: "text-red-700",
    textActive: "text-red-300",
    bg: "bg-red-50",
    bgStrong: "bg-red-100",
    ring: "ring-red-200",
  },
  emerald: {
    text: "text-emerald-700",
    textActive: "text-emerald-300",
    bg: "bg-emerald-50",
    bgStrong: "bg-emerald-100",
    ring: "ring-emerald-200",
  },
  rose: {
    text: "text-rose-700",
    textActive: "text-rose-300",
    bg: "bg-rose-50",
    bgStrong: "bg-rose-100",
    ring: "ring-rose-200",
  },
  violet: {
    text: "text-violet-700",
    textActive: "text-violet-300",
    bg: "bg-violet-50",
    bgStrong: "bg-violet-100",
    ring: "ring-violet-200",
  },
  zinc: {
    text: "text-zinc-700",
    textActive: "text-zinc-300",
    bg: "bg-zinc-50",
    bgStrong: "bg-zinc-100",
    ring: "ring-zinc-200",
  },
};

export function resolveColorClasses(slug: string | null | undefined) {
  if (!slug) return COLOR_CLASSES.zinc;
  return COLOR_CLASSES[slug as SuperCategoryColorSlug] ?? COLOR_CLASSES.zinc;
}

/**
 * Avatar circular del ícono con bg + color suave. Útil para listas de
 * supercategorías. `size` controla el tamaño total ("sm" 32px, "md" 40px, "lg" 48px).
 */
export function SuperCategoryAvatar({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = resolveSuperCategoryIcon(icon);
  const c = resolveColorClasses(color);
  const dim =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${dim} ${c.bgStrong} ${className ?? ""}`}
    >
      <Icon className={`${iconSize} ${c.text}`} />
    </span>
  );
}
