import { notFound } from "next/navigation";

import { OrdersHistorialClient } from "@/components/admin/orders/orders-historial-client";
import { PageShell } from "@/components/admin/shell/page-shell";
import { ensureAdminAccess } from "@/lib/admin/context";
import {
  getOrdersList,
  type OrderListDeliveryType,
  type OrderListPaymentStatus,
  type OrderListRange,
} from "@/lib/admin/orders-query";
import type { OrderStatus } from "@/lib/orders/status";
import { getBusiness } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const VALID_RANGES: OrderListRange[] = ["today", "7d", "30d", "all"];
const VALID_STATUSES: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "on_the_way",
  "delivered",
  "cancelled",
];
const VALID_DELIVERY: OrderListDeliveryType[] = ["all", "delivery", "pickup"];
const VALID_PAYMENT: OrderListPaymentStatus[] = [
  "all",
  "paid",
  "pending",
  "failed",
];

function pickEnum<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  if (!value) return fallback;
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export default async function OrdersHistorialPage({
  params,
  searchParams,
}: {
  params: Promise<{ business_slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();
  await ensureAdminAccess(business.id, business_slug);

  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const range = pickEnum(get("range"), VALID_RANGES, "all");
  const status = pickEnum(get("status"), VALID_STATUSES, "all");
  const deliveryType = pickEnum(get("type"), VALID_DELIVERY, "all");
  const paymentStatus = pickEnum(get("payment"), VALID_PAYMENT, "all");
  const search = (get("q") ?? "").trim();
  const pageRaw = Number(get("page") ?? 1);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const result = await getOrdersList(business.id, business.timezone, {
    range,
    status,
    deliveryType,
    paymentStatus,
    search,
    page,
    limit: 24,
  });

  return (
    <PageShell width="wide" className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Pedidos
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Historial de pedidos
        </h1>
        <p className="text-sm text-zinc-600">
          Buscá, filtrá y revisá todos los pedidos del negocio.
        </p>
      </header>

      <OrdersHistorialClient
        slug={business_slug}
        timezone={business.timezone}
        initialResult={result}
        initialFilters={{
          range,
          status,
          deliveryType,
          paymentStatus,
          search,
        }}
      />
    </PageShell>
  );
}
