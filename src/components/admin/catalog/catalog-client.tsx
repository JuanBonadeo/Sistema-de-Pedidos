"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryDialog } from "@/components/admin/catalog/category-dialog";
import { ProductRow } from "@/components/admin/catalog/product-row";
import type {
  AdminCategory,
  AdminProduct,
} from "@/lib/admin/catalog-query";
import { deleteCategory } from "@/lib/catalog/category-actions";

const UNCATEGORIZED = "__uncat__";

export function CatalogClient({
  slug,
  categories,
  products,
}: {
  slug: string;
  categories: AdminCategory[];
  products: AdminProduct[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [active, setActive] = useState<string>(
    categories[0]?.id ?? UNCATEGORIZED,
  );

  const productsByCategory = useMemo(() => {
    const map: Record<string, AdminProduct[]> = { [UNCATEGORIZED]: [] };
    for (const c of categories) map[c.id] = [];
    for (const p of products) {
      const key = p.category_id ?? UNCATEGORIZED;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [categories, products]);

  const handleDeleteCategory = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const r = await deleteCategory(slug, deleteTarget.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Categoría eliminada.");
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const uncategorized = productsByCategory[UNCATEGORIZED] ?? [];
  const tabs = [
    ...categories.map((c) => ({ id: c.id, name: c.name, category: c })),
    ...(uncategorized.length > 0
      ? [{ id: UNCATEGORIZED, name: "Sin categoría", category: null }]
      : []),
  ];
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];
  const activeProducts = productsByCategory[activeTab?.id ?? ""] ?? [];

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Catálogo</h1>
        <Link
          href={`/${slug}/admin/catalogo/productos/nuevo`}
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="size-3.5" /> Nuevo producto
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Tabs value={active} onValueChange={setActive} className="min-w-0 flex-1">
          <TabsList className="flex w-full overflow-x-auto">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="shrink-0">
                {t.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <CategoryDialog
          slug={slug}
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" /> Categoría
            </Button>
          }
        />
      </div>

      {activeTab?.category && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <CategoryDialog
            slug={slug}
            category={activeTab.category}
            trigger={
              <Button size="xs" variant="ghost">
                <Pencil className="size-3" /> Editar
              </Button>
            }
          />
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setDeleteTarget(activeTab.category)}
          >
            <Trash2 className="size-3" /> Eliminar
          </Button>
        </div>
      )}

      <ul className="mt-4 grid gap-2">
        {activeProducts.length === 0 ? (
          <li className="text-muted-foreground py-8 text-center text-sm italic">
            Sin productos en esta categoría.
          </li>
        ) : (
          activeProducts.map((p) => (
            <ProductRow key={p.id} slug={slug} product={p} />
          ))
        )}
      </ul>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Eliminar categoría &quot;{deleteTarget?.name}&quot;
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Los productos de esta categoría van a quedar sin categoría. No se
            borran.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={pending}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
