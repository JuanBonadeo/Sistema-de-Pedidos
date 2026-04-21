"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import {
  ArrowLeft,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
};

function buildNav(slug: string, showBusinessTools: boolean): NavItem[] {
  const adminBase = `/${slug}/admin`;
  const items: NavItem[] = [
    {
      href: adminBase,
      label: "Inicio",
      icon: <LayoutDashboard className="size-5" strokeWidth={1.75} />,
      match: (p) => p === adminBase,
    },
    {
      href: `${adminBase}/pedidos`,
      label: "Pedidos",
      icon: <ShoppingBag className="size-5" strokeWidth={1.75} />,
      match: (p) => p.startsWith(`${adminBase}/pedidos`),
    },
    {
      href: `${adminBase}/catalogo`,
      label: "Catálogo",
      icon: <Package className="size-5" strokeWidth={1.75} />,
      match: (p) =>
        p.startsWith(`${adminBase}/catalogo`) ||
        p.startsWith(`${adminBase}/menu-del-dia`),
    },
    {
      href: `${adminBase}/reportes`,
      label: "Reportes",
      icon: <BarChart3 className="size-5" strokeWidth={1.75} />,
      match: (p) => p.startsWith(`${adminBase}/reportes`),
    },
    {
      href: `${adminBase}/chatbot`,
      label: "Chatbot",
      icon: <MessageSquare className="size-5" strokeWidth={1.75} />,
      match: (p) => p.startsWith(`${adminBase}/chatbot`),
    },
  ];
  if (showBusinessTools) {
    items.push(
      {
        href: `${adminBase}/usuarios`,
        label: "Equipo",
        icon: <Users className="size-5" strokeWidth={1.75} />,
        match: (p) => p.startsWith(`${adminBase}/usuarios`),
      },
      {
        href: `${adminBase}/configuracion`,
        label: "Ajustes",
        icon: <Settings className="size-5" strokeWidth={1.75} />,
        match: (p) => p.startsWith(`${adminBase}/configuracion`),
      },
    );
  }
  return items;
}

const STORAGE_KEY = "adminSidebarExpanded";

export function AdminSidebar({
  slug,
  businessName,
  businessLogoUrl = null,
  userEmail,
  userName,
  isPlatformAdmin = false,
  canManageBusiness = false,
}: {
  slug: string;
  businessName: string;
  businessLogoUrl?: string | null;
  userEmail: string;
  userName?: string | null;
  isPlatformAdmin?: boolean;
  canManageBusiness?: boolean;
}) {
  const pathname = usePathname();
  const items = buildNav(slug, canManageBusiness);

  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setExpanded(true);
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const primary = items.slice(0, 5);
  const secondary = items.slice(5);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen shrink-0 flex-col",
        "border-r border-zinc-200/70 bg-zinc-50/80 backdrop-blur-xl",
        "transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        expanded ? "w-64" : "w-[72px]",
      )}
    >
      <header
        className={cn(
          "flex gap-2 p-3",
          expanded ? "flex-row items-center" : "flex-col items-center",
        )}
      >
        <BusinessMark
          slug={slug}
          name={businessName}
          logoUrl={businessLogoUrl}
        />
        {expanded && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-zinc-900">
              {businessName}
            </p>
            <p className="truncate text-[0.65rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
              Panel admin
            </p>
          </div>
        )}
        <ToggleButton expanded={expanded} onClick={toggle} />
      </header>

      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

      <nav
        aria-label="Navegación principal"
        className={cn(
          "flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-3",
          expanded ? "px-3" : "items-center px-0",
        )}
      >
        {primary.map((item) => (
          <NavIcon
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={item.match(pathname)}
            expanded={expanded}
          />
        ))}

        {secondary.length > 0 && (
          <>
            <div
              className={cn(
                "my-2 h-px bg-zinc-200/70",
                expanded ? "" : "w-8 self-center",
              )}
            />
            {secondary.map((item) => (
              <NavIcon
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={item.match(pathname)}
                expanded={expanded}
              />
            ))}
          </>
        )}

        {isPlatformAdmin && (
          <>
            <div
              className={cn(
                "my-2 h-px bg-zinc-200/70",
                expanded ? "" : "w-8 self-center",
              )}
            />
            <NavIcon
              href="/"
              label="Plataforma"
              icon={<ArrowLeft className="size-5" strokeWidth={1.75} />}
              active={false}
              expanded={expanded}
            />
          </>
        )}
      </nav>

      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

      <div
        className={cn(
          "p-3",
          expanded ? "flex items-center gap-2" : "flex justify-center",
        )}
      >
        <UserMenu
          slug={slug}
          userEmail={userEmail}
          userName={userName}
          isPlatformAdmin={isPlatformAdmin}
          expanded={expanded}
        />
      </div>
    </aside>
  );
}

function BusinessMark({
  slug,
  name,
  logoUrl,
}: {
  slug: string;
  name: string;
  logoUrl: string | null;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?";
  return (
    <Link
      href={`/${slug}/admin`}
      aria-label={name}
      title={name}
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl",
        "ring-1 ring-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition",
        "hover:ring-black/20",
      )}
      style={{
        background: "var(--brand)",
        color: "var(--brand-foreground)",
      }}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          fill
          sizes="44px"
          className="object-cover"
        />
      ) : (
        <span className="text-xs font-bold tracking-tight">{initials}</span>
      )}
    </Link>
  );
}

function ToggleButton({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={expanded ? "Colapsar menú" : "Expandir menú"}
      title={expanded ? "Colapsar" : "Expandir"}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        "text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900",
      )}
    >
      {expanded ? (
        <ChevronsLeft className="size-4" />
      ) : (
        <ChevronsRight className="size-4" />
      )}
    </button>
  );
}

function NavIcon({
  href,
  label,
  icon,
  active,
  expanded,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  expanded: boolean;
}) {
  if (expanded) {
    return (
      <Link
        href={href}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
          "outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          active
            ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/70"
            : "text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900",
        )}
      >
        <span
          className={cn(
            "shrink-0 transition",
            active ? "" : "text-zinc-500 group-hover:text-zinc-900",
          )}
          style={active ? { color: "var(--brand)" } : undefined}
        >
          {icon}
        </span>
        <span className="truncate font-medium">{label}</span>
        {active ? (
          <span
            aria-hidden
            className="absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full"
            style={{ background: "var(--brand)" }}
          />
        ) : null}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={href}
        aria-label={label}
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl transition",
          "outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          active
            ? "bg-white shadow-sm ring-1 ring-zinc-200/70"
            : "text-zinc-500 hover:bg-zinc-200/40 hover:text-zinc-900",
        )}
        style={active ? { color: "var(--brand)" } : undefined}
      >
        {icon}
      </Link>
      <Tooltip label={label} />
    </div>
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2",
        "whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5",
        "text-xs font-medium text-zinc-50 shadow-lg shadow-zinc-900/10",
        "opacity-0 transition-opacity duration-200 group-hover:opacity-100",
      )}
    >
      {label}
    </span>
  );
}

function UserMenu({
  slug,
  userEmail,
  userName,
  isPlatformAdmin,
  expanded,
}: {
  slug: string;
  userEmail: string;
  userName?: string | null;
  isPlatformAdmin: boolean;
  expanded: boolean;
}) {
  const displayName = userName?.trim() || userEmail.split("@")[0];
  const initials =
    (userName ?? userEmail)
      .split(/\s+|[@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = isPlatformAdmin
      ? "/login"
      : `/${slug}/admin/login`;
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Cuenta"
        className={cn(
          "flex min-w-0 items-center gap-2.5 rounded-xl p-1.5 outline-none transition",
          "hover:bg-zinc-200/50",
          "focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          expanded ? "w-full" : "",
        )}
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            "bg-zinc-900 text-zinc-50 text-[0.7rem] font-semibold",
            "ring-1 ring-zinc-900/10",
          )}
        >
          {initials}
        </span>
        {expanded && (
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-xs font-semibold text-zinc-900">
              {displayName}
            </p>
            <p className="truncate text-[0.65rem] text-zinc-500">
              {userEmail}
            </p>
          </div>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          sideOffset={10}
          align="end"
          side="top"
          className="z-50"
        >
          <Menu.Popup
            className={cn(
              "min-w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1",
              "shadow-lg shadow-zinc-900/5",
              "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
              "transition-opacity",
            )}
          >
            <div className="border-b border-zinc-100 px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {displayName}
              </p>
              <p className="truncate text-xs text-zinc-500">{userEmail}</p>
            </div>
            <Menu.Item
              onClick={handleSignOut}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm",
                "outline-none transition",
                "data-[highlighted]:bg-zinc-100",
              )}
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
