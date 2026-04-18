"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
};

function buildNav(slug: string): NavItem[] {
  return [
    {
      href: `/${slug}/admin`,
      label: "Pedidos",
      icon: <ShoppingBag className="size-4" />,
      match: (p) =>
        p === `/${slug}/admin` ||
        p.startsWith(`/${slug}/admin/pedidos`),
    },
    {
      href: `/${slug}/admin/catalogo`,
      label: "Productos",
      icon: <Package className="size-4" />,
      match: (p) => p.startsWith(`/${slug}/admin/catalogo`),
    },
    {
      href: `/${slug}/admin/reportes`,
      label: "Reportes",
      icon: <BarChart3 className="size-4" />,
      match: (p) => p.startsWith(`/${slug}/admin/reportes`),
    },
  ];
}

export function AdminSidebar({
  slug,
  businessName,
  userEmail,
  userName,
  isPlatformAdmin = false,
}: {
  slug: string;
  businessName: string;
  userEmail: string;
  userName?: string | null;
  isPlatformAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = isPlatformAdmin
      ? "/super/login"
      : `/${slug}/admin/login`;
  };

  return (
    <>
      {/* Mobile topbar */}
      <div className="bg-card flex items-center justify-between gap-3 border-b px-4 py-3 lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{businessName}</p>
          <p className="text-muted-foreground text-xs">Pedidos</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="hover:bg-muted rounded-md p-2"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "bg-card fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <header className="flex items-center justify-between px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold tracking-tight">
              {businessName}
            </p>
            <p className="text-muted-foreground text-xs">Pedidos</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="hover:bg-muted rounded-md p-1 lg:hidden"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </header>

        <nav className="flex-1 space-y-1 px-3 py-2">
          <SidebarNavItems slug={slug} onNavigate={() => setOpen(false)} />
          {isPlatformAdmin && (
            <Link
              href="/super"
              className="text-muted-foreground hover:bg-muted mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
            >
              <ArrowLeft className="size-4" />
              Volver a plataforma
            </Link>
          )}
        </nav>

        <footer className="border-t p-3">
          <div className="flex items-center gap-2 px-2 py-2">
            <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {(userName ?? userEmail)
                .split(/\s+|[@.]/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase() ?? "")
                .join("") || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {userName?.trim() || userEmail.split("@")[0]}
              </p>
              <p className="text-muted-foreground truncate text-[0.65rem]">
                {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </footer>
      </aside>
    </>
  );
}

function SidebarNavItems({
  slug,
  onNavigate,
}: {
  slug: string;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const items = buildNav(slug);
  return (
    <>
      {items.map((item, idx) => {
        const isActive = item.match(pathname);
        return (
          <Link
            key={idx}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
              isActive
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground hover:bg-muted",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
