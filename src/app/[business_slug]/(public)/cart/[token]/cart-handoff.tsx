"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCartStore, type CartItem } from "@/stores/cart";

export function CartHandoff({
  slug,
  items,
}: {
  slug: string;
  items: CartItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const useStore = getCartStore(slug);
      // Replace the cart wholesale: zustand exposes setState on the hook.
      useStore.setState({ items });
      router.replace(`/${slug}/carrito`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    }
  }, [slug, items, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 p-6 text-center">
      <div className="size-10 animate-spin rounded-full border-4 border-zinc-300 border-t-primary" />
      <p className="text-sm text-zinc-600">Preparando tu pedido...</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
