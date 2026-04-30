"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { ProductForm } from "@/components/admin/catalog/product-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { AdminCategory, AdminProduct } from "@/lib/admin/catalog-query";
import { deleteProduct } from "@/lib/catalog/product-actions";

export function ProductDetailSheet({
  open,
  onOpenChange,
  slug,
  businessId,
  product,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  businessId: string;
  product: AdminProduct;
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const formId = `product-form-${product.id}`;

  const handleDelete = () => {
    startTransition(async () => {
      const r = await deleteProduct(slug, product.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(
        r.data.soft_deleted
          ? "Archivado. El producto tenía pedidos, se desactivó."
          : "Eliminado.",
      );
      setConfirmDelete(false);
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        >
          <header className="border-border/60 flex items-center justify-between border-b px-5 py-4">
            <div className="min-w-0">
              <p className="text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wider">
                Editando producto
              </p>
              <p className="text-foreground truncate text-sm font-semibold">
                {product.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="hover:bg-muted -mr-2 inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <SheetTitle className="sr-only">Editar {product.name}</SheetTitle>
            <ProductForm
              slug={slug}
              businessId={businessId}
              categories={categories}
              product={product}
              formId={formId}
              hideActions
              onSuccess={() => onOpenChange(false)}
            />
          </div>

          <footer className="border-border/60 flex items-center gap-2 border-t px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-rose-700 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
            >
              <Trash2 className="size-3.5" />
              Eliminar
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" form={formId} size="sm">
                Guardar cambios
              </Button>
            </div>
          </footer>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar &quot;{product.name}&quot;</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Si tiene pedidos asociados se archiva (no aparece en el menú pero el
            historial lo conserva). Si no, se elimina definitivamente.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
