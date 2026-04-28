"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
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
  CustomerListItem,
  CustomerListResult,
  CustomerListSort,
} from "@/lib/admin/customers-query";
import { formatCurrency } from "@/lib/currency";
import {
  SEGMENT_LABEL,
  SEGMENT_TONE,
  type CustomerSegment,
} from "@/lib/customers/segments";
import { cn } from "@/lib/utils";

type Filters = {
  segment: CustomerSegment | "all";
  sort: CustomerListSort;
  search: string;
};

const SEGMENT_OPTIONS: { value: CustomerSegment | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Nuevos" },
  { value: "frequent", label: "Frecuentes" },
  { value: "top", label: "Top spenders" },
  { value: "inactive", label: "Inactivos" },
  { value: "lost", label: "Perdidos" },
  { value: "regular", label: "Regulares" },
];

const SORT_OPTIONS: { value: CustomerListSort; label: string }[] = [
  { value: "spent", label: "Mayor gasto" },
  { value: "orders", label: "Más pedidos" },
  { value: "recent", label: "Pedido reciente" },
  { value: "name", label: "Alfabético" },
];

export function CustomersListClient({
  slug,
  initialResult,
  initialFilters,
}: {
  slug: string;
  initialResult: CustomerListResult;
  initialFilters: Filters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(initialFilters.search);
  useEffect(() => setSearchInput(initialFilters.search), [initialFilters.search]);

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
    // Defaults that we don't surface in the URL
    const isDefault =
      value === null ||
      value === "" ||
      (key === "segment" && value === "all") ||
      (key === "sort" && value === "spent");
    if (isDefault) {
      params.delete(key);
    } else {
      params.set(key, value!);
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
    startTransition(() => router.push("?"));
  };

  const hasActiveFilters =
    initialFilters.segment !== "all" ||
    initialFilters.sort !== "spent" ||
    initialFilters.search.length > 0;

  const { customers, total, page, pageCount } = initialResult;

  return (
    <div className="space-y-4">
      {/* ── Top: search + sort + clear (single floating pill) ─────────── */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-full bg-white pl-4 pr-2 py-1.5",
          "ring-1 ring-zinc-200/70 shadow-sm transition",
          "focus-within:ring-2 focus-within:ring-zinc-900/15",
        )}
      >
        <Search className="size-4 shrink-0 text-zinc-400" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email…"
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

        <div className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />

        {/* Sort dropdown */}
        <Select
          value={initialFilters.sort}
          onValueChange={(v) => updateParam("sort", v)}
        >
          <SelectTrigger
            className={cn(
              "h-auto gap-1.5 rounded-full border-0 bg-transparent px-2.5 py-1.5 text-xs font-medium text-zinc-600",
              "shadow-none ring-0 hover:bg-zinc-100 hover:text-zinc-900 focus:ring-0 focus-visible:ring-0",
            )}
          >
            <ArrowUpDown className="size-3.5 text-zinc-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      {/* ── Segment pills + result count ──────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills
          value={initialFilters.segment}
          onChange={(v) => updateParam("segment", v, { resetPage: true })}
          options={SEGMENT_OPTIONS}
        />
        <p className="shrink-0 text-xs text-zinc-500 tabular-nums">
          {isPending
            ? "Cargando…"
            : total === 0
              ? "Sin clientes"
              : total === 1
                ? "1 cliente"
                : `${total.toLocaleString("es-AR")} clientes`}
          {pageCount > 1 && ` · pág ${page}/${pageCount}`}
        </p>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      {customers.length === 0 ? (
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
                  <Th>Cliente</Th>
                  <Th className="w-24 text-right">Pedidos</Th>
                  <Th className="w-36 text-right">Total gastado</Th>
                  <Th className="w-32 text-right">Ticket prom.</Th>
                  <Th className="w-36">Último pedido</Th>
                  <Th className="w-56">Segmentos</Th>
                  <Th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <CustomerRow
                    key={c.id}
                    customer={c}
                    slug={slug}
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

// ─── Table cells ──────────────────────────────────────────────────────────────

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

function CustomerRow({
  customer,
  slug,
  striped,
}: {
  customer: CustomerListItem;
  slug: string;
  striped: boolean;
}) {
  const initials = getInitials(customer.name ?? customer.phone);
  const lastOrder = customer.last_order_at
    ? formatInTimeZone(customer.last_order_at, "America/Argentina/Buenos_Aires", "d MMM yyyy", { locale: es })
    : "—";

  const rowStyle: React.CSSProperties = striped
    ? { background: "color-mix(in oklch, var(--brand, #2563eb) 14%, white)" }
    : {};

  return (
    <tr
      onClick={() =>
        (window.location.href = `/${slug}/admin/clientes/${customer.id}`)
      }
      style={rowStyle}
      className={cn(
        "cursor-pointer border-b border-zinc-100 transition-colors last:border-b-0",
        "hover:bg-zinc-100/60",
      )}
    >
      {/* Cliente */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-black/10"
            style={{
              background: "var(--brand, #2563eb)",
              color: "var(--brand-foreground, white)",
            }}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-zinc-900">
              {customer.name || "Sin nombre"}
            </p>
            <p className="truncate text-xs text-zinc-500">{customer.phone}</p>
          </div>
        </div>
      </td>

      {/* Pedidos */}
      <td className="px-4 py-3 text-right text-sm tabular-nums text-zinc-700">
        {customer.order_count}
      </td>

      {/* Total gastado */}
      <td className="px-4 py-3 text-right text-base font-semibold text-zinc-900 tabular-nums">
        {formatCurrency(customer.total_spent_cents)}
      </td>

      {/* Ticket promedio */}
      <td className="px-4 py-3 text-right text-sm text-zinc-600 tabular-nums">
        {customer.order_count > 0
          ? formatCurrency(customer.avg_ticket_cents)
          : "—"}
      </td>

      {/* Último pedido */}
      <td className="px-4 py-3 text-sm text-zinc-600">{lastOrder}</td>

      {/* Segmentos */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {customer.segments.map((s) => (
            <SegmentChip key={s} segment={s} />
          ))}
        </div>
      </td>

      {/* Arrow */}
      <td className="px-4 py-3 text-right">
        <ChevronRight className="ml-auto size-4 text-zinc-300" />
      </td>
    </tr>
  );
}

export function SegmentChip({ segment }: { segment: CustomerSegment }) {
  const meta = SEGMENT_TONE[segment];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
        meta.tone,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {SEGMENT_LABEL[segment]}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-12 text-center ring-1 ring-zinc-200/70">
      <Users className="size-8 text-zinc-300" strokeWidth={1.5} />
      <p className="text-sm font-medium text-zinc-700">
        {hasFilters
          ? "No hay clientes que coincidan con esos filtros"
          : "Todavía no tenés clientes registrados"}
      </p>
      <p className="max-w-xs text-xs text-zinc-500">
        {hasFilters
          ? "Probá limpiando los filtros o cambiando el segmento."
          : "Cuando alguien haga su primer pedido lo vas a ver acá."}
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(s: string): string {
  return (
    s
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
