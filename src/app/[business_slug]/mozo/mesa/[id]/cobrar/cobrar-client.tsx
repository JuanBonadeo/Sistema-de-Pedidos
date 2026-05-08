"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Check, CreditCard, Link as LinkIcon, MoreHorizontal, QrCode } from "lucide-react";
import { toast } from "sonner";

import type { BusinessRole } from "@/lib/admin/context";
import {
  anularCobro,
  iniciarPagoMp,
  registrarPago,
  type IniciarCobroResult,
} from "@/lib/billing/cobro-actions";
import type { CuentaState, OrderSplit, PaymentMethod } from "@/lib/billing/types";
import { formatCurrency } from "@/lib/currency";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  slug: string;
  tableId: string;
  tableLabel: string;
  role: BusinessRole;
  cuenta: CuentaState;
  init: IniciarCobroResult;
};

export function CobrarClient({ slug, tableId, tableLabel, role, cuenta, init }: Props) {
  const router = useRouter();
  const splits = init.hasImplicitSplit
    ? [implicitSplit(cuenta.order.id, cuenta.order.business_id, cuenta.totals.total_cents)]
    : init.splits;

  const [activeSplitId, setActiveSplitId] = useState<string | null>(null);
  const [cajaTurnoId, setCajaTurnoId] = useState<string>(init.cajas[0].id);
  const activeSplit = splits.find((s) => s.id === activeSplitId) ?? null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 backdrop-blur p-4">
        <Link href={`/${slug}/mozo/mesa/${tableId}/cuenta`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">Cobrar mesa {tableLabel}</h1>
          <p className="text-xs text-muted-foreground">
            Total: {formatCurrency(cuenta.totals.total_cents)}
          </p>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-xl mx-auto">
        {/* Selector de caja */}
        {init.cajas.length > 1 && (
          <div>
            <Label>Caja</Label>
            <Select value={cajaTurnoId} onValueChange={(v) => v && setCajaTurnoId(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {init.cajas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.caja_name} · {c.encargado_name ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Splits */}
        <div className="space-y-3">
          {splits.map((s) => {
            const remaining = s.expected_amount_cents - s.paid_amount_cents;
            const done = s.status === "paid" || remaining <= 0;
            const cancelled = s.status === "cancelled";
            return (
              <Card key={s.id} className={cancelled ? "opacity-50" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>
                      Sub-cuenta {s.split_index === 0 ? "única" : s.split_index}
                    </span>
                    <span className="text-base font-semibold">
                      {formatCurrency(s.expected_amount_cents)}
                      {done && <Check className="h-4 w-4 inline ml-2 text-green-600" />}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {s.paid_amount_cents > 0 && !done && (
                    <p className="text-xs text-muted-foreground">
                      Pagado: {formatCurrency(s.paid_amount_cents)} · falta{" "}
                      {formatCurrency(remaining)}
                    </p>
                  )}
                  {!done && !cancelled && (
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => setActiveSplitId(s.id)}
                    >
                      Cobrar {formatCurrency(remaining)}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Anular cobro */}
        {(role === "admin" || role === "encargado") && (
          <AnularCobroSection
            orderId={cuenta.order.id}
            slug={slug}
            onDone={() => router.push(`/${slug}/mozo`)}
          />
        )}
      </div>

      {/* Modal cobro */}
      {activeSplit && (
        <CobrarSplitDialog
          split={activeSplit}
          orderId={cuenta.order.id}
          cajaTurnoId={cajaTurnoId}
          slug={slug}
          isImplicit={init.hasImplicitSplit}
          onClose={() => setActiveSplitId(null)}
          onPaid={() => {
            setActiveSplitId(null);
            // El close de la order lo decide el server. router.refresh() trae
            // el nuevo estado; si la order quedó cerrada, el page redirige.
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function implicitSplit(orderId: string, businessId: string, total: number): OrderSplit {
  return {
    id: "__implicit__",
    order_id: orderId,
    business_id: businessId,
    split_mode: "por_personas",
    split_index: 0,
    expected_amount_cents: total,
    paid_amount_cents: 0,
    status: "pending",
    label: null,
  };
}

// ── Modal cobro de un split ───────────────────────────────────

function CobrarSplitDialog({
  split,
  orderId,
  cajaTurnoId,
  slug,
  isImplicit,
  onClose,
  onPaid,
}: {
  split: OrderSplit;
  orderId: string;
  cajaTurnoId: string;
  slug: string;
  isImplicit: boolean;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [, startTransition] = useTransition();
  const remaining = split.expected_amount_cents - split.paid_amount_cents;
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState(remaining);
  const [tip, setTip] = useState(0);
  const [lastFour, setLastFour] = useState("");
  const [cardBrand, setCardBrand] = useState<"visa" | "mastercard" | "amex" | "otro">("visa");
  const [notes, setNotes] = useState("");
  const [mpInitPoint, setMpInitPoint] = useState<string | null>(null);
  const [mpPaymentId, setMpPaymentId] = useState<string | null>(null);

  // Polling del estado del payment MP cada 4s.
  useEffect(() => {
    if (!mpPaymentId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/billing/payment-status?id=${mpPaymentId}`)
        .then((r) => r.json())
        .catch(() => null);
      if (res?.payment_status === "paid") {
        toast.success("Pago MP confirmado");
        clearInterval(interval);
        onPaid();
      } else if (res?.payment_status === "failed") {
        toast.error("MP rechazó el pago");
        clearInterval(interval);
        setMpPaymentId(null);
        setMpInitPoint(null);
      }
    }, 4_000);
    return () => clearInterval(interval);
  }, [mpPaymentId, onPaid]);

  const handleConfirm = () => {
    if (method === "mp_link" || method === "mp_qr") {
      startTransition(async () => {
        const r = await iniciarPagoMp({
          orderId,
          splitId: isImplicit ? null : split.id,
          method,
          amount_cents: amount,
          tip_cents: tip,
          caja_turno_id: cajaTurnoId,
          slug,
        });
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        setMpInitPoint(r.data.initPoint);
        setMpPaymentId(r.data.paymentId);
      });
      return;
    }
    startTransition(async () => {
      const r = await registrarPago({
        orderId,
        splitId: isImplicit ? null : split.id,
        method,
        amount_cents: amount,
        tip_cents: tip,
        caja_turno_id: cajaTurnoId,
        last_four: method === "card_manual" && lastFour.length === 4 ? lastFour : undefined,
        card_brand: method === "card_manual" ? cardBrand : undefined,
        notes: method === "other" || method === "card_manual" ? notes : undefined,
        slug,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Pago registrado");
      onPaid();
    });
  };

  // Vista de QR/link MP.
  if (mpInitPoint) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {method === "mp_qr" ? "QR para pagar" : "Link de pago"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {method === "mp_qr" ? (
              <div className="flex items-center justify-center p-4 bg-muted rounded">
                {/* En producción, usar un componente de QR sobre initPoint. */}
                <a href={mpInitPoint} target="_blank" rel="noreferrer" className="text-primary underline">
                  Abrir checkout MP
                </a>
              </div>
            ) : (
              <Input value={mpInitPoint} readOnly />
            )}
            <p className="text-xs text-muted-foreground">
              Esperando confirmación de MP… (auto-refresh cada 4s)
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cobrar {formatCurrency(remaining)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Tabs value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="cash" title="Efectivo"><Banknote className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="card_manual" title="Tarjeta"><CreditCard className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="mp_link" title="MP link"><LinkIcon className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="mp_qr" title="MP QR"><QrCode className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="other" title="Otro"><MoreHorizontal className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>

          <div>
            <Label>Monto</Label>
            <Input
              type="number"
              value={amount / 100}
              onChange={(e) => setAmount(Math.max(0, Math.round(Number(e.target.value) * 100)))}
            />
          </div>
          {(method === "cash" || method === "card_manual") && (
            <div>
              <Label>Propina (opcional)</Label>
              <Input
                type="number"
                value={tip / 100}
                onChange={(e) => setTip(Math.max(0, Math.round(Number(e.target.value) * 100)))}
              />
            </div>
          )}
          {method === "cash" && amount > remaining && (
            <p className="text-sm text-emerald-600">
              Vuelto: {formatCurrency(amount - remaining)}
            </p>
          )}
          {method === "card_manual" && (
            <>
              <div>
                <Label>Últimos 4 dígitos</Label>
                <Input
                  value={lastFour}
                  onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234"
                  maxLength={4}
                />
              </div>
              <div>
                <Label>Marca</Label>
                <Select value={cardBrand} onValueChange={(v) => v && setCardBrand(v as "visa" | "mastercard" | "amex" | "otro")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">MasterCard</SelectItem>
                    <SelectItem value="amex">Amex</SelectItem>
                    <SelectItem value="otro">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {(method === "other" || method === "card_manual") && (
            <div>
              <Label>
                Notas {method === "other" && <span className="text-destructive">*</span>}
              </Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={
              amount <= 0 ||
              (method === "other" && notes.trim() === "") ||
              (method === "card_manual" && lastFour !== "" && lastFour.length !== 4)
            }
            onClick={handleConfirm}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Anular cobro ──────────────────────────────────────────────

function AnularCobroSection({
  orderId,
  slug,
  onDone,
}: {
  orderId: string;
  slug: string;
  onDone: () => void;
}) {
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-destructive"
        onClick={() => setOpen(true)}
      >
        Anular cobro
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular cobro</DialogTitle>
          </DialogHeader>
          <Label>Motivo</Label>
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={motivo.trim() === ""}
              onClick={() =>
                startTransition(async () => {
                  const r = await anularCobro(orderId, motivo, slug);
                  if (!r.ok) toast.error(r.error);
                  else {
                    toast.success("Cobro anulado");
                    setOpen(false);
                    onDone();
                  }
                })
              }
            >
              Anular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
