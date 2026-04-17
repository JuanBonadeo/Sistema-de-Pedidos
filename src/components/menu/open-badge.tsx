"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  computeIsOpen,
  type BusinessHour,
} from "@/lib/business-hours";

export function OpenBadge({
  isOpenInitial,
  hours,
  timezone,
}: {
  isOpenInitial: boolean;
  hours: BusinessHour[];
  timezone: string;
}) {
  const [open, setOpen] = useState(isOpenInitial);

  useEffect(() => {
    const tick = () => setOpen(computeIsOpen(hours, timezone));
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours, timezone]);

  return (
    <Badge
      className={
        open
          ? "bg-emerald-100 text-emerald-800 border-transparent"
          : "bg-zinc-200 text-zinc-700 border-transparent"
      }
    >
      {open ? "Abierto" : "Cerrado"}
    </Badge>
  );
}
