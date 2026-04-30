"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { CatalogClient } from "@/components/admin/catalog/catalog-client";
import { DailyMenuList } from "@/components/admin/daily-menus/daily-menu-list";
import { BrandButton } from "@/components/admin/shell/brand-button";
import { PageHeader } from "@/components/admin/shell/page-shell";
import type {
  AdminCategory,
  AdminProduct,
} from "@/lib/admin/catalog-query";
import type { AdminDailyMenu } from "@/lib/admin/daily-menu-query";
import { cn } from "@/lib/utils";

type Tab = "productos" | "menu-del-dia";

function isTab(value: string | null | undefined): value is Tab {
  return value === "productos" || value === "menu-del-dia";
}

function TabsInner({
  slug,
  businessId,
  categories,
  products,
  menus,
  todayDow,
}: {
  slug: string;
  businessId: string;
  categories: AdminCategory[];
  products: AdminProduct[];
  menus: AdminDailyMenu[];
  todayDow: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const active: Tab = isTab(raw) ? raw : "productos";

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "productos") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : `?`, { scroll: false });
  };

  const counts = useMemo(
    () => ({
      productos: products.length,
      menuDelDia: menus.length,
    }),
    [products.length, menus.length],
  );

  const action =
    active === "productos" ? (
      <BrandButton
        href={`/${slug}/admin/catalogo/productos/nuevo`}
        size="md"
        leadingIcon={<Plus />}
      >
        Nuevo producto
      </BrandButton>
    ) : (
      <BrandButton
        href={`/${slug}/admin/menu-del-dia/nuevo`}
        size="md"
        leadingIcon={<Plus />}
      >
        Nuevo menú
      </BrandButton>
    );

  return (
    <>
      <PageHeader
        eyebrow="Oferta"
        title="Catálogo"
        description="Productos a la carta y menús del día. Todo lo que tus clientes van a ver para armar su pedido."
        action={action}
      />

      <nav
        aria-label="Secciones del catálogo"
        className="inline-flex rounded-2xl bg-white p-1 ring-1 ring-zinc-200/70"
      >
        <TabButton
          active={active === "productos"}
          onClick={() => setTab("productos")}
          count={counts.productos}
        >
          Productos
        </TabButton>
        <TabButton
          active={active === "menu-del-dia"}
          onClick={() => setTab("menu-del-dia")}
          count={counts.menuDelDia}
        >
          Menú del día
        </TabButton>
      </nav>

      <div>
        {active === "productos" ? (
          <CatalogClient
            slug={slug}
            businessId={businessId}
            categories={categories}
            products={products}
          />
        ) : (
          <DailyMenuList slug={slug} menus={menus} todayDow={todayDow} />
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-500 hover:text-zinc-900",
      )}
    >
      {children}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums",
          active ? "bg-white text-zinc-900 ring-1 ring-zinc-200" : "bg-zinc-100 text-zinc-500",
        )}
      >
        {count}
      </span>
    </button>
  );
}

export function CatalogShell(props: {
  slug: string;
  businessId: string;
  categories: AdminCategory[];
  products: AdminProduct[];
  menus: AdminDailyMenu[];
  todayDow: number;
}) {
  return (
    <Suspense fallback={null}>
      <TabsInner {...props} />
    </Suspense>
  );
}
