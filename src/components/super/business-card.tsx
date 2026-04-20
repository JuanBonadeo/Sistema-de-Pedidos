import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Settings, Store, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  const revenueLabel = formatCurrency(business.revenue_30d_cents);

  return (
    <div
      className={
        "group bg-card hover:border-primary/40 relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 transition hover:shadow-[0_12px_40px_rgba(19,27,46,0.06)]"
      }
    >
      <span
        aria-hidden
        className="bg-primary/10 absolute inset-x-0 -top-24 h-24 blur-3xl transition group-hover:bg-primary/20"
      />

      <Link
        href={`/${business.slug}/admin`}
        aria-label={`Entrar al panel de ${business.name}`}
        className="absolute inset-0 z-10"
      />

      <header className="relative flex items-start gap-3">
        <div className="bg-muted text-muted-foreground relative size-12 shrink-0 overflow-hidden rounded-xl">
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
            <h3 className="truncate text-base font-extrabold tracking-tight">
              {business.name}
            </h3>
            {business.is_active ? (
              <Badge
                variant="secondary"
                className="border-transparent bg-emerald-100 text-[0.65rem] uppercase tracking-wider text-emerald-800"
              >
                Activo
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-[0.65rem] uppercase tracking-wider"
              >
                Inactivo
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            /{business.slug}
          </p>
          <p className="text-muted-foreground/70 text-[0.7rem]">
            {business.timezone}
          </p>
        </div>
      </header>

      <div className="relative grid grid-cols-3 gap-2 border-t pt-4">
        <Stat label="30d" value={business.orders_30d.toString()} sub="pedidos" />
        <Stat label="30d" value={revenueLabel} sub="ingresos" />
        <Stat
          label="—"
          value={business.member_count.toString()}
          sub={`miembro${business.member_count === 1 ? "" : "s"}`}
          icon={<Users className="size-3" />}
        />
      </div>

      <footer className="relative flex items-center justify-between">
        <Link
          href={`/negocios/${business.id}`}
          className="text-muted-foreground hover:text-foreground relative z-20 inline-flex items-center gap-1 text-xs"
        >
          <Settings className="size-3" />
          Miembros
        </Link>
        <span className="text-primary inline-flex items-center gap-1 text-xs font-semibold">
          Entrar al panel
          <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="grid gap-0.5">
      <span className="text-muted-foreground/60 text-[0.6rem] font-medium uppercase tracking-widest">
        {label}
      </span>
      <span className="truncate text-sm font-extrabold tabular-nums">
        {value}
      </span>
      <span className="text-muted-foreground flex items-center gap-1 text-[0.65rem]">
        {icon}
        {sub}
      </span>
    </div>
  );
}
