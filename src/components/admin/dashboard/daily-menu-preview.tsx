import Link from "next/link";
import { ArrowUpRight, UtensilsCrossed } from "lucide-react";

import { formatCurrency } from "@/lib/currency";
import type { AdminDailyMenu } from "@/lib/admin/daily-menu-query";
import { dayOfWeekName } from "@/lib/day-of-week";

export function DailyMenuPreview({
  slug,
  menus,
  todayDow,
}: {
  slug: string;
  menus: AdminDailyMenu[];
  todayDow: number;
}) {
  const todays = menus.filter(
    (m) => m.is_active && m.is_available && m.available_days.includes(todayDow),
  );

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Menú del día · {dayOfWeekName(todayDow)}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            {todays.length === 0
              ? "Sin menú activo hoy"
              : todays.length === 1
                ? todays[0].name
                : `${todays.length} menús disponibles`}
          </h2>
        </div>
        <Link
          href={`/${slug}/admin/catalogo?tab=menu-del-dia`}
          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          Gestionar
          <ArrowUpRight className="size-3" />
        </Link>
      </header>

      {todays.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200">
            <UtensilsCrossed className="size-4 text-zinc-500" />
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            Hoy no hay menú del día cargado. Tus clientes ven solo el catálogo
            regular.
          </p>
          <Link
            href={`/${slug}/admin/catalogo?tab=menu-del-dia`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:underline"
          >
            Crear uno
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {todays.map((m) => (
            <li
              key={m.id}
              className="group flex items-start gap-4 rounded-xl border border-zinc-100 bg-zinc-50/40 p-4 transition hover:border-zinc-200 hover:bg-zinc-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-zinc-900">
                  {m.name}
                </p>
                {m.description ? (
                  <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">
                    {m.description}
                  </p>
                ) : null}
                {m.components.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {m.components.slice(0, 4).map((c) => (
                      <li
                        key={c.id}
                        className="rounded-full bg-white px-2.5 py-0.5 text-[0.7rem] text-zinc-600 ring-1 ring-zinc-200"
                      >
                        {c.label}
                      </li>
                    ))}
                    {m.components.length > 4 ? (
                      <li className="text-[0.7rem] text-zinc-500">
                        +{m.components.length - 4}
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
              <span className="shrink-0 text-right">
                <span className="block text-[0.65rem] font-medium uppercase tracking-wider text-zinc-500">
                  Precio
                </span>
                <span className="block text-base font-semibold tabular-nums text-zinc-900">
                  {formatCurrency(m.price_cents)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
