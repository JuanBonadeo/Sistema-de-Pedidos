"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CreditCard,
  Link2,
  Lock,
  LockOpen,
  MoreHorizontal,
  QrCode,
  RefreshCw,
  Settings,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Surface } from "@/components/admin/shell/page-shell";
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
import {
  abrirCajaConDefault,
  abrirTurno,
  cerrarTurno,
  registrarIngreso,
  registrarSangria,
} from "@/lib/caja/actions";
import type { TurnoPayment } from "@/lib/caja/queries";
import type {
  ActiveTurnoView,
  Caja,
  CajaMovimiento,
  PaymentMethod,
  TurnoLiveStats,
} from "@/lib/caja/types";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  initialTurnos: ActiveTurnoView[];
  /** Cajas configuradas del negocio (solo activas, ordenadas por sort_order).
   *  Cada una se renderiza como un slot en el grid: TurnoCard si tiene turno
   *  abierto, AbrirCajaSlot si no. */
  cajas: Caja[];
};

const OPENING_PRESETS = [10_000_00, 50_000_00, 100_000_00]; // $10.000 / $50.000 / $100.000

/**
 * Tab Caja del operativo `/admin/local`. Autosuficiente para el flujo diario:
 *
 *   - Sin caja abierta → CTA grande inline con efectivo inicial.
 *   - Con caja abierta → card con KPIs vivos + sangría / ingreso / cerrar.
 *   - Cerradas del día → lista compacta abajo.
 *
 * Filosofía: el encargado piensa en "abrir caja" / "cerrar caja", no en
 * "turnos" ni en "configurar cajas". El concepto de caja física se maneja
 * de forma transparente: si no hay cajas, se crea "Caja Principal" en el
 * primer abrir. La config multi-caja vive en `/caja` (link discreto al pie).
 */
export function CajaAdminBoard({
  slug,
  initialTurnos,
  cajas,
}: Props) {
  const router = useRouter();
  const [statsByTurno, setStatsByTurno] = useState<
    Record<string, TurnoLiveStats | null>
  >({});
  const [movimientosByTurno, setMovimientosByTurno] = useState<
    Record<string, CajaMovimiento[]>
  >({});
  const [paymentsByTurno, setPaymentsByTurno] = useState<
    Record<string, TurnoPayment[]>
  >({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Polling de stats + movimientos + payments de turnos abiertos (cada 30s).
  // Todo en un solo endpoint para no triplicar polling.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        initialTurnos.map(async (t) => {
          try {
            const res = await fetch(`/api/caja/stats?turno=${t.id}`);
            const data = await res.json();
            return [
              t.id,
              data?.stats ?? null,
              data?.movimientos ?? [],
              data?.payments ?? [],
            ] as const;
          } catch {
            return [t.id, null, [], []] as const;
          }
        }),
      );
      if (!cancelled) {
        setStatsByTurno(
          Object.fromEntries(entries.map((e) => [e[0], e[1]])),
        );
        setMovimientosByTurno(
          Object.fromEntries(entries.map((e) => [e[0], e[2]])),
        );
        setPaymentsByTurno(
          Object.fromEntries(entries.map((e) => [e[0], e[3]])),
        );
      }
    };
    if (initialTurnos.length > 0) load();
    const i = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [initialTurnos, refreshKey]);

  // Mapa caja_id → turno open, para resolver el estado de cada slot.
  const turnoByCajaId = new Map(initialTurnos.map((t) => [t.caja_id, t]));

  // Caso 0 cajas: pantalla virgen, CTA único centrado que auto-crea
  // "Caja Principal" al abrirla.
  if (cajas.length === 0) {
    return (
      <div className="space-y-5">
        <AbrirCajaPrimera
          slug={slug}
          onOpened={() => router.refresh()}
        />
        <ConfigurarCajasLink slug={slug} />
      </div>
    );
  }

  // Layout: una columna full-width si hay 1 caja, 2 columnas si hay 2+.
  // Cada slot muestra TurnoCard (operativa) o AbrirCajaSlot (CTA) según
  // tenga o no turno open. Misma altura entre slots.
  const gridCols =
    cajas.length === 1
      ? "grid-cols-1"
      : "grid-cols-1 lg:grid-cols-2";

  return (
    <div className="space-y-5">
      {/* Header con refresh (sin descripción pesada). */}
      {initialTurnos.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Refresco cada 30s
          </p>
          <button
            type="button"
            onClick={() => {
              setRefreshKey((k) => k + 1);
              router.refresh();
            }}
            className="inline-flex size-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Refrescar"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      )}

      {/* Grid de cajas: cada slot es operativa o CTA según estado. */}
      <div className={cn("grid gap-4", gridCols)}>
        {cajas.map((c) => {
          const turno = turnoByCajaId.get(c.id);
          if (turno) {
            return (
              <TurnoCard
                key={c.id}
                turno={turno}
                stats={statsByTurno[turno.id] ?? null}
                movimientos={movimientosByTurno[turno.id] ?? []}
                payments={paymentsByTurno[turno.id] ?? []}
                slug={slug}
              />
            );
          }
          return (
            <AbrirCajaSlot
              key={c.id}
              caja={c}
              slug={slug}
              onOpened={() => router.refresh()}
            />
          );
        })}
      </div>

      {/* Link discreto a configuración avanzada */}
      <ConfigurarCajasLink slug={slug} />
    </div>
  );
}

// ── Sub-componentes para el render principal ───────────────────

function ConfigurarCajasLink({ slug }: { slug: string }) {
  return (
    <div className="pt-1 text-center">
      <Link
        href={`/${slug}/admin/cajas`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900"
      >
        <Settings className="size-3" />
        Configurar cajas
      </Link>
    </div>
  );
}

// ── Abrir caja (slot por-caja en el grid) ──────────────────────

/**
 * Slot del grid para una caja sin turno abierto. Replica el shape visual
 * de TurnoCard (mismo ancho, header con nombre y pill de estado) pero el
 * body es el formulario de apertura. El CTA queda al pie en posición
 * equivalente al "Cerrar caja" del slot operativo — continuidad visual.
 */
function AbrirCajaSlot({
  caja,
  slug,
  onOpened,
}: {
  caja: Caja;
  slug: string;
  onOpened: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [amountInput, setAmountInput] = useState<string>(
    String(OPENING_PRESETS[1]! / 100),
  );
  const cents = Math.max(0, Math.round(Number(amountInput) * 100));

  const handleAbrir = () => {
    startTransition(async () => {
      const r = await abrirTurno(caja.id, cents, slug);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Caja abierta · ${caja.name}`);
      onOpened();
    });
  };

  return (
    <article className="flex flex-col rounded-2xl bg-white ring-1 ring-zinc-200/70">
      {/* Header simétrico al de TurnoCard. */}
      <header className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
            {caja.name}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">Sin turno abierto</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[0.65rem] font-semibold text-zinc-600">
          <span className="inline-block size-1.5 rounded-full bg-zinc-400" />
          Cerrada
        </span>
      </header>

      {/* Body: form de apertura. */}
      <div className="flex-1 space-y-4 p-5">
        <div>
          <Label className="text-xs font-medium text-zinc-600">
            Efectivo inicial
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {OPENING_PRESETS.map((p) => {
              const active = cents === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmountInput(String(p / 100))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition",
                    active
                      ? "bg-zinc-900 text-white ring-zinc-900"
                      : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
                  )}
                >
                  {formatCurrency(p)}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium text-zinc-600">Otro monto</Label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
              $
            </span>
            <Input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="pl-7 text-base tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* CTA al pie — misma posición que "Cerrar caja" del slot operativo. */}
      <div className="border-t border-zinc-100 p-3">
        <button
          type="button"
          onClick={handleAbrir}
          disabled={pending || cents < 0}
          className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition hover:brightness-95 active:translate-y-px disabled:opacity-60"
          style={{
            background: "var(--brand, #18181B)",
            color: "var(--brand-foreground, white)",
          }}
        >
          <LockOpen className="size-4" />
          {pending ? "Abriendo…" : `Abrir con ${formatCurrency(cents)}`}
        </button>
      </div>
    </article>
  );
}

/**
 * Pantalla vacía: el local no tiene ninguna caja configurada. Un CTA único
 * full-width que auto-crea "Caja Principal" y le abre turno.
 */
function AbrirCajaPrimera({
  slug,
  onOpened,
}: {
  slug: string;
  onOpened: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [amountInput, setAmountInput] = useState<string>(
    String(OPENING_PRESETS[1]! / 100),
  );
  const cents = Math.max(0, Math.round(Number(amountInput) * 100));

  const handleAbrir = () => {
    startTransition(async () => {
      const r = await abrirCajaConDefault(cents, slug);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Caja abierta");
      onOpened();
    });
  };

  return (
    <Surface padding="default">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-6 text-center">
        <div
          className="flex size-14 items-center justify-center rounded-full"
          style={{ background: "var(--brand-soft, #F4F4F5)" }}
        >
          <Wallet
            className="size-7"
            style={{ color: "var(--brand, #18181B)" }}
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
            Abrir caja
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Indicá el efectivo con el que arrancás.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {OPENING_PRESETS.map((p) => {
            const active = cents === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setAmountInput(String(p / 100))}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                  active
                    ? "bg-zinc-900 text-white ring-zinc-900"
                    : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
                )}
              >
                {formatCurrency(p)}
              </button>
            );
          })}
        </div>
        <div className="w-full max-w-xs">
          <Label className="text-xs font-medium text-zinc-600">
            Otro monto
          </Label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
              $
            </span>
            <Input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="pl-7 text-base tabular-nums"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAbrir}
          disabled={pending || cents < 0}
          className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition hover:brightness-95 active:translate-y-px disabled:opacity-60"
          style={{
            background: "var(--brand, #18181B)",
            color: "var(--brand-foreground, white)",
          }}
        >
          <LockOpen className="size-4" />
          {pending ? "Abriendo…" : `Abrir caja con ${formatCurrency(cents)}`}
        </button>
      </div>
    </Surface>
  );
}

// ── Card de caja abierta con KPIs y acciones ───────────────────

function TurnoCard({
  turno,
  stats,
  movimientos,
  payments,
  slug,
}: {
  turno: ActiveTurnoView;
  stats: TurnoLiveStats | null;
  movimientos: CajaMovimiento[];
  payments: TurnoPayment[];
  slug: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [sangriaOpen, setSangriaOpen] = useState(false);
  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [cierreOpen, setCierreOpen] = useState(false);

  const expected = stats?.expected_cash_cents ?? turno.opening_cash_cents;
  const ventas = stats?.total_ventas_cents ?? 0;
  const propinas = stats?.total_propinas_cents ?? 0;
  const cobros = stats?.cobros_count ?? 0;
  const porMetodo = stats?.ventas_por_metodo;

  // Lista unificada de movimientos del turno: cobros + sangrías + ingresos
  // en orden cronológico inverso (más reciente primero). La apertura
  // (kind='apertura') queda implícita en el header de la card. El cierre
  // todavía no existió.
  type Entry =
    | { kind: "cobro"; createdAt: string; data: TurnoPayment }
    | { kind: "sangria" | "ingreso"; createdAt: string; data: CajaMovimiento };
  const entries: Entry[] = [
    ...payments.map((p) => ({
      kind: "cobro" as const,
      createdAt: p.created_at,
      data: p,
    })),
    ...movimientos
      .filter((m) => m.kind === "sangria" || m.kind === "ingreso")
      .map((m) => ({
        kind: m.kind as "sangria" | "ingreso",
        createdAt: m.created_at,
        data: m,
      })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // "Abierta hace X" — relativo, conversacional. La hora exacta queda
  // implícita y no satura el header.
  const minutesOpen = Math.floor(
    (Date.now() - new Date(turno.opened_at).getTime()) / 60_000,
  );
  const elapsedLabel = (() => {
    if (minutesOpen < 1) return "ahora";
    if (minutesOpen < 60) return `hace ${minutesOpen}m`;
    const h = Math.floor(minutesOpen / 60);
    const m = minutesOpen % 60;
    return m === 0 ? `hace ${h}h` : `hace ${h}h ${m}m`;
  })();

  return (
    <article className="flex flex-col rounded-2xl bg-white ring-1 ring-zinc-200/70">
      {/* Header simétrico al slot de "abrir caja". */}
      <header className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
            {turno.caja_name}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Abierta {elapsedLabel}
            {turno.encargado_name && ` por ${turno.encargado_name}`}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-800">
          <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
          Abierta
        </span>
      </header>

      {/* Hero compacto: lo que deberías tener en caja. */}
      <div
        className="border-b border-zinc-100 p-5"
        style={{ background: "var(--brand-soft, #F4F4F5)" }}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          En la caja deberías tener
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">
          {formatCurrency(expected)}
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          {formatCurrency(turno.opening_cash_cents)} apertura +{" "}
          {formatCurrency(Math.max(0, expected - turno.opening_cash_cents))} cobrados
        </p>
      </div>

      {/* Cobros del turno: total + breakdown + propinas aparte. */}
      <div className="border-b border-zinc-100 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Cobros del turno
          </p>
          <p className="text-sm font-bold tabular-nums text-zinc-900">
            <span className="text-zinc-500">{cobros} · </span>
            {formatCurrency(ventas)}
          </p>
        </div>
        {porMetodo && cobros > 0 ? (
          <ul className="mt-3 space-y-1.5">
            <MethodRow
              label="Efectivo"
              icon={<Banknote className="size-3.5" />}
              amount={porMetodo.cash ?? 0}
            />
            <MethodRow
              label="MercadoPago QR"
              icon={<QrCode className="size-3.5" />}
              amount={porMetodo.mp_qr ?? 0}
            />
            <MethodRow
              label="MercadoPago link"
              icon={<Link2 className="size-3.5" />}
              amount={porMetodo.mp_link ?? 0}
            />
            <MethodRow
              label="Tarjeta"
              icon={<CreditCard className="size-3.5" />}
              amount={porMetodo.card_manual ?? 0}
            />
            <MethodRow
              label="Otro"
              icon={<MoreHorizontal className="size-3.5" />}
              amount={porMetodo.other ?? 0}
            />
          </ul>
        ) : (
          <p className="mt-3 text-xs text-zinc-500">Todavía no hubo cobros.</p>
        )}
        {propinas > 0 && (
          <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-zinc-100 pt-3">
            <span className="text-xs text-zinc-500">Propinas (aparte)</span>
            <span className="text-sm font-semibold tabular-nums text-zinc-700">
              {formatCurrency(propinas)}
            </span>
          </div>
        )}
      </div>

      {/* Movimientos del turno: cobros + sangrías + ingresos en una sola
          lista cronológica (más reciente arriba). Visible por default con
          scroll interno — la lista puede crecer sin estirar la card. */}
      <div className="border-b border-zinc-100 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Movimientos del turno
          </p>
          <p className="text-xs font-semibold tabular-nums text-zinc-700">
            {entries.length}
          </p>
        </div>
        {entries.length === 0 ? (
          <p className="mt-3 text-xs text-zinc-500">
            Todavía no hubo movimientos.
          </p>
        ) : (
          <ul className="mt-3 max-h-64 divide-y divide-zinc-100 overflow-y-auto rounded-lg ring-1 ring-zinc-200/70">
            {entries.map((e) =>
              e.kind === "cobro" ? (
                <CobroRow key={`p-${e.data.id}`} payment={e.data} />
              ) : (
                <MovimientoRow key={`m-${e.data.id}`} mov={e.data} />
              ),
            )}
          </ul>
        )}
      </div>

      {/* Acciones al pie — Sangría/Ingreso secundarios, Cerrar caja primario.
          Posición simétrica al CTA "Abrir caja" del slot vacío. */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setSangriaOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          <ArrowDownToLine className="size-3.5" /> Sangría
        </button>
        <button
          type="button"
          onClick={() => setIngresoOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          <ArrowUpFromLine className="size-3.5" /> Ingreso
        </button>
        <button
          type="button"
          onClick={() => setCierreOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition hover:brightness-95"
          style={{
            background: "var(--brand, #18181B)",
            color: "var(--brand-foreground, white)",
          }}
        >
          <Lock className="size-3.5" /> Cerrar caja
        </button>
      </div>

      {/* Modales */}
      <MovimientoModal
        open={sangriaOpen}
        onOpenChange={setSangriaOpen}
        title="Registrar sangría"
        description="Sacar efectivo de la caja (depósito en banco, pago a proveedor, etc.). Requiere motivo."
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
            toast.success("Caja cerrada");
            setCierreOpen(false);
            router.refresh();
          })
        }
      />
    </article>
  );
}

function MethodRow({
  label,
  icon,
  amount,
}: {
  label: string;
  icon: React.ReactNode;
  amount: number;
}) {
  // Los métodos sin ventas se ven atenuados; los que sí, prominentes.
  const empty = amount === 0;
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span
        className={cn(
          "inline-flex items-center gap-2",
          empty ? "text-zinc-400" : "text-zinc-700",
        )}
      >
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          empty ? "text-zinc-400" : "text-zinc-900",
        )}
      >
        {empty ? "—" : formatCurrency(amount)}
      </span>
    </li>
  );
}

function MovimientoRow({ mov }: { mov: CajaMovimiento }) {
  const isSangria = mov.kind === "sangria";
  const time = new Date(mov.created_at).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="flex items-start gap-3 px-3 py-2.5">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          isSangria ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
        )}
      >
        {isSangria ? (
          <ArrowDownToLine className="size-3.5" strokeWidth={2.25} />
        ) : (
          <ArrowUpFromLine className="size-3.5" strokeWidth={2.25} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {isSangria ? "Sangría" : "Ingreso"}
            <span className="ml-1.5 text-[10px] font-normal text-zinc-400 tabular-nums">
              {time}
            </span>
          </p>
          <p
            className={cn(
              "shrink-0 text-sm font-bold tabular-nums",
              isSangria ? "text-rose-700" : "text-emerald-700",
            )}
          >
            {isSangria ? "−" : "+"}
            {formatCurrency(mov.amount_cents)}
          </p>
        </div>
        {mov.reason && (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{mov.reason}</p>
        )}
      </div>
    </li>
  );
}

// ── Fila de cobro (entra al turno via payment.caja_turno_id) ────

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  mp_qr: "MercadoPago QR",
  mp_link: "MercadoPago link",
  card_manual: "Tarjeta",
  other: "Otro",
};

function methodIcon(method: PaymentMethod) {
  switch (method) {
    case "cash":
      return Banknote;
    case "mp_qr":
      return QrCode;
    case "mp_link":
      return Link2;
    case "card_manual":
      return CreditCard;
    default:
      return MoreHorizontal;
  }
}

function CobroRow({ payment }: { payment: TurnoPayment }) {
  const Icon = methodIcon(payment.method);
  const time = new Date(payment.created_at).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // "Origen" del cobro: si fue dine_in con mesa → "Mesa N"; si no, intentar
  // customer_name; sino, número de orden. Siempre algo identificable.
  const origen =
    payment.delivery_type === "dine_in" && payment.table_label
      ? `Mesa ${payment.table_label}`
      : payment.customer_name?.trim() ||
        (payment.order_number > 0 ? `#${payment.order_number}` : "Orden");

  return (
    <li className="flex items-start gap-3 px-3 py-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
        <Icon className="size-3.5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {origen}
            <span className="ml-1.5 text-[10px] font-normal text-zinc-400 tabular-nums">
              {time}
            </span>
          </p>
          <p className="shrink-0 text-sm font-bold tabular-nums text-zinc-900">
            +{formatCurrency(payment.amount_cents)}
          </p>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-xs text-zinc-500">
            {METHOD_LABEL[payment.method]}
            {payment.attributed_mozo_name && (
              <>
                <span className="mx-1 text-zinc-300">·</span>
                {payment.attributed_mozo_name}
              </>
            )}
          </p>
          {payment.tip_cents > 0 && (
            <p className="shrink-0 text-[11px] text-emerald-700 tabular-nums">
              +{formatCurrency(payment.tip_cents)} propina
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

// ── Movimiento modal (sangría / ingreso) ───────────────────────

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

// ── Modal de cierre con conciliación (simplificado) ────────────

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

  const cents =
    closing === "" ? null : Math.max(0, Math.round(Number(closing) * 100));
  const diff = cents === null ? 0 : cents - expected;
  const requiresNotes = cents !== null && diff !== 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cerrar caja
            <span className="ml-2 text-sm font-normal text-zinc-500">
              · {cajaName}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Resumen del turno: solo lo esencial para cuadrar. */}
        <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200/70">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Lo que esperás encontrar
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
            {formatCurrency(expected)}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Apertura {formatCurrency(opening)} + cobros en efectivo ({formatCurrency(ventas)})
            {propinas > 0 && ` + propinas (${formatCurrency(propinas)})`}
          </p>
        </div>

        {/* Input cierre */}
        <div className="mt-4 grid gap-1.5">
          <Label className="text-sm font-medium">Efectivo contado en caja</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-semibold text-zinc-400">
              $
            </span>
            <Input
              type="number"
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              placeholder="0"
              autoFocus
              inputMode="decimal"
              className="pl-7 text-base tabular-nums"
            />
          </div>
        </div>

        {/* Diferencia destacada */}
        {cents !== null && diff !== 0 && (
          <div
            className={cn(
              "mt-4 flex items-center justify-between rounded-lg p-3 ring-1",
              diff < 0
                ? "bg-rose-50 ring-rose-200 text-rose-900"
                : "bg-amber-50 ring-amber-200 text-amber-900",
            )}
          >
            <span className="text-sm font-semibold">
              {diff < 0 ? "Te falta" : "Te sobra"}
            </span>
            <span className="text-lg font-bold tabular-nums">
              {diff > 0 ? "+" : "−"}
              {formatCurrency(Math.abs(diff))}
            </span>
          </div>
        )}

        {/* OK cuadrado */}
        {cents !== null && diff === 0 && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200 text-emerald-900">
            <span className="text-sm font-semibold">Cuadra perfecto</span>
            <Banknote className="size-4" />
          </div>
        )}

        {/* Notes obligatorio si diff != 0 */}
        {requiresNotes && (
          <div className="mt-3 grid gap-1.5">
            <Label className="text-sm font-medium">
              ¿Qué pasó?
              <span className="ml-1 text-rose-600">*</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Vuelto mal dado, billete falso, propina mal cargada…"
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
            <Lock className="mr-2 size-4" />
            Cerrar caja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

