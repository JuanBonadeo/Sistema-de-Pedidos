"use client";

import { LayoutGrid, ListChecks, Bell, User } from "lucide-react";

export type MozoTab = "salon" | "mesas" | "avisos" | "yo";

type Props = {
  active: MozoTab;
  onChange: (tab: MozoTab) => void;
  unreadCount?: number;
  myActiveCount?: number;
};

type TabDef = {
  id: MozoTab;
  label: string;
  Icon: typeof LayoutGrid;
};

const TABS: TabDef[] = [
  { id: "salon", label: "Salón", Icon: LayoutGrid },
  { id: "mesas", label: "Mis mesas", Icon: ListChecks },
  { id: "avisos", label: "Avisos", Icon: Bell },
  { id: "yo", label: "Yo", Icon: User },
];

export function MobileTabBar({
  active,
  onChange,
  unreadCount = 0,
  myActiveCount = 0,
}: Props) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = id === active;
          const badge =
            id === "avisos" && unreadCount > 0
              ? unreadCount
              : id === "mesas" && myActiveCount > 0
                ? myActiveCount
                : null;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex h-16 w-full flex-col items-center justify-center gap-1 transition-colors active:scale-[0.96] active:bg-zinc-100 ${
                  isActive ? "text-zinc-900" : "text-zinc-500"
                }`}
              >
                <span className="relative">
                  <Icon
                    className={`h-6 w-6 transition-transform ${
                      isActive ? "scale-110" : ""
                    }`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  {badge != null && (
                    <span
                      className={`absolute -right-2 -top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums text-white ${
                        id === "avisos" ? "bg-red-500" : "bg-zinc-900"
                      }`}
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[11px] font-medium leading-none ${
                    isActive ? "font-semibold" : ""
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-zinc-900" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
