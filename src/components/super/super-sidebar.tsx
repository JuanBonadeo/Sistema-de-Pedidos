"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
};

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: <LayoutDashboard className="size-4" strokeWidth={1.75} />,
    match: (p) => p === "/" || p.startsWith("/negocios"),
  },
];

export function SuperSidebar({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile topbar */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/70 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 ring-1 ring-zinc-900/10">
            <LayoutDashboard className="size-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Pedidos</p>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
              Plataforma
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-zinc-200/70 bg-zinc-50/80 backdrop-blur-xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <header className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-50 ring-1 ring-zinc-900/10">
              <LayoutDashboard className="size-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-900">
                Pedidos
              </p>
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
                Plataforma
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900 lg:hidden"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

        <nav
          aria-label="Navegación plataforma"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-3"
        >
          <SidebarNavItems onNavigate={() => setOpen(false)} />
        </nav>

        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

        <footer className="p-3">
          <div className="flex items-center gap-2.5 rounded-xl p-1.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 ring-1 ring-zinc-900/10 text-[0.7rem] font-semibold">
              {(userName ?? userEmail)
                .split(/\s+|[@.]/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase() ?? "")
                .join("") || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-900">
                {userName?.trim() || userEmail.split("@")[0]}
              </p>
              <p className="truncate text-[0.65rem] text-zinc-500">
                {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-200/50 hover:text-zinc-900"
          >
            <LogOut className="size-4" strokeWidth={1.75} /> Cerrar sesión
          </button>
        </footer>
      </aside>
    </>
  );
}

function SidebarNavItems({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item, idx) => {
        const isActive = item.match(pathname);
        return (
          <Link
            key={idx}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
              isActive
                ? "bg-white text-zinc-900 font-semibold shadow-sm ring-1 ring-zinc-200/70"
                : "text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900",
            )}
          >
            <span
              className={cn(
                "shrink-0 transition",
                isActive ? "text-zinc-900" : "text-zinc-500",
              )}
            >
              {item.icon}
            </span>
            {item.label}
            {isActive ? (
              <span
                aria-hidden
                className="absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-zinc-900"
              />
            ) : null}
          </Link>
        );
      })}
    </>
  );
}
