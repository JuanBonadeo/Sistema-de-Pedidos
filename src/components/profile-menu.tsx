"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDown, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type MenuItem =
  | {
      type: "link";
      label: string;
      href: string;
      icon?: React.ReactNode;
    }
  | { type: "separator" }
  | {
      type: "action";
      label: string;
      icon?: React.ReactNode;
      onSelect: () => void | Promise<void>;
    };

export function ProfileMenu({
  name,
  email,
  items = [],
  redirectAfterSignOut,
}: {
  name?: string | null;
  email: string;
  items?: MenuItem[];
  redirectAfterSignOut: string;
}) {
  const displayName = name?.trim() || email.split("@")[0];
  const initials = (name ?? email)
    .split(/\s+|[@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = redirectAfterSignOut;
  };

  const allItems: MenuItem[] = [
    ...items,
    ...(items.length > 0 ? [{ type: "separator" as const }] : []),
    {
      type: "action",
      label: "Cerrar sesión",
      icon: <LogOut className="size-4" />,
      onSelect: handleSignOut,
    },
  ];

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "group/button hover:bg-muted flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        )}
      >
        <span
          aria-hidden
          className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-xs font-semibold"
        >
          {initials || "?"}
        </span>
        <span className="hidden text-sm font-medium sm:inline">
          {displayName}
        </span>
        <ChevronDown className="text-muted-foreground size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50">
          <Menu.Popup
            className={cn(
              "bg-popover text-popover-foreground min-w-48 overflow-hidden rounded-lg border p-1 shadow-md",
              "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
            )}
          >
            <div className="border-b px-3 py-2">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-muted-foreground truncate text-xs">
                {email}
              </p>
            </div>
            {allItems.map((item, idx) => {
              if (item.type === "separator") {
                return (
                  <div
                    key={`sep-${idx}`}
                    className="bg-border my-1 h-px"
                  />
                );
              }
              if (item.type === "link") {
                return (
                  <Menu.Item
                    key={idx}
                    render={
                      <a
                        href={item.href}
                        className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-muted"
                      >
                        {item.icon}
                        {item.label}
                      </a>
                    }
                  />
                );
              }
              return (
                <Menu.Item
                  key={idx}
                  onClick={() => item.onSelect()}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-muted"
                >
                  {item.icon}
                  {item.label}
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
