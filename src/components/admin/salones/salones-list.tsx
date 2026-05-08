"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BrandButton } from "@/components/admin/shell/brand-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { FloorPlanWithTables } from "@/lib/admin/floor-plan/queries";
import {
  createFloorPlan,
  deleteFloorPlan,
} from "@/lib/admin/floor-plan/actions";
import { cn } from "@/lib/utils";

export function SalonesList({
  slug,
  plans,
  canManage,
}: {
  slug: string;
  plans: FloorPlanWithTables[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const r = await deleteFloorPlan(id, slug);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Salón borrado.");
      setConfirmDelete(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {plans.length} {plans.length === 1 ? "salón" : "salones"}
        </p>
        {canManage && (
          <NewSalonDialog
            slug={slug}
            trigger={
              <BrandButton size="md" leadingIcon={<Plus />}>
                Nuevo salón
              </BrandButton>
            }
          />
        )}
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map(({ plan, tables }) => (
          <li key={plan.id}>
            <SalonCard
              slug={slug}
              plan={plan}
              tables={tables}
              canManage={canManage}
              onAskDelete={() => setConfirmDelete({ id: plan.id, name: plan.name })}
            />
          </li>
        ))}
      </ul>

      {/* Confirm delete dialog */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Borrar salón &quot;{confirmDelete?.name}&quot;</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            Las mesas del salón se borran. Las reservas históricas que apuntaban
            a esas mesas quedan sin mesa asignada (pero no se borran).
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
              disabled={pending}
            >
              Borrar salón
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Card individual ────────────────────────────────────────────────────────

function SalonCard({
  slug,
  plan,
  tables,
  canManage,
  onAskDelete,
}: {
  slug: string;
  plan: FloorPlanWithTables["plan"];
  tables: FloorPlanWithTables["tables"];
  canManage: boolean;
  onAskDelete: () => void;
}) {
  const activeTables = tables.filter((t) => t.status === "active");
  const totalSeats = activeTables.reduce((sum, t) => sum + t.seats, 0);

  return (
    <div className="bg-card ring-border/60 group relative overflow-hidden rounded-2xl ring-1 transition hover:ring-zinc-300">
      <Link
        href={`/${slug}/admin/salones/${plan.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <PlanPreview plan={plan} tables={tables} />
        <div className="space-y-1 p-4">
          <h3 className="text-foreground truncate text-base font-bold tracking-tight">
            {plan.name}
          </h3>
          <p className="text-muted-foreground text-xs">
            {activeTables.length}{" "}
            {activeTables.length === 1 ? "mesa activa" : "mesas activas"} ·{" "}
            {totalSeats} {totalSeats === 1 ? "lugar" : "lugares"}
          </p>
        </div>
      </Link>
      {canManage && (
        <button
          type="button"
          onClick={onAskDelete}
          className="absolute right-2 top-2 hidden rounded-full bg-white/95 p-2 text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition hover:text-red-600 group-hover:flex"
          aria-label="Borrar salón"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Preview del plano ──────────────────────────────────────────────────────

function PlanPreview({
  plan,
  tables,
}: {
  plan: FloorPlanWithTables["plan"];
  tables: FloorPlanWithTables["tables"];
}) {
  const activeTables = tables.filter((t) => t.status === "active");

  // Si tiene imagen de fondo cargada, la mostramos como preview principal —
  // es lo más representativo (el plano "real" del local).
  if (plan.background_image_url) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plan.background_image_url}
          alt={plan.name}
          className="h-full w-full object-cover"
          style={{ opacity: (plan.background_opacity ?? 60) / 100 + 0.4 }}
        />
        {/* Mini overlay con count en la esquina */}
        <div className="absolute bottom-2 left-2 rounded-full bg-zinc-900/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
          {activeTables.length}{" "}
          {activeTables.length === 1 ? "mesa" : "mesas"}
        </div>
      </div>
    );
  }

  // Sin imagen: SVG miniatura con las mesas posicionadas (preview esquemático).
  const w = plan.width || 1000;
  const h = plan.height || 700;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100">
      {activeTables.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-zinc-300">
          <LayoutGrid className="h-12 w-12" />
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
        >
          {activeTables.map((t) => {
            const fill = "#e4e4e7";
            const stroke = "#a1a1aa";
            if (t.shape === "circle") {
              const cx = t.x + t.width / 2;
              const cy = t.y + t.height / 2;
              const r = Math.min(t.width, t.height) / 2;
              return (
                <circle
                  key={t.id}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2}
                />
              );
            }
            return (
              <rect
                key={t.id}
                x={t.x}
                y={t.y}
                width={t.width}
                height={t.height}
                rx={t.shape === "square" ? 8 : 4}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                transform={
                  t.rotation
                    ? `rotate(${t.rotation} ${t.x + t.width / 2} ${t.y + t.height / 2})`
                    : undefined
                }
              />
            );
          })}
        </svg>
      )}
      <div
        className={cn(
          "absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1",
          activeTables.length === 0
            ? "bg-amber-50 text-amber-800 ring-amber-200"
            : "bg-white/95 text-zinc-700 ring-zinc-200",
        )}
      >
        {activeTables.length === 0
          ? "Sin mesas"
          : `${activeTables.length} ${activeTables.length === 1 ? "mesa" : "mesas"}`}
      </div>
    </div>
  );
}

// ─── Dialog "Nuevo salón" ───────────────────────────────────────────────────

function NewSalonDialog({
  slug,
  trigger,
}: {
  slug: string;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Indicá un nombre.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await createFloorPlan(slug, trimmed);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Salón creado.");
      setOpen(false);
      setName("");
      // Vamos directo al editor del salón nuevo.
      router.push(`/${slug}/admin/salones/${r.data.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo salón</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Nombre</label>
          <Input
            autoFocus
            placeholder="ej: Terraza"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <p className="text-muted-foreground text-xs">
            Después podés agregar mesas y subir una foto del plano desde el
            editor.
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={submitting || !name.trim()}>
            {submitting ? "Creando…" : "Crear y editar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
