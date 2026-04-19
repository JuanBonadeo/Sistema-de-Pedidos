"use client";

import Image from "next/image";
import { ImageIcon, ShoppingBag } from "lucide-react";

import { formatCurrency } from "@/lib/currency";

export type PreviewProduct = {
  id: string;
  name: string;
  price_cents: number;
  image_url: string | null;
};

export function MenuPreview({
  businessName,
  logoUrl,
  coverImageUrl,
  primary,
  primaryForeground,
  products,
}: {
  businessName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primary: string;
  primaryForeground: string;
  products: PreviewProduct[];
}) {
  const safePrimary = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primary)
    ? primary
    : "#E11D48";
  const safeFg = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryForeground)
    ? primaryForeground
    : "#FFFFFF";

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
        <span>Preview del menú</span>
        <span className="text-muted-foreground/60 text-[0.65rem] normal-case tracking-normal">
          en vivo
        </span>
      </div>

      {/* Phone frame */}
      <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[2rem] border-4 border-zinc-900 bg-zinc-50 shadow-[0_20px_60px_rgba(19,27,46,0.18)]">
        {/* Status notch */}
        <div className="flex h-6 items-center justify-center bg-zinc-900">
          <div className="h-1.5 w-16 rounded-full bg-zinc-700" />
        </div>

        <div
          className="relative max-h-[640px] overflow-y-auto"
          style={{ background: "#FAF7F0" }}
        >
          {/* Cover */}
          <div className="relative h-32 w-full bg-gradient-to-br from-amber-100 to-orange-200">
            {coverImageUrl ? (
              <Image
                src={coverImageUrl}
                alt={businessName}
                fill
                sizes="320px"
                className="object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center">
                <ImageIcon className="size-8 opacity-50" />
              </div>
            )}
          </div>

          {/* Identity row */}
          <div className="space-y-1.5 border-b border-zinc-200 px-4 py-3">
            <div className="flex items-center gap-2.5">
              {logoUrl && (
                <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-white">
                  <Image
                    src={logoUrl}
                    alt={businessName}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>
              )}
              <h3
                className="truncate text-lg font-black tracking-tight text-zinc-900"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {businessName || "Nombre del negocio"}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[0.65rem] text-zinc-500">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: "#22c55e" }}
              />
              <span>Abierto ahora</span>
              <span className="text-zinc-300">·</span>
              <span>30–45 min</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-zinc-200 px-4">
            <div className="flex gap-4 overflow-hidden text-xs">
              <span
                className="border-b-2 border-zinc-900 py-2.5 font-semibold text-zinc-900"
                style={{ marginBottom: -1 }}
              >
                Destacados
              </span>
              <span className="py-2.5 text-zinc-400">Menú</span>
              <span className="py-2.5 text-zinc-400">Bebidas</span>
            </div>
          </div>

          {/* Products */}
          <div>
            {products.length === 0 ? (
              <PlaceholderRow />
            ) : (
              products.map((p) => <ProductRow key={p.id} product={p} />)
            )}
          </div>

          {/* Cart pill */}
          <div className="sticky bottom-2 mx-3 mt-4 mb-3">
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2.5 shadow-lg"
              style={{ background: safePrimary, color: safeFg }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="flex size-6 items-center justify-center rounded-md text-[0.7rem] font-bold"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  2
                </span>
                <span className="text-xs font-semibold">Ver mi pedido</span>
              </span>
              <span className="text-xs font-bold tabular-nums">
                {formatCurrency(25000)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground text-center text-[0.7rem]">
        Los cambios se aplican sin guardar. Guardá para que los vean los
        clientes.
      </p>
    </div>
  );
}

function ProductRow({ product }: { product: PreviewProduct }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {product.name}
        </p>
        <p className="mt-0.5 text-xs font-bold tabular-nums text-zinc-700">
          {formatCurrency(product.price_cents)}
        </p>
      </div>
      {product.image_url ? (
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
          <ShoppingBag className="size-5" />
        </div>
      )}
    </div>
  );
}

function PlaceholderRow() {
  return (
    <div className="space-y-3 px-4 py-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-zinc-200" />
            <div className="h-2.5 w-1/4 rounded bg-zinc-200" />
          </div>
          <div className="size-14 shrink-0 rounded-lg bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}
