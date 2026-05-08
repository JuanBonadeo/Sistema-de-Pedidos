"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Receipt } from "lucide-react";
import { toast } from "sonner";

import { marcarComandaEntregada } from "@/lib/comandas/actions";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export type ComandaSummary = {
  id: string;
  batch: number;
  status: "pendiente" | "en_preparacion" | "entregado";
  station_name: string;
  emitted_at: string;
  delivered_at: string | null;
  items: { product_name: string; quantity: number }[];
};

export type OrderSummaryData = {
  order_number: number;
  total_cents: number;
  items: { product_name: string; quantity: number; cancelled_at: string | null }[];
  comandas: ComandaSummary[];
};

/**
 * Card compartida entre la vista mozo y la vista admin del salón.
 * Muestra el resumen del pedido (items + total) y las comandas por sector
 * con su estado. Si una comanda está en `en_preparacion`, sale el botón
 * "Entregar" para que el mozo / admin la marque al levantar el plato.
 *
 * `pendiente` = todavía no se imprimió (cocina no la recibió). No se puede
 * entregar algo que cocina ni siquiera empezó. La transición pendiente →
 * en_preparacion la disparará la impresora térmica (Bloque 4b).
 */
export function OrderSummaryCard({
  order,
  slug,
}: {
  order: OrderSummaryData;
  slug: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const active = order.items.filter((it) => it.cancelled_at === null);
  const cancelled = order.items.filter((it) => it.cancelled_at !== null);
  const totalQty = active.reduce((acc, it) => acc + it.quantity, 0);

  const handleMarcarEntregada = (comandaId: string) => {
    startTransition(async () => {
      const r = await marcarComandaEntregada(comandaId, slug);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Comanda entregada");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Resumen de items + total */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Orden #{order.order_number}
          </p>
          <p className="inline-flex items-center gap-1.5 text-lg font-bold tabular-nums text-zinc-900">
            <Receipt className="h-4 w-4" />
            {formatCurrency(order.total_cents)}
          </p>
        </div>
        {active.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {active.map((it, i) => (
              <li
                key={`a-${i}`}
                className="flex items-center gap-2 text-sm text-zinc-800"
              >
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold tabular-nums text-zinc-700 ring-1 ring-zinc-200">
                  {it.quantity}
                </span>
                <span className="flex-1 truncate">{it.product_name}</span>
              </li>
            ))}
            {cancelled.length > 0 &&
              cancelled.map((it, i) => (
                <li
                  key={`c-${i}`}
                  className="flex items-center gap-2 text-xs text-zinc-400 line-through"
                >
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold tabular-nums">
                    {it.quantity}
                  </span>
                  <span className="flex-1 truncate">{it.product_name}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            Sin items cargados todavía.
          </p>
        )}
        {active.length > 0 && (
          <p className="mt-3 border-t border-emerald-100 pt-2 text-[11px] text-zinc-500 tabular-nums">
            {totalQty} items · {active.length}{" "}
            {active.length === 1 ? "producto" : "productos"}
          </p>
        )}
      </div>

      {/* Comandas por sector con su estado */}
      {order.comandas.length > 0 && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Cocina · {order.comandas.length}{" "}
            {order.comandas.length === 1 ? "comanda" : "comandas"}
          </p>
          <ul className="mt-2 space-y-1.5">
            {order.comandas
              .slice()
              .sort((a, b) =>
                a.batch === b.batch
                  ? a.station_name.localeCompare(b.station_name)
                  : a.batch - b.batch,
              )
              .map((c) => (
                <ComandaRow
                  key={c.id}
                  comanda={c}
                  onMarcarEntregada={() => handleMarcarEntregada(c.id)}
                />
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ComandaRow({
  comanda,
  onMarcarEntregada,
}: {
  comanda: ComandaSummary;
  onMarcarEntregada: () => void;
}) {
  const statusLabel: Record<ComandaSummary["status"], string> = {
    pendiente: "Pendiente",
    en_preparacion: "En preparación",
    entregado: "Entregada",
  };
  const statusClass: Record<ComandaSummary["status"], string> = {
    pendiente: "bg-zinc-100 text-zinc-700",
    en_preparacion: "bg-sky-100 text-sky-800",
    entregado: "bg-emerald-100 text-emerald-800",
  };
  const dotClass: Record<ComandaSummary["status"], string> = {
    pendiente: "bg-zinc-400",
    en_preparacion: "bg-sky-500",
    entregado: "bg-emerald-500",
  };
  const itemsLine =
    comanda.items.length === 0
      ? null
      : comanda.items
          .slice(0, 4)
          .map((it) => `${it.quantity}× ${it.product_name}`)
          .join(" · ");
  const hasMore = comanda.items.length > 4;

  // Solo se puede entregar desde en_preparacion (cocina ya la recibió).
  const canDeliver = comanda.status === "en_preparacion";

  return (
    <li className="rounded-xl bg-zinc-50 px-3 py-2">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-zinc-900">
              {comanda.station_name}
            </span>
            <span className="text-[11px] text-zinc-500 tabular-nums">
              · Tanda {comanda.batch}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                statusClass[comanda.status],
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  dotClass[comanda.status],
                )}
              />
              {statusLabel[comanda.status]}
            </span>
          </div>
          {itemsLine && (
            <p className="mt-0.5 truncate text-[11px] text-zinc-600">
              {itemsLine}
              {hasMore && (
                <span className="ml-1 text-zinc-400">
                  +{comanda.items.length - 4} más
                </span>
              )}
            </p>
          )}
        </div>
        {canDeliver && (
          <button
            type="button"
            onClick={onMarcarEntregada}
            className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95 hover:bg-emerald-700"
          >
            <Check className="h-3.5 w-3.5" />
            Entregar
          </button>
        )}
      </div>
    </li>
  );
}
