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
  deleteProduct,
  toggleProductActive,
  toggleProductAvailability,
} from "@/lib/catalog/product-actions";
import type { AdminProduct } from "@/lib/admin/catalog-query";

export function ProductRow({
  slug,
  product,
}: {
  slug: string;
  product: AdminProduct;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [available, setAvailable] = useState(product.is_available);
  const [active, setActive] = useState(product.is_active);

  const toggleAvailable = (value: boolean) => {
    setAvailable(value);
    startTransition(async () => {
      const r = await toggleProductAvailability(slug, product.id, value);
      if (!r.ok) {
        toast.error(r.error);
        setAvailable(!value);
      }
    });
  };

  const toggleActive = (value: boolean) => {
    setActive(value);
    startTransition(async () => {
      const r = await toggleProductActive(slug, product.id, value);
      if (!r.ok) {
        toast.error(r.error);
        setActive(!value);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const r = await deleteProduct(slug, product.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Eliminado.");
      setConfirmOpen(false);
      router.refresh();
    });
  };

  return (
    <li className="bg-card flex items-center gap-3 rounded-xl p-3">
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{product.name}</span>
          {!active && (
            <Badge variant="secondary" className="text-[0.65rem]">
              OCULTO
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {formatCurrency(product.price_cents)}
        </p>
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
          href={`/${slug}/admin/catalogo/productos/${product.id}`}
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
              <DialogTitle>Eliminar &quot;{product.name}&quot;</DialogTitle>
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
