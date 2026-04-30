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
  { value: "top", label: "Top" },
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

      {customers.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <ul
          className={cn(
            "divide-border/60 overflow-hidden rounded-2xl bg-white divide-y ring-1 ring-zinc-200/70",
            isPending && "opacity-50 transition-opacity",
          )}
        >
          {customers.map((c) => (
            <CustomerRow key={c.id} customer={c} slug={slug} />
          ))}
        </ul>
      )}

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

function CustomerRow({
  customer,
  slug,
}: {
  customer: CustomerListItem;
  slug: string;
}) {
  const router = useRouter();
  const lastOrder = customer.last_order_at
    ? formatInTimeZone(
        customer.last_order_at,
        "America/Argentina/Buenos_Aires",
        "d MMM yyyy",
        { locale: es },
      )
    : null;
  const primarySegment = customer.segments[0] ?? null;

  return (
    <li>
      <button
        type="button"
        onClick={() =>
          router.push(`/${slug}/admin/clientes/${customer.id}`)
        }
        className="hover:bg-zinc-50/80 flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-zinc-900 truncate text-sm font-semibold">
              {customer.name || "Sin nombre"}
            </p>
            {primarySegment && <SegmentChip segment={primarySegment} />}
          </div>
          <p className="text-zinc-500 truncate text-xs tabular-nums">
            {customer.phone}
            {lastOrder && (
              <span className="text-zinc-400"> · último {lastOrder}</span>
            )}
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-zinc-900 text-base font-bold tabular-nums">
            {formatCurrency(customer.total_spent_cents)}
          </p>
          <p className="text-zinc-500 text-xs tabular-nums">
            {customer.order_count}{" "}
            {customer.order_count === 1 ? "pedido" : "pedidos"}
          </p>
        </div>

        <ChevronRight className="text-zinc-300 size-4 shrink-0" />
      </button>
    </li>
  );
}

export function SegmentChip({ segment }: { segment: CustomerSegment }) {
  const meta = SEGMENT_TONE[segment];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
        meta.tone,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {SEGMENT_LABEL[segment]}
    </span>
  );
}

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
