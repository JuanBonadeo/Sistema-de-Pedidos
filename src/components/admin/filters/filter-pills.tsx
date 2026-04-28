"use client";

import { cn } from "@/lib/utils";

/**
 * Horizontal segmented control: a row of clickable pills, one active at a time.
 * Used for the primary filter dimension in admin lists (segments for customers,
 * date range for orders). Active pill uses brand color.
 *
 * Falls back gracefully on small viewports: scrollable horizontally, no scrollbar.
 */
export function FilterPills<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "no-scrollbar flex items-center gap-1.5 overflow-x-auto",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              "outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15",
              active
                ? "shadow-sm ring-1 ring-black/5"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
            style={
              active
                ? {
                    background: "var(--brand, #18181B)",
                    color: "var(--brand-foreground, white)",
                  }
                : undefined
            }
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
