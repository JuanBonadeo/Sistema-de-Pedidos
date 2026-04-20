import Link from "next/link";
import { Plus, Store } from "lucide-react";

import { BusinessCard } from "@/components/super/business-card";
import { PlatformStats } from "@/components/super/platform-stats";
import { buttonVariants } from "@/components/ui/button";
import { getPlatformOverview } from "@/lib/platform/queries";

export default async function PlatformHomePage() {
  const { businesses, totals } = await getPlatformOverview();

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Plataforma
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Todos los negocios que corren sobre la plataforma.
          </p>
        </div>
        <Link
          href="/negocios/nuevo"
          className={buttonVariants({ size: "lg" })}
        >
          <Plus className="size-4" /> Nuevo negocio
        </Link>
      </header>

      <PlatformStats totals={totals} />

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-extrabold">Negocios</h2>
          <span className="text-muted-foreground text-sm">
            {businesses.length} total
          </span>
        </div>

        {businesses.length === 0 ? (
          <div className="bg-card text-muted-foreground grid place-items-center gap-3 rounded-2xl border p-14 text-center">
            <div className="bg-muted flex size-14 items-center justify-center rounded-2xl">
              <Store className="size-6" />
            </div>
            <p className="text-base font-semibold">
              Todavía no hay negocios.
            </p>
            <p className="max-w-sm text-sm">
              Creá el primero para invitar a su dueño y empezar a recibir
              pedidos.
            </p>
            <Link
              href="/negocios/nuevo"
              className={buttonVariants({ size: "sm" })}
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
