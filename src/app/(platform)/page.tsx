import Link from "next/link";
import { Plus, Store } from "lucide-react";

import { BusinessCard } from "@/components/super/business-card";
import { PlatformStats } from "@/components/super/platform-stats";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPlatformOverview } from "@/lib/platform/queries";

export default async function PlatformHomePage() {
  const { businesses, totals } = await getPlatformOverview();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Plataforma · vista general
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Todos los negocios
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600">
            Tu vista consolidada de los locales que corren sobre Pedidos. Entrá
            al panel de cualquiera o creá uno nuevo.
          </p>
        </div>
        <Link
          href="/negocios/nuevo"
          className={cn(
            buttonVariants({ size: "lg" }),
            "rounded-full px-6 shadow-sm",
          )}
        >
          <Plus className="size-4" /> Nuevo negocio
        </Link>
      </header>

      <PlatformStats totals={totals} />

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Negocios
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
              Directorio
            </h2>
          </div>
          <span className="text-sm tabular-nums text-zinc-500">
            {businesses.length}{" "}
            {businesses.length === 1 ? "negocio" : "negocios"}
          </span>
        </div>

        {businesses.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-2xl bg-white p-14 text-center ring-1 ring-zinc-200/70">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
              <Store className="size-6" strokeWidth={1.75} />
            </div>
            <p className="text-base font-semibold text-zinc-900">
              Todavía no hay negocios
            </p>
            <p className="max-w-sm text-sm text-zinc-600">
              Creá el primero para invitar a su dueño y empezar a recibir
              pedidos.
            </p>
            <Link
              href="/negocios/nuevo"
              className={cn(
                buttonVariants({ size: "sm" }),
                "mt-2 rounded-full px-4",
              )}
            >
              <Plus className="size-3.5" /> Crear negocio
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export const dynamic = "force-dynamic";
