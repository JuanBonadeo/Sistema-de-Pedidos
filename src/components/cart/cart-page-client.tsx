"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CartSummary } from "@/components/cart/cart-summary";
import { formatCurrency } from "@/lib/currency";
import {
  cartItemSubtotal,
  cartTotal,
  useCart,
} from "@/stores/cart";

export function CartPageClient({ slug }: { slug: string }) {
  const items = useCart(slug, (s) => s.items);
  const updateQuantity = useCart(slug, (s) => s.updateQuantity);
  const removeItem = useCart(slug, (s) => s.removeItem);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">Tu carrito está vacío.</p>
        <Link href={`/${slug}/menu`} className={buttonVariants({ size: "lg" })}>
          Ver menú
        </Link>
      </div>
    );
  }

  const subtotalCents = cartTotal(items);

  return (
    <>
      <h2 className="mt-4 text-xl font-bold">Tu carrito</h2>

      <ul className="mt-4 grid gap-3">
        {items.map((item) => {
          const lineSubtotal = cartItemSubtotal(item);
          const modsLabel = item.modifiers
            .map((m) => m.name.toUpperCase())
            .join(", ");
          return (
            <li
              key={item.id}
              className="bg-card flex gap-3 rounded-xl p-3 shadow-[0_1px_3px_rgba(19,27,46,0.04)]"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                {item.image_url && (
                  <Image
                    src={item.image_url}
                    alt={item.product_name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">
                      {item.product_name}
                    </h3>
                    {modsLabel && (
                      <p className="text-muted-foreground mt-0.5 truncate text-xs font-medium tracking-wider">
                        {modsLabel}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs italic">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="Eliminar"
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="bg-muted flex items-center rounded-md">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      className="px-2 py-1"
                      aria-label="Menos"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, Math.min(99, item.quantity + 1))
                      }
                      className="px-2 py-1"
                      aria-label="Más"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-primary font-bold">
                    {formatCurrency(lineSubtotal)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <CartSummary
          subtotalCents={subtotalCents}
          deliveryFeeCents={null}
          deliveryFeeLabel="Ingresá tu dirección"
          totalCents={subtotalCents}
        />
      </div>

      <div className="bg-background fixed inset-x-0 bottom-0 mx-auto max-w-md border-t px-4 py-3">
        <Link
          href={`/${slug}/checkout`}
          className={buttonVariants({ size: "lg" }) + " w-full"}
        >
          Ir a pagar
        </Link>
      </div>
    </>
  );
}
