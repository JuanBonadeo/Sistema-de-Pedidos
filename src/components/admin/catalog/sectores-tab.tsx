"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChefHat, GripVertical, Pencil, Plus, Printer } from "lucide-react";
import { toast } from "sonner";

import { StationDialog } from "@/components/admin/catalog/station-dialog";
import { BrandButton } from "@/components/admin/shell/brand-button";
import type {
  AdminCategory,
  AdminProduct,
  AdminStation,
} from "@/lib/admin/catalog-query";
import { reorderStations } from "@/lib/catalog/station-actions";

type Props = {
  slug: string;
  stations: AdminStation[];
  categories: AdminCategory[];
  products: AdminProduct[];
};

export function SectoresTab({ slug, stations, categories, products }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [order, setOrder] = useState<AdminStation[]>(() =>
    stations.slice().sort((a, b) => a.sort_order - b.sort_order),
  );
  useEffect(() => {
    setOrder(stations.slice().sort((a, b) => a.sort_order - b.sort_order));
  }, [stations]);

  // Cuenta de productos rutados a cada sector. El producto puede tener override
  // propio (`product.station_id`) o heredar del default de su categoría.
  const productCountByStation = useMemo(() => {
    const m = new Map<string, number>();
    const catStation = new Map<string, string | null>();
    for (const c of categories) catStation.set(c.id, c.station_id);
    for (const p of products) {
      const stationId =
        p.station_id ?? (p.category_id ? catStation.get(p.category_id) ?? null : null);
      if (!stationId) continue;
      m.set(stationId, (m.get(stationId) ?? 0) + 1);
    }
    return m;
  }, [products, categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = order.findIndex((s) => s.id === active.id);
    const newIdx = order.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const newOrder = arrayMove(order, oldIdx, newIdx);
    const previous = order;
    setOrder(newOrder);

    startTransition(async () => {
      const r = await reorderStations(
        slug,
        newOrder.map((s) => s.id),
      );
      if (!r.ok) {
        setOrder(previous);
        toast.error(r.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-zinc-500" />
          <h2 className="text-base font-bold text-zinc-900">Sectores de cocina</h2>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">
            {order.length}
          </span>
        </div>
        <StationDialog
          slug={slug}
          defaultSortOrder={order.length}
          trigger={
            <BrandButton size="md" leadingIcon={<Plus />}>
              Nuevo sector
            </BrandButton>
          }
        />
      </header>

      <p className="text-xs text-zinc-500">
        Cada sector recibe su propia comanda en piloto (1 impresora por sector).
        Asigná un sector a cada producto desde el drawer del producto, o uno
        default a la categoría. Arrastrá del{" "}
        <GripVertical className="-mt-0.5 inline h-3 w-3" /> para reordenar.
      </p>

      {order.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center">
          <Printer className="mx-auto h-6 w-6 text-zinc-400" />
          <p className="mt-2 text-sm font-semibold text-zinc-700">Sin sectores</p>
          <p className="mt-1 text-xs text-zinc-500">
            Tocá &quot;Nuevo sector&quot; para crear el primero.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={order.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {order.map((s) => (
                <SortableStationRow
                  key={s.id}
                  slug={slug}
                  station={s}
                  productCount={productCountByStation.get(s.id) ?? 0}
                  pending={pending}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableStationRow({
  slug,
  station,
  productCount,
  pending,
}: {
  slug: string;
  station: AdminStation;
  productCount: number;
  pending: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: station.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-2xl bg-white p-3 ring-1 transition ${
        isDragging ? "shadow-lg ring-emerald-300" : "ring-zinc-200"
      } ${!station.is_active ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="-ml-1 flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500 active:cursor-grabbing"
        aria-label="Arrastrar para reordenar"
        disabled={pending}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          station.is_active ? "bg-zinc-100" : "bg-zinc-50"
        }`}
      >
        <ChefHat
          className={`h-5 w-5 ${
            station.is_active ? "text-zinc-600" : "text-zinc-400"
          }`}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-base font-bold text-zinc-900">
            {station.name}
          </p>
          {!station.is_active && (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
              inactivo
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          {productCount}{" "}
          {productCount === 1 ? "producto rutea" : "productos rutean"} aquí
        </p>
      </div>

      <StationDialog
        slug={slug}
        station={station}
        trigger={
          <button
            type="button"
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
        }
      />
    </li>
  );
}
