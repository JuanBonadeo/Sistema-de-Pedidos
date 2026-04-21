import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Settings, Store } from "lucide-react";

import { formatCurrency } from "@/lib/currency";
import type { PlatformBusiness } from "@/lib/platform/queries";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function BusinessCard({ business }: { business: PlatformBusiness }) {
  return (
    <article
      className={
        "group relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70 transition hover:ring-zinc-300"
      }
    >
      <Link
        href={`/${business.slug}/admin`}
        aria-label={`Entrar al panel de ${business.name}`}
        className="absolute inset-0 z-0"
      />

      <header className="relative flex items-start gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200">
          {business.logo_url ? (
            <Image
              src={business.logo_url}
              alt={business.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm font-bold">
              {initials(business.name) || <Store className="size-5" />}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight text-zinc-900">
              {business.name}
            </h3>
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider " +
                (business.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-zinc-100 text-zinc-500")
              }
            >
              <span
                className={
                  "size-1.5 rounded-full " +
                  (business.is_active ? "bg-emerald-500" : "bg-zinc-400")
                }
              />
              {business.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            /{business.slug}
          </p>
          <p className="mt-px truncate text-[0.65rem] text-zinc-400">
            {business.timezone}
          </p>
        </div>
      </header>

      <div className="relative grid grid-cols-3 divide-x divide-zinc-100 border-t border-zinc-100 pt-4">
        <Stat value={business.orders_30d.toString()} sub="pedidos · 30d" />
        <Stat
          value={formatCurrency(business.revenue_30d_cents)}
          sub="ingresos · 30d"
          indent
        />
        <Stat
          value={business.member_count.toString()}
          sub={`miembro${business.member_count === 1 ? "" : "s"}`}
          indent
        />
      </div>

      <footer className="relative flex items-center justify-between">
        <Link
          href={`/negocios/${business.id}`}
          className="relative z-10 inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-900"
        >
          <Settings className="size-3" strokeWidth={1.75} />
          Gestionar
        </Link>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900">
          Entrar al panel
          <span className="flex size-6 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            <ArrowUpRight className="size-3" />
          </span>
        </span>
      </footer>
    </article>
  );
}

function Stat({
  value,
  sub,
  indent = false,
}: {
  value: string;
  sub: string;
  indent?: boolean;
}) {
  return (
    <div className={"grid gap-0.5 " + (indent ? "pl-3" : "")}>
      <span className="truncate text-sm font-semibold tabular-nums text-zinc-900">
        {value}
      </span>
      <span className="truncate text-[0.65rem] text-zinc-500">{sub}</span>
    </div>
  );
}
