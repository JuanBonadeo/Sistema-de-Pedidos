"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Ban, Scissors, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import type { BusinessRole } from "@/lib/admin/context";
import {
  aplicarPropinaYDescuento,
  cancelarItemEnCuenta,
  dividirPorItems,
  dividirPorPersonas,
  limpiarDivision,
} from "@/lib/billing/cuenta-actions";
import type { CuentaState } from "@/lib/billing/types";
import { formatCurrency } from "@/lib/currency";
import { canApplyDiscount, canCancelItem } from "@/lib/permissions/can";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const TIP_PRESETS = [0, 5, 10, 15];

type Props = {
  slug: string;
  tableId: string;
  tableLabel: string;
  role: BusinessRole;
  cuenta: CuentaState;
};

export function CuentaClient({ slug, tableId, tableLabel, role, cuenta }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const subtotal = cuenta.totals.subtotal_cents;

  const [tipPercent, setTipPercent] = useState<number | "custom">(
    cuenta.order.tip_cents === 0 ? 0 : "custom",
  );
  const [tipCustomCents, setTipCustomCents] = useState(cuenta.order.tip_cents);
  const tipCents = tipPercent === "custom" ? tipCustomCents : Math.round((subtotal * tipPercent) / 100);

  const [discountPercent, setDiscountPercent] = useState(
    subtotal === 0 ? 0 : Math.round((cuenta.order.discount_cents / subtotal) * 100),
  );
  const [discountReason, setDiscountReason] = useState(cuenta.order.discount_reason ?? "");

  const discountCents = subtotal === 0 ? 0 : Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal + tipCents - discountCents);

  const [dividirOpen, setDividirOpen] = useState(false);
  const [cancelarItemId, setCancelarItemId] = useState<string | null>(null);

  const dirty =
    tipCents !== cuenta.order.tip_cents ||
    discountCents !== cuenta.order.discount_cents ||
    (discountReason || null) !== (cuenta.order.discount_reason || null);

  const cantApplyDiscount = discountPercent > 0 && !canApplyDiscount(role, discountPercent);

  const handleConfirmar = () => {
    if (cantApplyDiscount) {
      toast.error("Tu rol no permite ese descuento.");
      return;
    }
    if (discountCents > 0 && discountReason.trim() === "") {
      toast.error("El descuento requiere un motivo.");
      return;
    }
    startTransition(async () => {
      if (dirty) {
        const r = await aplicarPropinaYDescuento(
          cuenta.order.id,
          {
            tip_cents: tipCents,
            discount_cents: discountCents,
            discount_reason: discountCents > 0 ? discountReason : null,
          },
          slug,
        );
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
      }
      router.push(`/${slug}/mozo/mesa/${tableId}/cobrar`);
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 backdrop-blur p-4">
        <Link href={`/${slug}/mozo`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">Mesa {tableLabel}</h1>
          <p className="text-xs text-muted-foreground">Cuenta · #{cuenta.order.id.slice(0, 8)}</p>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-xl mx-auto">
        {/* Items */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Items</h2>
          <Card className="p-2 divide-y">
            {cuenta.items.map((it) => {
              const cancelled = it.cancelled_at !== null;
              return (
                <div
                  key={it.id}
                  className={`flex items-start justify-between p-2 ${
                    cancelled ? "opacity-50 line-through" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {it.quantity}× {it.product_name}
                    </p>
                    {it.notes && (
                      <p className="text-xs text-muted-foreground">{it.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(it.subtotal_cents)}
                    </span>
                    {!cancelled && canCancelItem(role) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setCancelarItemId(it.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </section>

        {/* Propina */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Propina</h2>
          <div className="flex flex-wrap gap-2">
            {TIP_PRESETS.map((p) => (
              <Button
                key={p}
                variant={tipPercent === p ? "default" : "outline"}
                size="sm"
                onClick={() => setTipPercent(p)}
              >
                {p === 0 ? "Sin propina" : `${p}%`}
              </Button>
            ))}
            <Button
              variant={tipPercent === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setTipPercent("custom")}
            >
              Custom
            </Button>
          </div>
          {tipPercent === "custom" && (
            <Input
              type="number"
              className="mt-2"
              value={tipCustomCents / 100}
              onChange={(e) =>
                setTipCustomCents(Math.max(0, Math.round(Number(e.target.value) * 100)))
              }
              placeholder="0.00"
            />
          )}
        </section>

        {/* Descuento */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Descuento</h2>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={discountPercent}
              onChange={(e) =>
                setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))
              }
              placeholder="0"
              className="w-24"
            />
            <span className="text-sm">%</span>
          </div>
          {cantApplyDiscount && (
            <p className="mt-1 text-xs text-destructive">
              Tu rol permite hasta {role === "mozo" ? "10%" : "25%"}. Pedile al encargado.
            </p>
          )}
          {discountCents > 0 && (
            <Input
              className="mt-2"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="Motivo (cumpleaños / fidelidad / cortesía / staff / otro)"
            />
          )}
        </section>

        {/* Totales */}
        <section className="rounded-md border bg-muted/30 p-3 space-y-1 text-sm">
          <Row label="Subtotal" value={formatCurrency(subtotal)} />
          {tipCents > 0 && <Row label="Propina" value={`+${formatCurrency(tipCents)}`} />}
          {discountCents > 0 && (
            <Row label="Descuento" value={`−${formatCurrency(discountCents)}`} />
          )}
          <div className="flex justify-between text-base font-semibold pt-1 border-t">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </section>

        {/* Splits */}
        {cuenta.splits.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              División ({cuenta.splits.length} sub-cuentas)
            </h2>
            <Card className="p-3 space-y-2">
              {cuenta.splits.map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span>
                    Sub-cuenta {s.split_index} · {s.split_mode === "por_personas" ? "personas" : "items"}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(s.expected_amount_cents)}
                    {s.status === "paid" && " ✓"}
                  </span>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  startTransition(async () => {
                    const r = await limpiarDivision(cuenta.order.id, slug);
                    if (!r.ok) toast.error(r.error);
                    else {
                      toast.success("División eliminada");
                      router.refresh();
                    }
                  })
                }
              >
                <Ban className="h-3.5 w-3.5 mr-1.5" /> Limpiar división
              </Button>
            </Card>
          </section>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setDividirOpen(true)}
          disabled={total === 0}
        >
          <Scissors className="h-4 w-4 mr-2" /> Dividir cuenta
        </Button>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur p-4">
        <div className="max-w-xl mx-auto">
          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirmar}
            disabled={cantApplyDiscount}
          >
            {dirty ? "Guardar y pasar a cobro" : "Pasar a cobro"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <DividirModal
        open={dividirOpen}
        onOpenChange={setDividirOpen}
        items={cuenta.items.filter((i) => i.cancelled_at === null)}
        orderId={cuenta.order.id}
        slug={slug}
        onDone={() => {
          setDividirOpen(false);
          router.refresh();
        }}
      />

      <Dialog open={cancelarItemId !== null} onOpenChange={(o) => !o && setCancelarItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar item</DialogTitle>
          </DialogHeader>
          <CancelarItemForm
            onSubmit={(motivo) => {
              if (!cancelarItemId) return;
              startTransition(async () => {
                const r = await cancelarItemEnCuenta(cancelarItemId, motivo, slug);
                if (!r.ok) toast.error(r.error);
                else {
                  toast.success("Item cancelado");
                  setCancelarItemId(null);
                  router.refresh();
                }
              });
            }}
            onCancel={() => setCancelarItemId(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CancelarItemForm({ onSubmit, onCancel }: { onSubmit: (motivo: string) => void; onCancel: () => void }) {
  const [motivo, setMotivo] = useState("");
  return (
    <>
      <Label>Motivo</Label>
      <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} />
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button disabled={motivo.trim() === ""} onClick={() => onSubmit(motivo)}>Confirmar</Button>
      </DialogFooter>
    </>
  );
}

// ── Modal de dividir ──────────────────────────────────────────

function DividirModal({
  open,
  onOpenChange,
  items,
  orderId,
  slug,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: CuentaState["items"];
  orderId: string;
  slug: string;
  onDone: () => void;
}) {
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<"personas" | "items">("personas");
  const [count, setCount] = useState(2);
  // mapping: itemId → split_index (1-based).
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [numSplits, setNumSplits] = useState(2);

  useEffect(() => {
    if (!open) {
      setCount(2);
      setMapping({});
      setNumSplits(2);
      setTab("personas");
    }
  }, [open]);

  const allAssigned = useMemo(
    () => items.every((it) => mapping[it.id]),
    [items, mapping],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dividir cuenta</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "personas" | "items")}>
          <TabsList className="grid grid-cols-2 mb-3">
            <TabsTrigger value="personas">
              <Users className="h-4 w-4 mr-2" /> Personas
            </TabsTrigger>
            <TabsTrigger value="items">
              <Scissors className="h-4 w-4 mr-2" /> Items
            </TabsTrigger>
          </TabsList>
          <TabsContent value="personas" className="space-y-4">
            <div>
              <Label>¿Cuántas personas?</Label>
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCount(Math.max(2, count - 1))}
                >
                  −
                </Button>
                <span className="text-2xl font-semibold w-8 text-center">{count}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCount(Math.min(20, count + 1))}
                >
                  +
                </Button>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() =>
                startTransition(async () => {
                  const r = await dividirPorPersonas(orderId, count, slug);
                  if (!r.ok) toast.error(r.error);
                  else {
                    toast.success(`Dividido en ${count}`);
                    onDone();
                  }
                })
              }
            >
              Confirmar división
            </Button>
          </TabsContent>
          <TabsContent value="items" className="space-y-3">
            <div>
              <Label>¿Cuántas sub-cuentas?</Label>
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNumSplits(Math.max(2, numSplits - 1))}
                >
                  −
                </Button>
                <span className="text-2xl font-semibold w-8 text-center">{numSplits}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNumSplits(Math.min(20, numSplits + 1))}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {it.quantity}× {it.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(it.subtotal_cents)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: numSplits }, (_, i) => i + 1).map((idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={mapping[it.id] === idx ? "default" : "outline"}
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          setMapping({ ...mapping, [it.id]: idx })
                        }
                      >
                        {idx}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={!allAssigned}
              onClick={() =>
                startTransition(async () => {
                  const grouped: Record<number, string[]> = {};
                  for (let i = 1; i <= numSplits; i++) grouped[i] = [];
                  for (const [itemId, idx] of Object.entries(mapping)) {
                    grouped[idx].push(itemId);
                  }
                  // Limpiar splits vacíos.
                  for (const k of Object.keys(grouped)) {
                    if (grouped[Number(k)].length === 0) delete grouped[Number(k)];
                  }
                  const r = await dividirPorItems(orderId, grouped, slug);
                  if (!r.ok) toast.error(r.error);
                  else {
                    toast.success("División por items aplicada");
                    onDone();
                  }
                })
              }
            >
              {allAssigned ? "Confirmar" : "Asigná todos los items"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
