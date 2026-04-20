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
  LogOut,
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
  const items: NavItem[] = [
    {
      href: `/${slug}/admin`,
      label: "Pedidos",
      icon: <ShoppingBag className="size-5" />,
      match: (p) =>
        p === `/${slug}/admin` || p.startsWith(`/${slug}/admin/pedidos`),
    },
    {
      href: `/${slug}/admin/catalogo`,
      label: "Productos",
      icon: <Package className="size-5" />,
      match: (p) => p.startsWith(`/${slug}/admin/catalogo`),
    },
    {
      href: `/${slug}/admin/reportes`,
      label: "Reportes",
      icon: <BarChart3 className="size-5" />,
      match: (p) => p.startsWith(`/${slug}/admin/reportes`),
    },
  ];
  if (showBusinessTools) {
    items.push(
      {
        href: `/${slug}/admin/usuarios`,
        label: "Usuarios",
        icon: <Users className="size-5" />,
        match: (p) => p.startsWith(`/${slug}/admin/usuarios`),
      },
      {
        href: `/${slug}/admin/configuracion`,
        label: "Configuración",
        icon: <Settings className="size-5" />,
        match: (p) => p.startsWith(`/${slug}/admin/configuracion`),
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

  // Default collapsed; hydrate from localStorage after mount so SSR is stable.
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setExpanded(true);
    } catch {
      // ignore — e.g. privacy mode
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

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen shrink-0 flex-col",
        "border-r border-zinc-200 bg-zinc-100/80 backdrop-blur",
        "transition-[width] duration-200 ease-out",
        expanded ? "w-60" : "w-16",
      )}
    >
      {/* Header: brand mark + (optional) name + toggle */}
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
            <p className="truncate text-sm font-bold text-zinc-900">
              {businessName}
            </p>
            <p className="truncate text-[0.7rem] text-zinc-500">Pedidos</p>
          </div>
        )}
        <ToggleButton expanded={expanded} onClick={toggle} />
      </header>

      <div className="mx-3 h-px bg-zinc-200" />

      {/* Nav */}
      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-3",
          expanded ? "px-3" : "items-center px-0",
        )}
      >
        {items.map((item) => (
          <NavIcon
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={item.match(pathname)}
            expanded={expanded}
          />
        ))}

        {isPlatformAdmin && (
          <>
            <div
              className={cn(
                "my-2 h-px bg-zinc-200",
                expanded ? "" : "w-8 self-center",
              )}
            />
            <NavIcon
              href="/"
              label="Volver a plataforma"
              icon={<ArrowLeft className="size-5" />}
              active={false}
              expanded={expanded}
            />
          </>
        )}
      </nav>

      <div className="mx-3 h-px bg-zinc-200" />

      {/* User */}
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
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl",
        "bg-primary text-primary-foreground ring-1 ring-zinc-200",
        "transition hover:ring-zinc-300",
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          fill
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <span className="text-xs font-black tracking-tight">{initials}</span>
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
        "text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900",
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
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
          active
            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
            : "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900",
        )}
      >
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={href}
        aria-label={label}
        className={cn(
          "flex size-10 items-center justify-center rounded-xl transition",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900",
        )}
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
        "pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2",
        "whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1.5",
        "text-xs font-medium text-white shadow-lg",
        "opacity-0 transition-opacity duration-150 group-hover:opacity-100",
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
          "flex min-w-0 items-center gap-2 rounded-lg p-1 outline-none transition",
          "hover:bg-zinc-200",
          "focus-visible:ring-2 focus-visible:ring-primary/50",
          expanded ? "w-full" : "",
        )}
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground text-xs font-semibold",
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
              "min-w-56 overflow-hidden rounded-lg border bg-popover p-1",
              "text-popover-foreground shadow-md",
              "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
              "transition-opacity",
            )}
          >
            <div className="border-b px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-muted-foreground truncate text-xs">
                {userEmail}
              </p>
            </div>
            <Menu.Item
              onClick={handleSignOut}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm",
                "outline-none transition",
                "data-[highlighted]:bg-muted",
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
