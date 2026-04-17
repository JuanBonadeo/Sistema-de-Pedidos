"use client";

import Link from "next/link";

import { formatCurrency } from "@/lib/currency";
import { cartCount, cartTotal, useCart } from "@/stores/cart";

export function CartFab({ slug }: { slug: string }) {
  const items = useCart(slug, (s) => s.items);
  const count = cartCount(items);
  if (count === 0) return null;
  return (
    <Link
      href={`/${slug}/carrito`}
      className="bg-primary text-primary-foreground fixed inset-x-4 bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(19,27,46,0.12)] transition active:scale-[0.99]"
    >
      <span className="bg-primary-foreground/20 flex size-8 items-center justify-center rounded-md text-sm font-semibold">
        {count}
      </span>
      <span className="flex-1 text-center font-semibold uppercase tracking-wide">
        Ver carrito
      </span>
      <span className="font-bold">{formatCurrency(cartTotal(items))}</span>
    </Link>
  );
}
