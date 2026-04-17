"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartModifier = {
  modifier_id: string;
  group_id: string;
  name: string;
  price_delta_cents: number;
};

export type CartItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
  modifiers: CartModifier[];
};

export type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

type CartStoreHook = ReturnType<typeof createCartStore>;

const storeCache = new Map<string, CartStoreHook>();

function createCartStore(slug: string) {
  return create<CartState>()(
    persist(
      (set) => ({
        items: [],
        addItem: (item) => set((s) => ({ items: [...s.items, item] })),
        updateQuantity: (id, qty) =>
          set((s) => ({
            items: s.items
              .map((i) => (i.id === id ? { ...i, quantity: qty } : i))
              .filter((i) => i.quantity > 0),
          })),
        removeItem: (id) =>
          set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
        clear: () => set({ items: [] }),
      }),
      {
        name: `cart:${slug}`,
        storage: createJSONStorage(() => localStorage),
      },
    ),
  );
}

export function getCartStore(slug: string): CartStoreHook {
  let existing = storeCache.get(slug);
  if (!existing) {
    existing = createCartStore(slug);
    storeCache.set(slug, existing);
  }
  return existing;
}

export function useCart<T>(slug: string, selector: (s: CartState) => T): T {
  const useStore = getCartStore(slug);
  return useStore(selector);
}

export function cartItemSubtotal(item: CartItem): number {
  const modsTotal = item.modifiers.reduce(
    (acc, m) => acc + m.price_delta_cents,
    0,
  );
  return (item.unit_price_cents + modsTotal) * item.quantity;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + cartItemSubtotal(i), 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.quantity, 0);
}
