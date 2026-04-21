"use client";

import { useEffect, useState } from "react";

function greetingFor(hour: number): string {
  if (hour < 6) return "Buenas noches";
  if (hour < 13) return "Buen día";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardHeader({
  businessName,
  userName,
  timezone,
}: {
  businessName: string;
  userName?: string | null;
  timezone: string;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const clockFmt = new Intl.DateTimeFormat("es-AR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateFmt = new Intl.DateTimeFormat("es-AR", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const hour = now
    ? Number(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: timezone,
          hour: "2-digit",
          hour12: false,
        }).format(now),
      )
    : 12;

  const greeting = greetingFor(hour);
  const firstName =
    userName?.split(/\s+/)[0] ??
    businessName.split(/\s+/)[0] ??
    businessName;

  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Panel · {businessName}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          {greeting},{" "}
          <span className="text-zinc-500">{firstName}</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Resumen del día y lo que tus clientes están viendo ahora mismo.
        </p>
      </div>
      <div className="rounded-2xl bg-white px-5 py-4 text-right ring-1 ring-zinc-200/70">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Hora del local
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900">
          {now ? clockFmt.format(now) : "--:--"}
        </p>
        <p className="mt-0.5 text-xs capitalize text-zinc-500">
          {now ? dateFmt.format(now) : ""}
        </p>
      </div>
    </header>
  );
}
