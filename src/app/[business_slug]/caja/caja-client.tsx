"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
  abrirTurno,
  cerrarTurno,
  crearCaja,
  registrarIngreso,
  registrarSangria,
  setCajaActive,
} from "@/lib/caja/actions";
import type { ActiveTurnoView, Caja, TurnoLiveStats } from "@/lib/caja/types";
import { formatCurrency } from "@/lib/currency";
import { canOpenCajaTurno } from "@/lib/permissions/can";
import type { BusinessRole } from "@/lib/admin/context";
import { cn } from "@/lib/utils";

import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
} from "@/components/admin/shell/page-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const OPENING_PRESETS = [100_000, 500_000, 1_000_000];

type Props = {
  slug: string;
  role: BusinessRole;
  cajas: Caja[];
  activeTurnos: ActiveTurnoView[];
};

export function CajaClient({ slug, role, cajas, activeTurnos }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [aperturaModal, setAperturaModal] = useState<Caja | null>(null);
  const [openingCents, setOpeningCents] = useState(OPENING_PRESETS[0]);
  const [crearOpen, setCrearOpen] = useState(false);
  const [nuevaCajaName, setNuevaCajaName] = useState("");

  const turnoByCaja = new Map(activeTurnos.map((t) => [t.caja_id, t]));
  const cajasActivas = cajas.filter((c) => c.is_active);
  const cajasInactivas = cajas.filter((c) => !c.is_active);

  const puedeOperar = canOpenCajaTurno(role);

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

  const handleToggleActive = (caja: Caja, next: boolean) => {
    startTransition(async () => {
      const r = await setCajaActive(caja.id, next, slug);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(next ? "Caja habilitada" : "Caja deshabilitada");
      router.refresh();
    });
  };

  return (
    <PageShell width="default">
      <PageHeader
        eyebrow="Operación"
        title="Caja"
        description="Abrí turnos, registrá movimientos y cerrá el día con conciliación de efectivo."
        back={{ href: `/${slug}/mozo`, label: "Volver al salón" }}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Refrescar"
            >
              <RefreshCw className="size-4" />
            </button>
            {puedeOperar && (
              <button
                type="button"
                onClick={() => setCrearOpen(true)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:brightness-95 active:translate-y-px"
                style={{
                  background: "var(--brand, #18181B)",
                  color: "var(--brand-foreground, white)",
                }}
              >
                <Plus className="size-4" />
                Nueva caja
              </button>
            )}
          </div>
        }
      />

      {/* Empty state global: no hay cajas */}
      {cajas.length === 0 && (
        <Surface className="text-center" padding="default">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-6">
            <div
              className="flex size-12 items-center justify-center rounded-full"
              style={{ background: "var(--brand-soft, #F4F4F5)" }}
            >
              <Wallet
                className="size-6"
                style={{ color: "var(--brand, #18181B)" }}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
                Sin cajas configuradas
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                Creá la primera caja del local para empezar a abrir turnos. Una
                caja física = una fuente donde se cobra (Salón, Barra, Caja 1…).
              </p>
            </div>
            {puedeOperar && (
              <button
                type="button"
                onClick={() => setCrearOpen(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:brightness-95"
                style={{
                  background: "var(--brand, #18181B)",
                  color: "var(--brand-foreground, white)",
                }}
              >
                <Plus className="size-4" />
                Crear primera caja
              </button>
            )}
          </div>
        </Surface>
      )}

      {/* Turnos abiertos */}
      {activeTurnos.length > 0 && (
        <Surface padding="default" className="space-y-5">
          <SurfaceHeader
            eyebrow={`${activeTurnos.length} ${activeTurnos.length === 1 ? "abierto" : "abiertos"}`}
            title="Turnos en operación"
            description="Stats en vivo. Refresco automático cada 30 segundos."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {activeTurnos.map((t) => (
              <TurnoCard key={t.id} turno={t} slug={slug} role={role} />
            ))}
          </div>
        </Surface>
      )}

      {/* Cajas configuradas */}
      {cajasActivas.length > 0 && (
        <Surface padding="default" className="space-y-4">
          <SurfaceHeader
            eyebrow="Cajas habilitadas"
            title={`${cajasActivas.length} ${cajasActivas.length === 1 ? "caja" : "cajas"} configuradas`}
            description="Tocá una caja libre para abrir un turno."
          />
          <ul className="divide-y divide-zinc-100 rounded-xl ring-1 ring-zinc-200/70">
            {cajasActivas.map((caja, idx) => {
              const turno = turnoByCaja.get(caja.id);
              const open = !!turno;
              return (
                <li
                  key={caja.id}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-3",
                    idx % 2 === 1 ? "bg-zinc-50/50" : "bg-white",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full",
                        open
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500",
                      )}
                    >
                      <Wallet className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {caja.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {open ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                            Turno abierto · {turno!.encargado_name ?? "—"}
                          </span>
                        ) : (
                          "Sin turno abierto"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!open && puedeOperar && (
                      <button
                        type="button"
                        onClick={() => {
                          setAperturaModal(caja);
                          setOpeningCents(OPENING_PRESETS[0]);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                      >
                        <LockOpen className="size-3.5" />
                        Abrir turno
                      </button>
                    )}
                    {puedeOperar && !open && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(caja, false)}
                        className="inline-flex size-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label="Deshabilitar caja"
                        title="Deshabilitar"
                      >
                        <EyeOff className="size-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Surface>
      )}

      {/* Cajas deshabilitadas (collapsed) */}
      {cajasInactivas.length > 0 && (
        <Surface tone="subtle" padding="compact" className="space-y-3">
          <SurfaceHeader
            eyebrow="Pausadas"
            title={`${cajasInactivas.length} ${cajasInactivas.length === 1 ? "caja deshabilitada" : "cajas deshabilitadas"}`}
            description="No aparecen para abrir turno. Histórico preservado."
          />
          <ul className="space-y-1.5">
            {cajasInactivas.map((caja) => (
              <li
                key={caja.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-200/70"
              >
                <span className="text-sm text-zinc-600">{caja.name}</span>
                {puedeOperar && (
                  <button
                    type="button"
                    onClick={() => handleToggleActive(caja, true)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    <Eye className="size-3" />
                    Habilitar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Surface>
      )}

      {/* Modal: crear caja */}
      <Dialog open={crearOpen} onOpenChange={setCrearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
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
              <p className="text-xs text-zinc-500">
                Nombre visible para distinguir entre cajas físicas. Único por
                local.
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

      {/* Modal: apertura de turno */}
      <Dialog
        open={aperturaModal !== null}
        onOpenChange={(o) => !o && setAperturaModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Abrir turno
              <span className="ml-2 text-sm font-normal text-zinc-500">
                · {aperturaModal?.name}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Efectivo inicial en caja</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {OPENING_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setOpeningCents(p)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition",
                      openingCents === p
                        ? "bg-zinc-900 text-white ring-zinc-900"
                        : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
                    )}
                  >
                    {formatCurrency(p)}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={openingCents / 100}
                onChange={(e) =>
                  setOpeningCents(
                    Math.max(0, Math.round(Number(e.target.value) * 100)),
                  )
                }
                className="mt-2"
                placeholder="Monto custom"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Lo que tenés en caja físicamente al arrancar el turno.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAperturaModal(null)}>
              Cancelar
            </Button>
            <Button onClick={() => aperturaModal && handleAbrir(aperturaModal)}>
              Abrir turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ── TurnoCard: card grande con KPIs + acciones ──────────────────

function TurnoCard({
  turno,
  slug,
  role,
}: {
  turno: ActiveTurnoView;
  slug: string;
  role: BusinessRole;
}) {
  const router = useRouter();
  const [stats, setStats] = useState<TurnoLiveStats | null>(null);
  const [, startTransition] = useTransition();
  const [sangriaOpen, setSangriaOpen] = useState(false);
  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [cierreOpen, setCierreOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/caja/stats?turno=${turno.id}`);
        const data = await res.json();
        if (!cancelled) setStats(data?.stats ?? null);
      } catch {
        // Silenciar — no es crítico.
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [turno.id]);

  const expected = stats?.expected_cash_cents ?? turno.opening_cash_cents;
  const ventas = stats?.total_ventas_cents ?? 0;
  const propinas = stats?.total_propinas_cents ?? 0;
  const cobros = stats?.cobros_count ?? 0;
  const puedeOperar = canOpenCajaTurno(role);

  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {turno.encargado_name ?? "—"}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-900">
            {turno.caja_name}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-800">
          <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
          Abierto
        </span>
      </header>

      {/* KPI principal: efectivo esperado */}
      <div
        className="mt-4 rounded-xl p-4"
        style={{ background: "var(--brand-soft, #F4F4F5)" }}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          Efectivo esperado
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">
          {formatCurrency(expected)}
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Apertura {formatCurrency(turno.opening_cash_cents)} + cobros − sangrías
        </p>
      </div>

      {/* Stats secundarios */}
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Ventas" value={formatCurrency(ventas)} />
        <Stat label="Propinas" value={formatCurrency(propinas)} />
        <Stat label="Cobros" value={String(cobros)} />
      </dl>

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap gap-2">
        {puedeOperar && (
          <>
            <button
              type="button"
              onClick={() => setSangriaOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
            >
              <ArrowDownToLine className="size-3.5" /> Sangría
            </button>
            <button
              type="button"
              onClick={() => setIngresoOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
            >
              <ArrowUpFromLine className="size-3.5" /> Ingreso
            </button>
            <button
              type="button"
              onClick={() => setCierreOpen(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:brightness-95"
              style={{
                background: "var(--brand, #18181B)",
                color: "var(--brand-foreground, white)",
              }}
            >
              <Lock className="size-3.5" /> Cerrar turno
            </button>
          </>
        )}
      </div>

      <MovimientoModal
        open={sangriaOpen}
        onOpenChange={setSangriaOpen}
        title="Registrar sangría"
        description="Sacar efectivo de la caja para depositarlo, pagar a un proveedor, etc."
        requiereMotivo
        ctaLabel="Registrar sangría"
        onSubmit={(amount, reason) =>
          startTransition(async () => {
            const r = await registrarSangria(
              turno.id,
              amount,
              reason ?? "",
              slug,
            );
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
        title="Registrar ingreso"
        description="Sumar efectivo extra a la caja durante el turno."
        requiereMotivo={false}
        ctaLabel="Registrar ingreso"
        onSubmit={(amount, reason) =>
          startTransition(async () => {
            const r = await registrarIngreso(
              turno.id,
              amount,
              reason ?? null,
              slug,
            );
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
        cajaName={turno.caja_name}
        opening={turno.opening_cash_cents}
        ventas={ventas}
        propinas={propinas}
        expected={expected}
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
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-2 py-2">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}

// ── Modales de movimiento (sangría / ingreso) ──────────────────

function MovimientoModal({
  open,
  onOpenChange,
  title,
  description,
  requiereMotivo,
  ctaLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  requiereMotivo: boolean;
  ctaLabel: string;
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
        <p className="-mt-2 text-sm text-zinc-600">{description}</p>
        <div className="mt-3 grid gap-4">
          <div className="grid gap-1.5">
            <Label>Monto</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
              inputMode="decimal"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>
              Motivo
              {requiereMotivo && (
                <span className="ml-1 text-rose-600">*</span>
              )}
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={
                requiereMotivo
                  ? "Ej: depósito en banco / pago proveedor"
                  : "Opcional"
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => onSubmit(cents, reason.trim() || null)}
          >
            {ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal de cierre con conciliación ───────────────────────────

function CierreModal({
  open,
  onOpenChange,
  cajaName,
  opening,
  ventas,
  propinas,
  expected,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cajaName: string;
  opening: number;
  ventas: number;
  propinas: number;
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

  const cents = closing === "" ? null : Math.max(0, Math.round(Number(closing) * 100));
  const diff = cents === null ? 0 : cents - expected;
  const requiresNotes = cents !== null && diff !== 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cerrar turno
            <span className="ml-2 text-sm font-normal text-zinc-500">
              · {cajaName}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Resumen del turno */}
        <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70">
          <ResumenRow label="Apertura" value={formatCurrency(opening)} />
          <ResumenRow label="Ventas en efectivo" value={formatCurrency(ventas)} hint="aprox" />
          <ResumenRow label="Propinas" value={formatCurrency(propinas)} hint="info" />
          <div className="mt-2 border-t border-zinc-200 pt-2">
            <ResumenRow
              label="Efectivo esperado"
              value={formatCurrency(expected)}
              bold
            />
          </div>
        </div>

        {/* Input cierre */}
        <div className="mt-3 grid gap-1.5">
          <Label>Efectivo contado en caja</Label>
          <Input
            type="number"
            value={closing}
            onChange={(e) => setClosing(e.target.value)}
            placeholder="0.00"
            autoFocus
            inputMode="decimal"
          />
        </div>

        {/* Diferencia */}
        {cents !== null && diff !== 0 && (
          <div
            className={cn(
              "mt-3 flex items-center justify-between rounded-lg p-3 ring-1",
              diff < 0
                ? "bg-rose-50 ring-rose-200 text-rose-900"
                : "bg-amber-50 ring-amber-200 text-amber-900",
            )}
          >
            <span className="text-sm font-semibold">
              {diff < 0 ? "Faltante" : "Sobrante"}
            </span>
            <span className="text-base font-bold tabular-nums">
              {diff > 0 ? "+" : "−"}
              {formatCurrency(Math.abs(diff))}
            </span>
          </div>
        )}

        {/* Notes obligatorio si diff != 0 */}
        {requiresNotes && (
          <div className="mt-3 grid gap-1.5">
            <Label>
              Motivo de la diferencia
              <span className="ml-1 text-rose-600">*</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej: vuelto mal dado, billete falso, ajuste de propinas…"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={cents === null || (requiresNotes && notes.trim() === "")}
            onClick={() =>
              cents !== null && onSubmit(cents, notes.trim() || null)
            }
          >
            <Banknote className="mr-2 size-4" />
            Cerrar turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResumenRow({
  label,
  value,
  hint,
  bold,
}: {
  label: string;
  value: string;
  hint?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-sm">
      <span className="text-zinc-600">
        {label}
        {hint && <span className="ml-1 text-[0.65rem] text-zinc-400">({hint})</span>}
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold ? "font-semibold text-zinc-900" : "text-zinc-700",
        )}
      >
        {value}
      </span>
    </div>
  );
}
