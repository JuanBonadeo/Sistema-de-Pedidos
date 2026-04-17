"use client";

import { useMemo, useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MenuCategory, MenuProduct } from "@/lib/menu";

import { CartFab } from "./cart-fab";
import { ProductCard } from "./product-card";
import { ProductSheet } from "./product-sheet";

export function MenuClient({
  slug,
  categories,
}: {
  slug: string;
  categories: MenuCategory[];
}) {
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === active) ?? categories[0],
    [active, categories],
  );

  const handleSelect = (product: MenuProduct) => {
    setSelected(product);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="bg-background sticky top-0 z-10 -mx-4 border-b px-4 pt-2 pb-3">
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="flex w-full overflow-x-auto">
            {categories.map((c) => (
              <TabsTrigger key={c.id} value={c.id} className="shrink-0">
                {c.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <section className="mt-6">
        <h2 className="mb-4 text-xl font-bold">{activeCategory?.name}</h2>
        <div className="grid gap-3">
          {activeCategory?.products.map((p) => (
            <ProductCard key={p.id} product={p} onSelect={handleSelect} />
          ))}
        </div>
      </section>

      <ProductSheet
        slug={slug}
        product={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <CartFab slug={slug} />
    </>
  );
}
