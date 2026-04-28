"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  Bike,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ListFilter,
  Search,
  ShoppingBag,
  Tag,
  Wallet,
  X,
} from "lucide-react";

import { FilterPills } from "@/components/admin/filters/filter-pills";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AdminOrder,
  OrderListDeliveryType,
  OrderListPaymentStatus,
  OrderListRange,
  OrderListResult,
} from "@/lib/admin/orders-query";
import { formatCurrency } from "@/lib/currency";
import type { OrderStatus } from "@/lib/orders/status";
import { STATUS_META } from "@/lib/orders/status-meta";
import { cn } from "@/lib/utils";

type Filters = {
  range: OrderListRange;
  status: OrderStatus | "all";
  deliveryType: OrderListDeliveryType;
  paymentStatus: OrderListPaymentStatus;
  search: string;
};

const RANGE_OPTIONS: { value: OrderListRange; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
];

const STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "preparing", label: "En cocina" },
  { value: "ready", label: "Listo" },
  { value: "on_the_way", label: "En camino" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

const DELIVERY_OPTIONS: { value: OrderListDeliveryType; label: string }[] = [
  { value: "all", label: "Delivery + Retiro" },
  { value: "delivery", label: "Solo delivery" },
  { value: "pickup", label: "Solo retiro" },
];

const PAYMENT_OPTIONS: { value: OrderListPaymentStatus; label: string }[] = [
  { value: "all", label: "Pagos: todos" },
  { value: "paid", label: "Pagados" },
  { value: "pending", label: "Pendientes" },
  { value: "failed", label: "Fallidos" },
];

export function OrdersHistorialClient({
  slug,
  timezone,
  initialResult,
  initialFilters,
}: {
  slug: string;
  timezone: string;
  initialResult: OrderListResult;
  initialFilters: Filters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local search input (debounced into URL)
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  useEffect(() => {
    setSearchInput(initialFilters.search);
  }, [initialFilters.search]);

  // Debounce search → URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== initialFilters.search) {
        updateParam("q", searchInput || null, { resetPage: true });
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const updateParam = (
    key: string,
    value: string | null,
    opts: { resetPage?: boolean } = {},
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || value === "all") {
      // Don't pollute URL with default values ("all" is the default for every filter)
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (opts.resetPage) params.delete("page");
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `?${qs}` : `?`);
    });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `?${qs}` : `?`);
    });
  };

  const resetAll = () => {
    setSearchInput("");
    startTransition(() => {
      router.push("?");
    });
  };

  const hasActiveFilters =
    initialFilters.range !== "all" ||
    initialFilters.status !== "all" ||
    initialFilters.deliveryType !== "all" ||
    initialFilters.paymentStatus !== "all" ||
    initialFilters.search.length > 0;

  const { orders, total, page, pageCount } = initialResult;

  return (
    <div className="space-y-4">
      {/* ── Top: search + secondary dropdowns + clear ─────────────────── */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-1 rounded-full bg-white pl-4 pr-2 py-1.5",
          "ring-1 ring-zinc-200/70 shadow-sm transition",
          "focus-within:ring-2 focus-within:ring-zinc-900/15",
        )}
      >
        <Search className="size-4 shrink-0 text-zinc-400" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar nombre, teléfono o #N°…"
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3.5" />
          </button>
        )}

        <div className="mx-1 hidden h-5 w-px bg-zinc-200 sm:block" aria-hidden />

        <CompactSelect
          icon={<ListFilter className="size-3.5 text-zinc-400" />}
          value={initialFilters.status}
          options={STATUS_OPTIONS}
          onChange={(v) => updateParam("status", v, { resetPage: true })}
        />
        <CompactSelect
          icon={<Tag className="size-3.5 text-zinc-400" />}
          value={initialFilters.deliveryType}
          options={DELIVERY_OPTIONS}
          onChange={(v) => updateParam("type", v, { resetPage: true })}
        />
        <CompactSelect
          icon={<CreditCard className="size-3.5 text-zinc-400" />}
          value={initialFilters.paymentStatus}
          options={PAYMENT_OPTIONS}
          onChange={(v) => updateParam("payment", v, { resetPage: true })}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAll}
            title="Limpiar filtros"
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-3" /> Limpiar
          </button>
        )}
      </div>

      {/* ── Range pills + result count ────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills
          value={initialFilters.range}
          onChange={(v) => updateParam("range", v, { resetPage: true })}
          options={RANGE_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
            icon: <Calendar className="size-3.5" />,
          }))}
        />
        <p className="shrink-0 text-xs text-zinc-500 tabular-nums">
          {isPending
            ? "Cargando…"
            : total === 0
              ? "Sin resultados"
              : total === 1
                ? "1 pedido"
                : `${total.toLocaleString("es-AR")} pedidos`}
          {pageCount > 1 && ` · pág ${page}/${pageCount}`}
        </p>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <div
          className={cn(
            "overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70",
            isPending && "opacity-50 transition-opacity",
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-base">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <Th className="w-20">#</Th>
                  <Th className="w-36">Fecha</Th>
                  <Th>Cliente</Th>
                  <Th className="w-24">Tipo</Th>
                  <Th>Items</Th>
                  <Th className="w-36">Estado</Th>
                  <Th className="w-36">Pago</Th>
                  <Th className="w-32 text-right">Total</Th>
                  <Th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    slug={slug}
                    timezone={timezone}
                    striped={idx % 2 === 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || isPending}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" /> Anterior
          </button>
          <span className="text-xs text-zinc-500">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pageCount || isPending}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Table header cell ───────────────────────────────────────────────────────

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500",
        className,
      )}
    >
      {children}
    </th>
  );
}

// ─── Order row (entire row clickable) ─────────────────────────────────────────

function OrderRow({
  order,
  slug,
  timezone,
  striped,
}: {
  order: AdminOrder;
  slug: string;
  timezone: string;
  striped: boolean;
}) {
  const meta = STATUS_META[order.status];
  const isMp = order.payment_method === "mp";
  const dateLabel = formatInTimeZone(
    order.created_at,
    timezone,
    "d MMM · HH:mm",
  );
  const itemsSummary =
    order.items.length === 0
      ? "—"
      : order.items
          .slice(0, 2)
          .map((i) => `${i.quantity}× ${i.product_name}`)
          .join(", ") + (order.items.length > 2 ? `, +${order.items.length - 2}` : "");

  // Row background: alternates white / brand-tinted.
  // We use `oklch` instead of the global --brand-soft (which mixes in srgb at 8%
  // and ends up looking gray when the primary is desaturated like navy/slate).
  // oklch preserves the perceived hue, so the tint actually looks like the brand.
  const rowStyle: React.CSSProperties = striped
    ? {
        background:
          "color-mix(in oklch, var(--brand, #2563eb) 14%, white)",
      }
    : {};

  return (
    <tr
      onClick={() =>
        (window.location.href = `/${slug}/admin/pedidos/${order.id}`)
      }
      style={rowStyle}
      className={cn(
        "cursor-pointer border-b border-zinc-100 transition-colors last:border-b-0",
        "hover:bg-zinc-100/60",
      )}
    >
      {/* # */}
      <td className="px-4 py-3">
        <Link
          href={`/${slug}/admin/pedidos/${order.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-base font-semibold text-zinc-900 hover:underline"
        >
          #{order.order_number}
        </Link>
      </td>

      {/* Fecha */}
      <td className="px-4 py-3 text-sm text-zinc-600 tabular-nums">
        {dateLabel}
      </td>

      {/* Cliente */}
      <td className="px-4 py-3">
        <p className="truncate text-base font-medium text-zinc-900">
          {order.customer_name || "—"}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {order.customer_phone}
        </p>
      </td>

      {/* Tipo */}
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1.5 text-sm text-zinc-700"
          title={order.delivery_type === "delivery" ? "Delivery" : "Retiro"}
        >
          {order.delivery_type === "delivery" ? (
            <>
              <Bike className="size-4 text-zinc-400" strokeWidth={1.75} />
              Envío
            </>
          ) : (
            <>
              <ShoppingBag className="size-4 text-zinc-400" strokeWidth={1.75} />
              Retiro
            </>
          )}
        </span>
      </td>

      {/* Items */}
      <td className="max-w-[320px] px-4 py-3">
        <p className="truncate text-sm text-zinc-700">{itemsSummary}</p>
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            meta.tone,
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
      </td>

      {/* Pago */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-zinc-700">
          {isMp ? (
            <CreditCard className="size-4 text-zinc-400" />
          ) : (
            <Wallet className="size-4 text-zinc-400" />
          )}
          {isMp ? "MP" : "Efectivo"}
          <PaymentDot status={order.payment_status} />
        </span>
      </td>

      {/* Total */}
      <td className="px-4 py-3 text-right text-base font-semibold text-zinc-900 tabular-nums">
        {formatCurrency(order.total_cents)}
      </td>

      {/* Arrow */}
      <td className="px-4 py-3 text-right">
        <ChevronRight className="ml-auto size-4 text-zinc-300" />
      </td>
    </tr>
  );
}

function PaymentDot({ status }: { status: string }) {
  const map: Record<string, { color: string; title: string }> = {
    paid: { color: "bg-emerald-500", title: "Pagado" },
    pending: { color: "bg-amber-500", title: "Pago pendiente" },
    failed: { color: "bg-rose-500", title: "Pago fallido" },
    refunded: { color: "bg-zinc-400", title: "Reembolsado" },
  };
  const meta = map[status];
  if (!meta) return null;
  return (
    <span
      title={meta.title}
      aria-label={meta.title}
      className={cn("ml-0.5 size-1.5 rounded-full", meta.color)}
    />
  );
}

// ─── Compact select (lives inside the pill-shaped filter bar) ────────────────

function CompactSelect<T extends string>({
  value,
  onChange,
  options,
  icon,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  icon?: React.ReactNode;
}) {
  // When set to "all", the select shows a neutral label so the bar feels calm.
  // When set to a non-default, it pops with the chosen value visible.
  const active = value !== "all";
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger
        className={cn(
          "h-auto gap-1.5 rounded-full border-0 bg-transparent px-2.5 py-1.5 text-xs font-medium",
          "shadow-none ring-0 hover:bg-zinc-100 focus:ring-0 focus-visible:ring-0",
          active ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900",
        )}
      >
        {icon}
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-12 text-center ring-1 ring-zinc-200/70">
      <ShoppingBag className="size-8 text-zinc-300" strokeWidth={1.5} />
      <p className="text-sm font-medium text-zinc-700">
        {hasFilters
          ? "No hay pedidos que coincidan con esos filtros"
          : "Todavía no hay pedidos"}
      </p>
      <p className="max-w-xs text-xs text-zinc-500">
        {hasFilters
          ? "Probá ampliando el rango de fechas o limpiando los filtros."
          : "Cuando entren pedidos los vas a ver acá."}
      </p>
    </div>
  );
}
