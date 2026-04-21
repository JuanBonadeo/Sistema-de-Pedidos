import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ReportRange } from "@/lib/admin/reports-query";

const LABELS: Record<ReportRange, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  "7d": "7 días",
  "30d": "30 días",
};

const ORDER: ReportRange[] = ["today", "yesterday", "7d", "30d"];

export function RangeSelector({
  slug,
  active,
}: {
  slug: string;
  active: ReportRange;
}) {
  return (
    <nav
      aria-label="Rango del reporte"
      className="inline-flex rounded-full bg-white p-1 ring-1 ring-zinc-200/70"
    >
      {ORDER.map((r) => {
        const isActive = r === active;
        return (
          <Link
            key={r}
            href={`/${slug}/admin/reportes?range=${r}`}
            aria-pressed={isActive}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              isActive
                ? "text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900",
            )}
            style={
              isActive
                ? {
                    background: "var(--brand)",
                    color: "var(--brand-foreground)",
                  }
                : undefined
            }
          >
            {LABELS[r]}
          </Link>
        );
      })}
    </nav>
  );
}
