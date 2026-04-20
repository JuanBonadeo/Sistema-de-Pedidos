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
    icon: <LayoutDashboard className="size-4" />,
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
      <div className="bg-card flex items-center justify-between gap-3 border-b px-4 py-3 lg:hidden">
        <div>
          <p className="text-sm font-bold">Pedidos</p>
          <p className="text-muted-foreground text-xs">Plataforma</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="hover:bg-muted rounded-md p-2"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <header className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-base font-extrabold tracking-tight">Pedidos</p>
            <p className="text-muted-foreground text-xs">Plataforma</p>
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
          <SidebarNavItems onNavigate={() => setOpen(false)} />
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
