import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
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
    <div className="flex items-center gap-2">
      {ORDER.map((r) => (
        <Link
          key={r}
          href={`/${slug}/admin/reportes?range=${r}`}
          className={buttonVariants({
            size: "sm",
            variant: r === active ? "default" : "outline",
          })}
        >
          {LABELS[r]}
        </Link>
      ))}
    </div>
  );
}
