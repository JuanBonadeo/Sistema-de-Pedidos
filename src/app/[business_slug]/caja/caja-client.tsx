"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, LockOpen, Lock, Minus, Plus, Plus as PlusIcon, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";

import {
  abrirTurno,
  cerrarTurno,
  crearCaja,
  registrarIngreso,
  registrarSangria,
} from "@/lib/caja/actions";
import { getTurnoLiveStats } from "@/lib/caja/queries";
import type { ActiveTurnoView, Caja, TurnoLiveStats } from "@/lib/caja/types";
import { formatCurrency } from "@/lib/currency";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const OPENING_PRESETS = [100_000, 500_000, 1_000_000];

type Props = {
  slug: string;
  businessId: string;
  cajas: Caja[];
  activeTurnos: ActiveTurnoView[];
};

export function CajaClient({ slug, cajas, activeTurnos }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [aperturaModal, setAperturaModal] = useState<Caja | null>(null);
  const [openingCents, setOpeningCents] = useState(OPENING_PRESETS[0]);
  const [crearOpen, setCrearOpen] = useState(false);
  const [nuevaCajaName, setNuevaCajaName] = useState("");

  const cajasLibres = cajas.filter(
    (c) => !activeTurnos.some((t) => t.caja_id === c.id),
  );

  const handleCrearCaja = () => {
    const name = nuevaCajaName.trim();
    if (name === "") return;
    startTransition(async () => {
      const r = await crearCaja(name, slug);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Caja "${r.data.name}" creada`);
      setCrearOpen(false);
      setNuevaCajaName("");
      router.refresh();
    });
  };

  const handleAbrir = (caja: Caja) => {
    if (openingCents < 0) return;
    startTransition(async () => {
      const r = await abrirTurno(caja.id, openingCents, slug);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Turno abierto en ${caja.name}`);
      setAperturaModal(null);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 backdrop-blur p-4">
        <Link href={`/${slug}/mozo`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold text-lg flex-1">Caja</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCrearOpen(true)}
        >
          <PlusIcon className="h-4 w-4 mr-1.5" /> Nueva caja
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.refresh()}
          aria-label="Refrescar"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </header>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Turnos abiertos */}
        {activeTurnos.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Turnos abiertos ({activeTurnos.length})
            </h2>
            <div className="space-y-3">
              {activeTurnos.map((t) => (
                <TurnoCard key={t.id} turno={t} slug={slug} />
              ))}
            </div>
          </section>
        )}

        {/* Cajas libres */}
        {cajasLibres.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Cajas libres
            </h2>
            <div className="space-y-2">
              {cajasLibres.map((caja) => (
                <Card key={caja.id} className="flex flex-row items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{caja.name}</p>
                    <p className="text-sm text-muted-foreground">Sin turno abierto</p>
                  </div>
                  <Button
                    onClick={() => {
                      setAperturaModal(caja);
                      setOpeningCents(OPENING_PRESETS[0]);
                    }}
                  >
                    <LockOpen className="h-4 w-4 mr-2" />
                    Abrir turno
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        )}

        {cajas.length === 0 && (
          <div className="rounded-md border border-dashed p-8 text-center space-y-3">
            <Settings className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">No hay cajas configuradas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Creá la primera caja del local para empezar a abrir turnos.
              </p>
            </div>
            <Button onClick={() => setCrearOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" /> Crear primera caja
            </Button>
          </div>
        )}
      </div>

      {/* Crear caja */}
      <Dialog open={crearOpen} onOpenChange={setCrearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input
                value={nuevaCajaName}
                onChange={(e) => setNuevaCajaName(e.target.value)}
                placeholder="Salón / Barra / Caja 1…"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCrearCaja();
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre visible para distinguir entre cajas físicas (ej: "Barra", "Caja 1").
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCrearOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={nuevaCajaName.trim() === ""}
              onClick={handleCrearCaja}
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apertura */}
      <Dialog
        open={aperturaModal !== null}
        onOpenChange={(o) => {
          if (!o) setAperturaModal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir turno · {aperturaModal?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Efectivo inicial en caja</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {OPENING_PRESETS.map((p) => (
                  <Button
                    key={p}
                    variant={openingCents === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOpeningCents(p)}
                  >
                    {formatCurrency(p)}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={openingCents / 100}
                onChange={(e) =>
                  setOpeningCents(Math.max(0, Math.round(Number(e.target.value) * 100)))
                }
                className="mt-2"
                placeholder="Monto custom"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAperturaModal(null)}
            >
              Cancelar
            </Button>
            <Button onClick={() => aperturaModal && handleAbrir(aperturaModal)}>
              Abrir turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── TurnoCard con stats live + modales sangría/ingreso/cierre ──

function TurnoCard({ turno, slug }: { turno: ActiveTurnoView; slug: string }) {
  const router = useRouter();
  const [stats, setStats] = useState<TurnoLiveStats | null>(null);
  const [, startTransition] = useTransition();
  const [sangriaOpen, setSangriaOpen] = useState(false);
  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [cierreOpen, setCierreOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetch(`/api/caja/stats?turno=${turno.id}`).then((r) => r.json()).catch(() => null);
      if (!cancelled) setStats(data?.stats ?? null);
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [turno.id]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{turno.caja_name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            Encargado: {turno.encargado_name ?? "—"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat
            label="Ventas turno"
            value={formatCurrency(stats?.total_ventas_cents ?? 0)}
          />
          <Stat
            label="Propinas"
            value={formatCurrency(stats?.total_propinas_cents ?? 0)}
          />
          <Stat
            label="Cobros"
            value={String(stats?.cobros_count ?? 0)}
          />
          <Stat
            label="Efectivo esperado"
            value={formatCurrency(stats?.expected_cash_cents ?? turno.opening_cash_cents)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setSangriaOpen(true)}>
            <Minus className="h-3.5 w-3.5 mr-1.5" /> Sangría
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIngresoOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Ingreso
          </Button>
          <Button variant="default" size="sm" onClick={() => setCierreOpen(true)}>
            <Lock className="h-3.5 w-3.5 mr-1.5" /> Cerrar
          </Button>
        </div>
      </CardContent>

      <MovimientoModal
        open={sangriaOpen}
        onOpenChange={setSangriaOpen}
        title="Sangría"
        requiereMotivo
        onSubmit={(amount, reason) =>
          startTransition(async () => {
            const r = await registrarSangria(turno.id, amount, reason ?? "", slug);
            if (!r.ok) toast.error(r.error);
            else {
              toast.success("Sangría registrada");
              setSangriaOpen(false);
              router.refresh();
            }
          })
        }
      />
      <MovimientoModal
        open={ingresoOpen}
        onOpenChange={setIngresoOpen}
        title="Ingreso"
        requiereMotivo={false}
        onSubmit={(amount, reason) =>
          startTransition(async () => {
            const r = await registrarIngreso(turno.id, amount, reason ?? null, slug);
            if (!r.ok) toast.error(r.error);
            else {
              toast.success("Ingreso registrado");
              setIngresoOpen(false);
              router.refresh();
            }
          })
        }
      />
      <CierreModal
        open={cierreOpen}
        onOpenChange={setCierreOpen}
        expected={stats?.expected_cash_cents ?? turno.opening_cash_cents}
        onSubmit={(closing, notes) =>
          startTransition(async () => {
            const r = await cerrarTurno(turno.id, closing, notes, slug);
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            toast.success("Turno cerrado");
            setCierreOpen(false);
            router.refresh();
          })
        }
      />
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MovimientoModal({
  open,
  onOpenChange,
  title,
  requiereMotivo,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  requiereMotivo: boolean;
  onSubmit: (amountCents: number, reason: string | null) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setAmount("");
      setReason("");
    }
  }, [open]);

  const cents = Math.max(0, Math.round(Number(amount) * 100));
  const canSubmit = cents > 0 && (!requiereMotivo || reason.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Monto</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div>
            <Label>
              Motivo {requiereMotivo && <span className="text-destructive">*</span>}
            </Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!canSubmit} onClick={() => onSubmit(cents, reason || null)}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CierreModal({
  open,
  onOpenChange,
  expected,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  expected: number;
  onSubmit: (closingCents: number, notes: string | null) => void;
}) {
  const [closing, setClosing] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setClosing("");
      setNotes("");
    }
  }, [open]);

  const cents = Math.max(0, Math.round(Number(closing) * 100));
  const diff = cents - expected;
  const requiresNotes = diff !== 0 && closing !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar turno</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Efectivo esperado</span>
              <span className="font-medium">{formatCurrency(expected)}</span>
            </div>
          </div>
          <div>
            <Label>Efectivo contado</Label>
            <Input
              type="number"
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          {closing !== "" && diff !== 0 && (
            <div
              className={`text-sm font-medium ${
                diff < 0 ? "text-destructive" : "text-amber-600"
              }`}
            >
              Diferencia: {diff > 0 ? "+" : ""}{formatCurrency(Math.abs(diff))}
              {diff < 0 ? " (faltante)" : " (sobrante)"}
            </div>
          )}
          {requiresNotes && (
            <div>
              <Label>
                Motivo de la diferencia <span className="text-destructive">*</span>
              </Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={closing === "" || (requiresNotes && notes.trim() === "")}
            onClick={() => onSubmit(cents, notes.trim() || null)}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Cerrar turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
