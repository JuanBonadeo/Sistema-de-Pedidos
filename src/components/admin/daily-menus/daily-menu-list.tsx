"use client";

import { formatCurrency } from "@/lib/currency";
import type { AdminDailyMenu } from "@/lib/admin/daily-menu-query";
import { dayOfWeekName } from "@/lib/day-of-week";

import { DailyMenuRow } from "./daily-menu-row";

/**
 * Listado admin de menús del día. Arriba muestra un highlight con
 * "Qué hay hoy" (menús activos + disponibles para el dow pasado desde
 * el server para evitar hydration mismatch). Abajo, la lista completa.
 */
export function DailyMenuList({
  slug,
  menus,
  todayDow,
}: {
  slug: string;
  menus: AdminDailyMenu[];
  todayDow: number;
}) {
  const todaysMenus = menus.filter(
    (m) =>
      m.is_active &&
      m.is_available &&
      m.available_days.includes(todayDow),
  );

  return (
    <>
      <p className="text-sm text-zinc-600">
        Combos cerrados que solo aparecen ciertos días (ej. menú ejecutivo de
        lunes a viernes). Se muestran al cliente en una sección destacada arriba
        del menú.
      </p>

      {/* Qué hay hoy — panel informativo */}
      <section className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50 ring-1 ring-amber-200/70">
        <div className="p-5">
          <header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-800/70">
                Activo ahora — {dayOfWeekName(todayDow)}
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-amber-950">
                Lo que tus clientes están viendo
              </h2>
            </div>
            <span className="rounded-full bg-amber-900/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-900">
              {todaysMenus.length}{" "}
              {todaysMenus.length === 1 ? "menú" : "menús"}
            </span>
          </header>
          {todaysMenus.length === 0 ? (
            <p className="mt-3 text-sm text-amber-900/80">
              Sin menú del día activo hoy. El cliente ve solo el catálogo regular.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {todaysMenus.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3.5 py-2.5 text-sm ring-1 ring-amber-200/60"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-900">
                      {m.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {m.components.length}{" "}
                      {m.components.length === 1 ? "componente" : "componentes"}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-zinc-900">
                    {formatCurrency(m.price_cents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Listado completo */}
      <h2 className="mt-8 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        Todos los menús
      </h2>
      <ul className="mt-2 grid gap-2">
        {menus.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-zinc-200 bg-white py-10 text-center text-sm italic text-zinc-500">
            Todavía no hay menús del día. Creá el primero.
          </li>
        ) : (
          menus.map((m) => <DailyMenuRow key={m.id} slug={slug} menu={m} />)
        )}
      </ul>
    </>
  );
}
