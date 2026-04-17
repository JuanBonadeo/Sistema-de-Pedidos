"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AdminOrder } from "@/lib/admin/orders-query";
import type { OrderStatus } from "@/lib/orders/status";
import { updateOrderStatus } from "@/lib/orders/update-status";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import { OrderCard } from "./order-card";

type Column = {
  key: string;
  label: string;
  statuses: OrderStatus[];
};

const COLUMNS: Column[] = [
  { key: "new", label: "Nuevos", statuses: ["pending", "confirmed"] },
  { key: "preparing", label: "Preparando", statuses: ["preparing"] },
  { key: "ready", label: "Listos", statuses: ["ready"] },
  { key: "on_the_way", label: "En camino", statuses: ["on_the_way"] },
  { key: "delivered", label: "Entregados", statuses: ["delivered"] },
];

function playBeep(): void {
  try {
    type AudioContextConstructor = new () => AudioContext;
    const Ctx: AudioContextConstructor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextConstructor })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // fail silently — sound is not critical
  }
}

export function OrdersRealtimeBoard({
  businessId,
  slug,
  timezone,
  initialOrders,
}: {
  businessId: string;
  slug: string;
  timezone: string;
  initialOrders: AdminOrder[];
}) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [newlyArrived, setNewlyArrived] = useState<Set<string>>(new Set());
  const [soundUnlocked, setSoundUnlocked] = useState(false);

  // Keep a ref for realtime handler (avoids stale closure).
  const soundUnlockedRef = useRef(soundUnlocked);
  soundUnlockedRef.current = soundUnlocked;

  const fetchOrder = useCallback(
    async (orderId: string): Promise<AdminOrder | null> => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("orders")
        .select(
          "id, order_number, created_at, customer_name, customer_phone, delivery_type, total_cents, status, cancelled_reason, order_items(product_name, quantity)",
        )
        .eq("id", orderId)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        order_number: data.order_number,
        created_at: data.created_at,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        delivery_type: data.delivery_type as "delivery" | "pickup",
        total_cents: Number(data.total_cents),
        status: data.status as OrderStatus,
        cancelled_reason: data.cancelled_reason,
        items: (data.order_items ?? []).map((i) => ({
          product_name: i.product_name,
          quantity: i.quantity,
        })),
      };
    },
    [],
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // Ensure the realtime socket authenticates with the current session,
      // otherwise subscriptions register as anon and RLS hides events.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`orders:${businessId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `business_id=eq.${businessId}`,
          },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              const id = (payload.new as { id: string }).id;
              const full = await fetchOrder(id);
              if (!full) return;
              setOrders((prev) => [full, ...prev.filter((o) => o.id !== id)]);
              setNewlyArrived((prev) => new Set(prev).add(id));
              setTimeout(() => {
                setNewlyArrived((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }, 4000);
              if (soundUnlockedRef.current) playBeep();
            } else if (payload.eventType === "UPDATE") {
              const id = (payload.new as { id: string }).id;
              const full = await fetchOrder(id);
              if (!full) return;
              setOrders((prev) =>
                prev.map((o) => (o.id === id ? full : o)),
              );
            }
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [businessId, fetchOrder]);

  const handleAdvance = useCallback(
    async (order: AdminOrder, next: OrderStatus) => {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)),
      );
      const result = await updateOrderStatus({
        order_id: order.id,
        business_slug: slug,
        next_status: next,
      });
      if (!result.ok) {
        toast.error(result.error);
        // revert
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: order.status } : o,
          ),
        );
      }
    },
    [slug],
  );

  const unlockSound = () => {
    playBeep();
    setSoundUnlocked(true);
  };

  const byColumn = useMemo(() => {
    const groups: Record<string, AdminOrder[]> = {};
    for (const col of COLUMNS) groups[col.key] = [];
    for (const order of orders) {
      const col = COLUMNS.find((c) => c.statuses.includes(order.status));
      if (col) groups[col.key].push(order);
    }
    // Cap delivered column to the most recent 20
    groups["delivered"] = groups["delivered"].slice(0, 20);
    return groups;
  }, [orders]);

  const activeCount = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">
          {activeCount} pedido{activeCount === 1 ? "" : "s"} activos
        </p>
        {!soundUnlocked && (
          <Button size="sm" variant="outline" onClick={unlockSound}>
            <Bell className="size-4" />
            Activar sonido
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {COLUMNS.map((col) => (
          <section
            key={col.key}
            className="flex min-w-0 flex-col gap-3"
          >
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              {col.label}{" "}
              <span className="text-foreground">
                ({byColumn[col.key].length})
              </span>
            </h2>
            <div className="grid gap-3">
              {byColumn[col.key].map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  slug={slug}
                  timezone={timezone}
                  onAdvance={handleAdvance}
                  isNew={newlyArrived.has(order.id)}
                />
              ))}
              {byColumn[col.key].length === 0 && (
                <p className="text-muted-foreground text-xs italic">—</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
