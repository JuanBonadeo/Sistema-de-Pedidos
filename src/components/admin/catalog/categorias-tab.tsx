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
import {
  ChevronDown,
  ChevronUp,
  FolderTree,
  GripVertical,
  Layers,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { CategoryDialog } from "@/components/admin/catalog/category-dialog";
import { SuperCategoryDialog } from "@/components/admin/catalog/super-category-dialog";
import { BrandButton } from "@/components/admin/shell/brand-button";
import { SuperCategoryAvatar } from "@/components/super-categories/visual";
import type {
  AdminCategory,
  AdminProduct,
  AdminStation,
  AdminSuperCategory,
} from "@/lib/admin/catalog-query";
import { reorderCategories } from "@/lib/catalog/category-actions";
import { reorderSuperCategories } from "@/lib/catalog/super-category-actions";

type Props = {
  slug: string;
  superCategories: AdminSuperCategory[];
  stations: AdminStation[];
  categories: AdminCategory[];
  products: AdminProduct[];
};

const ORPHAN_KEY = "__orphan__";

export function CategoriasTab({
  slug,
  superCategories,
  stations,
  categories,
  products,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Optimistic local copy del orden de las super y de cada grupo de categorías.
  // Sincronizamos con el server via refresh; sirve para feedback inmediato del
  // drag&drop antes de que vuelva el round-trip.
  const [superOrder, setSuperOrder] = useState<AdminSuperCategory[]>(
    () => superCategories.slice().sort((a, b) => a.sort_order - b.sort_order),
  );
  const [categoryOrders, setCategoryOrders] = useState<Record<string, AdminCategory[]>>(
    () => groupAndSort(categories),
  );

  // Re-sync cuando llegan nuevos datos del server.
  useEffect(() => {
    setSuperOrder(superCategories.slice().sort((a, b) => a.sort_order - b.sort_order));
  }, [superCategories]);
  useEffect(() => {
    setCategoryOrders(groupAndSort(categories));
  }, [categories]);

  // Productos por categoría.
  const productCountByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      if (!p.category_id) continue;
      m.set(p.category_id, (m.get(p.category_id) ?? 0) + 1);
    }
    return m;
  }, [products]);

  const orphanCategories = categoryOrders[ORPHAN_KEY] ?? [];

  // ── Sensors compartidos ──
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Pequeño umbral para que un click en el handle no dispare drag.
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Reorder de supercategorías ──
  const handleSuperDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = superOrder.findIndex((s) => s.id === active.id);
    const newIdx = superOrder.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const newOrder = arrayMove(superOrder, oldIdx, newIdx);
    const previous = superOrder;
    setSuperOrder(newOrder); // optimistic

    startTransition(async () => {
      const r = await reorderSuperCategories(
        slug,
        newOrder.map((s) => s.id),
      );
      if (!r.ok) {
        setSuperOrder(previous); // revert
        toast.error(r.error);
      } else {
        router.refresh();
      }
    });
  };

  // ── Reorder de categorías dentro de un scope (super_category_id | null) ──
  const handleCategoriesDragEnd = (
    superCategoryId: string | null,
    event: DragEndEvent,
  ) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const key = superCategoryId ?? ORPHAN_KEY;
    const list = categoryOrders[key] ?? [];
    const oldIdx = list.findIndex((c) => c.id === active.id);
    const newIdx = list.findIndex((c) => c.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const newList = arrayMove(list, oldIdx, newIdx);
    const previous = categoryOrders;
    setCategoryOrders({ ...categoryOrders, [key]: newList });

    startTransition(async () => {
      const r = await reorderCategories(
        slug,
        superCategoryId,
        newList.map((c) => c.id),
      );
      if (!r.ok) {
        setCategoryOrders(previous);
        toast.error(r.error);
      } else {
        router.refresh();
      }
    });
  };

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* ───────── Sección 1: Supercategorías ───────── */}
      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-500" />
            <h2 className="text-base font-bold text-zinc-900">
              Supercategorías
            </h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">
              {superOrder.length}
            </span>
          </div>
          <SuperCategoryDialog
            slug={slug}
            defaultSortOrder={superOrder.length}
            trigger={
              <BrandButton size="md" leadingIcon={<Plus />}>
                Nueva supercategoría
              </BrandButton>
            }
          />
        </header>

        <p className="text-xs text-zinc-500">
          Agrupan tus categorías en pestañas para el mozo (Entradas /
          Principales / Bebidas / Postres). Arrastrá del{" "}
          <GripVertical className="-mt-0.5 inline h-3 w-3" /> para reordenar.
        </p>

        {superOrder.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-zinc-700">
              Sin supercategorías
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Tocá &quot;Nueva&quot; para crear la primera.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSuperDragEnd}
          >
            <SortableContext
              items={superOrder.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {superOrder.map((sc) => {
                  const cats = categoryOrders[sc.id] ?? [];
                  const totalProducts = cats.reduce(
                    (sum, c) => sum + (productCountByCategory.get(c.id) ?? 0),
                    0,
                  );
                  const isCollapsed = collapsed[sc.id] ?? false;
                  return (
                    <SortableSuperCategoryRow
                      key={sc.id}
                      slug={slug}
                      superCategory={sc}
                      categories={cats}
                      productCountByCategory={productCountByCategory}
                      superCategories={superOrder}
                      stations={stations}
                      totalProducts={totalProducts}
                      isCollapsed={isCollapsed}
                      pending={pending}
                      sensors={sensors}
                      onToggleCollapsed={() => toggleCollapsed(sc.id)}
                      onCategoriesDragEnd={(e) =>
                        handleCategoriesDragEnd(sc.id, e)
                      }
                    />
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {/* ───────── Sección 2: Categorías sin asignar ───────── */}
      {orphanCategories.length > 0 && (
        <section className="space-y-3">
          <header className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-amber-600" />
            <h2 className="text-base font-bold text-zinc-900">Sin asignar</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-800">
              {orphanCategories.length}
            </span>
          </header>
          <p className="text-xs text-zinc-500">
            Estas categorías aparecen en la pestaña &quot;Otros&quot; del mozo.
            Asignales una supercategoría desde el dialog de edición.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleCategoriesDragEnd(null, e)}
          >
            <SortableContext
              items={orphanCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {orphanCategories.map((cat) => (
                  <SortableCategoryRow
                    key={cat.id}
                    slug={slug}
                    category={cat}
                    superCategories={superOrder}
                    stations={stations}
                    productCount={productCountByCategory.get(cat.id) ?? 0}
                    pending={pending}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {/* ───────── Sección 3: Crear categoría suelta ───────── */}
      {superOrder.length > 0 && orphanCategories.length === 0 && (
        <CategoryDialog
          slug={slug}
          superCategories={superOrder}
          stations={stations}
          defaultSortOrder={categories.length}
          trigger={
            <BrandButton
              size="md"
              leadingIcon={<Plus />}
              className="w-full justify-center"
            >
              Nueva categoría
            </BrandButton>
          }
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function groupAndSort(
  categories: AdminCategory[],
): Record<string, AdminCategory[]> {
  const out: Record<string, AdminCategory[]> = {};
  for (const c of categories) {
    const key = c.super_category_id ?? ORPHAN_KEY;
    if (!out[key]) out[key] = [];
    out[key].push(c);
  }
  for (const key of Object.keys(out)) {
    out[key]!.sort((a, b) => a.sort_order - b.sort_order);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Sortable: Super category row con sus categorías hijas
// ─────────────────────────────────────────────────────────────────────────

function SortableSuperCategoryRow({
  slug,
  superCategory,
  categories,
  productCountByCategory,
  superCategories,
  stations,
  totalProducts,
  isCollapsed,
  pending,
  sensors,
  onToggleCollapsed,
  onCategoriesDragEnd,
}: {
  slug: string;
  superCategory: AdminSuperCategory;
  categories: AdminCategory[];
  productCountByCategory: Map<string, number>;
  superCategories: AdminSuperCategory[];
  stations: AdminStation[];
  totalProducts: number;
  isCollapsed: boolean;
  pending: boolean;
  sensors: ReturnType<typeof useSensors>;
  onToggleCollapsed: () => void;
  onCategoriesDragEnd: (event: DragEndEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: superCategory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden rounded-2xl bg-white ring-1 transition ${
        isDragging
          ? "shadow-lg ring-emerald-300"
          : "ring-zinc-200"
      }`}
    >
      <header className="flex items-center gap-2 p-3">
        {/* Drag handle */}
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

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <SuperCategoryAvatar
            icon={superCategory.icon}
            color={superCategory.color}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-zinc-900">
              {superCategory.name}
            </p>
            <p className="text-xs text-zinc-500">
              {categories.length}{" "}
              {categories.length === 1 ? "categoría" : "categorías"} ·{" "}
              {totalProducts}{" "}
              {totalProducts === 1 ? "producto" : "productos"}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label={isCollapsed ? "Expandir" : "Colapsar"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>

        <SuperCategoryDialog
          slug={slug}
          superCategory={superCategory}
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
      </header>

      {!isCollapsed && (
        <div className="border-t border-zinc-100 bg-zinc-50/40 p-3">
          {categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-4 text-center">
              <p className="text-xs text-zinc-500">
                Sin categorías en esta supercategoría todavía.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onCategoriesDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1.5">
                  {categories.map((cat) => (
                    <SortableCategoryRow
                      key={cat.id}
                      slug={slug}
                      category={cat}
                      superCategories={superCategories}
                      stations={stations}
                      productCount={productCountByCategory.get(cat.id) ?? 0}
                      pending={pending}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          <div className="mt-2">
            <CategoryDialog
              slug={slug}
              superCategories={superCategories}
              stations={stations}
              defaultSuperCategoryId={superCategory.id}
              defaultSortOrder={categories.length}
              trigger={
                <BrandButton
                  size="sm"
                  leadingIcon={<Plus />}
                  className="w-full justify-center"
                >
                  Nueva categoría en {superCategory.name}
                </BrandButton>
              }
            />
          </div>
        </div>
      )}
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sortable: Category row
// ─────────────────────────────────────────────────────────────────────────

function SortableCategoryRow({
  slug,
  category,
  superCategories,
  stations,
  productCount,
  pending,
}: {
  slug: string;
  category: AdminCategory;
  superCategories: AdminSuperCategory[];
  stations: AdminStation[];
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
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-xl bg-white p-2.5 ring-1 transition ${
        isDragging ? "shadow-md ring-emerald-300" : "ring-zinc-200"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="-ml-1 flex h-7 w-5 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500 active:cursor-grabbing"
        aria-label="Arrastrar para reordenar"
        disabled={pending}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {category.name}
        </p>
        <p className="text-[11px] text-zinc-500">
          {productCount} {productCount === 1 ? "producto" : "productos"} ·{" "}
          <span className="font-mono text-zinc-400">{category.slug}</span>
        </p>
      </div>

      <CategoryDialog
        slug={slug}
        category={category}
        superCategories={superCategories}
        stations={stations}
        trigger={
          <button
            type="button"
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        }
      />
    </li>
  );
}
