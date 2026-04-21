"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/currency";
import {
  deleteDailyMenu,
  toggleDailyMenuActive,
  toggleDailyMenuAvailability,
} from "@/lib/daily-menus/daily-menu-actions";
import type { AdminDailyMenu } from "@/lib/admin/daily-menu-query";
import { cn } from "@/lib/utils";

// Letras cortas L M M J V S D en índice 1..6,0 (matcheando getUTCDay).
// Mantenemos el orden de la semana empezando por Lunes para que a un cocinero
// le sea más natural leerlo.
const DAY_CHIPS: { dow: number; label: string }[] = [
  { dow: 1, label: "L" },
  { dow: 2, label: "M" },
  { dow: 3, label: "M" },
  { dow: 4, label: "J" },
  { dow: 5, label: "V" },
  { dow: 6, label: "S" },
  { dow: 0, label: "D" },
];

export function DailyMenuRow({
  slug,
  menu,
}: {
  slug: string;
  menu: AdminDailyMenu;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [available, setAvailable] = useState(menu.is_available);
  const [active, setActive] = useState(menu.is_active);

  const toggleAvailable = (value: boolean) => {
    setAvailable(value);
    startTransition(async () => {
      const r = await toggleDailyMenuAvailability(slug, menu.id, value);
      if (!r.ok) {
        toast.error(r.error);
        setAvailable(!value);
      }
    });
  };

  const toggleActive = (value: boolean) => {
    setActive(value);
    startTransition(async () => {
      const r = await toggleDailyMenuActive(slug, menu.id, value);
      if (!r.ok) {
        toast.error(r.error);
        setActive(!value);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const r = await deleteDailyMenu(slug, menu.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Eliminado.");
      setConfirmOpen(false);
      router.refresh();
    });
  };

  const availableDays = new Set(menu.available_days);

  return (
    <li className="bg-card flex items-center gap-3 rounded-xl p-3">
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
        {menu.image_url && (
          <Image
            src={menu.image_url}
            alt={menu.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{menu.name}</span>
          {!active && (
            <Badge variant="secondary" className="text-[0.65rem]">
              OCULTO
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {formatCurrency(menu.price_cents)} · {menu.components.length}{" "}
          {menu.components.length === 1 ? "componente" : "componentes"}
        </p>
        <div
          className="mt-1.5 flex gap-1"
          aria-label={`Disponible ${menu.available_days.length} días`}
        >
          {DAY_CHIPS.map(({ dow, label }) => {
            const on = availableDays.has(dow);
            return (
              <span
                key={dow}
                title={dayFull(dow)}
                className={cn(
                  "flex size-5 items-center justify-center rounded text-[0.65rem] font-semibold",
                  on
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground/60",
                )}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={available}
            onChange={(e) => toggleAvailable(e.target.checked)}
            disabled={pending}
          />
          Disp.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={active}
            onChange={(e) => toggleActive(e.target.checked)}
            disabled={pending}
          />
          Activo
        </label>
        <Link
          href={`/${slug}/admin/menu-del-dia/${menu.id}`}
          className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
          aria-label="Editar"
        >
          <Pencil className="size-3.5" />
        </Link>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger
            render={
              <Button size="icon-sm" variant="ghost" aria-label="Eliminar">
                <Trash2 className="size-3.5" />
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar &quot;{menu.name}&quot;</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Esta acción no se puede deshacer. Los pedidos existentes se
              mantienen (tienen snapshot).
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={pending}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </li>
  );
}

function dayFull(dow: number): string {
  return (
    [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ][dow] ?? ""
  );
}
