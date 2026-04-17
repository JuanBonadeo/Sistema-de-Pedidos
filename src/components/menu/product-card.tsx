import Image from "next/image";
import { Plus } from "lucide-react";

import { formatCurrency } from "@/lib/currency";
import type { MenuProduct } from "@/lib/menu";

export function ProductCard({
  product,
  onSelect,
}: {
  product: MenuProduct;
  onSelect: (product: MenuProduct) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => product.is_available && onSelect(product)}
      disabled={!product.is_available}
      className="bg-card flex w-full items-center gap-3 rounded-xl p-3 text-left shadow-[0_1px_3px_rgba(19,27,46,0.04)] transition active:scale-[0.99] disabled:opacity-60"
    >
      <div className="min-w-0 flex-1">
        <h3 className="text-foreground truncate font-semibold">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
            {product.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span className="font-semibold">
            {formatCurrency(product.price_cents)}
          </span>
          {!product.is_available && (
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
              No disponible
            </span>
          )}
        </div>
      </div>
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
        {product.is_available && (
          <span
            aria-hidden
            className="bg-primary text-primary-foreground absolute right-1 bottom-1 flex size-7 items-center justify-center rounded-md"
          >
            <Plus className="size-4" />
          </span>
        )}
      </div>
    </button>
  );
}
