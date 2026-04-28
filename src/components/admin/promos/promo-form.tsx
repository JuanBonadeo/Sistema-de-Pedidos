"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Percent, ShoppingBag, Truck, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPromoCode,
  updatePromoCode,
} from "@/lib/admin/promos-actions";
import type { PromoCode, PromoDiscountType } from "@/lib/promos/types";
import { cn } from "@/lib/utils";

type FormState = {
  code: string;
  description: string;
  discount_type: PromoDiscountType;
  discount_value: string;
  min_order_pesos: string;
  max_uses: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
};

function fromInitial(p: PromoCode | undefined): FormState {
  if (!p) {
    return {
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_pesos: "",
      max_uses: "",
      valid_from: "",
      valid_until: "",
      is_active: true,
    };
  }
  return {
    code: p.code,
    description: p.description ?? "",
    discount_type: p.discount_type,
    discount_value:
      p.discount_type === "percentage"
        ? String(p.discount_value)
        : p.discount_type === "fixed_amount"
          ? String(Math.round(p.discount_value / 100))
          : "",
    min_order_pesos:
      p.min_order_cents > 0 ? String(Math.round(p.min_order_cents / 100)) : "",
    max_uses: p.max_uses === null ? "" : String(p.max_uses),
    valid_from: p.valid_from ? p.valid_from.slice(0, 16) : "",
    valid_until: p.valid_until ? p.valid_until.slice(0, 16) : "",
    is_active: p.is_active,
  };
}

export function PromoForm({
  slug,
  mode,
  initial,
}: {
  slug: string;
  mode: "create" | "edit";
  initial?: PromoCode;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(fromInitial(initial));
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert UI types to action input
    const discount_value =
      form.discount_type === "free_shipping"
        ? 0
        : form.discount_type === "percentage"
          ? Number(form.discount_value)
          : Math.round(Number(form.discount_value) * 100);

    const min_order_cents =
      form.min_order_pesos === ""
        ? 0
        : Math.round(Number(form.min_order_pesos) * 100);

    const payload = {
      business_slug: slug,
      ...(mode === "edit" && initial ? { id: initial.id } : {}),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      discount_type: form.discount_type,
      discount_value,
      min_order_cents,
      max_uses: form.max_uses === "" ? "" : Number(form.max_uses),
      valid_from: form.valid_from || undefined,
      valid_until: form.valid_until || undefined,
      is_active: form.is_active,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPromoCode(payload)
          : await updatePromoCode(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(mode === "create" ? "Promoción creada." : "Cambios guardados.");
      router.push(`/${slug}/admin/promociones`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Code + description ─────────────────────────────────────────── */}
      <Card>
        <SectionTitle>Código</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Código" hint="Ej: VUELVE10. Mayúsculas, letras, números, guiones.">
            <Input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="VUELVE10"
              className="font-mono uppercase"
              maxLength={30}
              required
            />
          </Field>
          <Field label="Descripción" hint="Opcional. Sólo lo ves vos en el panel.">
            <Input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder='Ej: "Para clientes inactivos"'
              maxLength={200}
            />
          </Field>
        </div>
      </Card>

      {/* ── Discount type ──────────────────────────────────────────────── */}
      <Card>
        <SectionTitle>Tipo de descuento</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <DiscountTypeCard
            type="percentage"
            active={form.discount_type === "percentage"}
            onSelect={() => set("discount_type", "percentage")}
            icon={<Percent className="size-5" />}
            label="Porcentaje"
            sub="Ej: 10% off"
          />
          <DiscountTypeCard
            type="fixed_amount"
            active={form.discount_type === "fixed_amount"}
            onSelect={() => set("discount_type", "fixed_amount")}
            icon={<ShoppingBag className="size-5" />}
            label="Monto fijo"
            sub="Ej: $1500 off"
          />
          <DiscountTypeCard
            type="free_shipping"
            active={form.discount_type === "free_shipping"}
            onSelect={() => set("discount_type", "free_shipping")}
            icon={<Truck className="size-5" />}
            label="Envío gratis"
            sub="Anula el costo de envío"
          />
        </div>

        {/* Value input — hidden for free_shipping */}
        {form.discount_type !== "free_shipping" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label={form.discount_type === "percentage" ? "Porcentaje" : "Monto en pesos"}
              hint={
                form.discount_type === "percentage"
                  ? "Entre 1 y 100."
                  : "Lo restamos del subtotal del pedido."
              }
            >
              <div className="relative">
                {form.discount_type === "percentage" ? (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                    %
                  </span>
                ) : (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                    $
                  </span>
                )}
                <Input
                  type="number"
                  min={1}
                  max={form.discount_type === "percentage" ? 100 : undefined}
                  step={1}
                  value={form.discount_value}
                  onChange={(e) => set("discount_value", e.target.value)}
                  className={form.discount_type === "percentage" ? "pr-8" : "pl-7"}
                  required
                />
              </div>
            </Field>
          </div>
        )}
      </Card>

      {/* ── Restrictions ──────────────────────────────────────────────── */}
      <Card>
        <SectionTitle>Restricciones</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Pedido mínimo"
            hint="0 = sin mínimo. El subtotal del cliente debe igualar o superar este monto."
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                $
              </span>
              <Input
                type="number"
                min={0}
                step={1}
                value={form.min_order_pesos}
                onChange={(e) => set("min_order_pesos", e.target.value)}
                placeholder="0"
                className="pl-7"
              />
            </div>
          </Field>
          <Field
            label="Usos máximos"
            hint="Vacío = ilimitado. Cuando llega al máximo se rechaza automáticamente."
          >
            <Input
              type="number"
              min={1}
              step={1}
              value={form.max_uses}
              onChange={(e) => set("max_uses", e.target.value)}
              placeholder="Ilimitado"
            />
          </Field>
          <Field label="Válido desde" hint="Opcional. Si está vacío, vale desde hoy.">
            <Input
              type="datetime-local"
              value={form.valid_from}
              onChange={(e) => set("valid_from", e.target.value)}
            />
          </Field>
          <Field label="Válido hasta" hint="Opcional. Si está vacío, no vence.">
            <Input
              type="datetime-local"
              value={form.valid_until}
              onChange={(e) => set("valid_until", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* ── Active toggle ──────────────────────────────────────────────── */}
      <Card>
        <button
          type="button"
          onClick={() => set("is_active", !form.is_active)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition",
            form.is_active
              ? "border-emerald-200 bg-emerald-50/40"
              : "border-zinc-200 bg-white hover:border-zinc-300",
          )}
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Zap className="size-4" />
              {form.is_active ? "Promoción activa" : "Promoción pausada"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {form.is_active
                ? "Los clientes pueden aplicarla en el checkout."
                : "El código existe pero los clientes no pueden usarlo."}
            </p>
          </div>
          <span
            aria-hidden
            className={cn(
              "relative flex h-6 w-11 shrink-0 items-center rounded-full transition",
              form.is_active ? "bg-emerald-500" : "bg-zinc-300",
            )}
          >
            <span
              className={cn(
                "absolute size-5 rounded-full bg-white shadow-sm transition",
                form.is_active ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </span>
        </button>
      </Card>

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div className="sticky bottom-6 z-10 flex items-center justify-end gap-2 rounded-full bg-white/80 p-2 pl-6 shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-200/70 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/${slug}/admin/promociones`)}
          disabled={isPending}
          className="rounded-full"
        >
          Cancelar
        </Button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold transition-all hover:brightness-95 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
          style={{
            background: "var(--brand, #18181B)",
            color: "var(--brand-foreground, white)",
            boxShadow: "0 10px 24px -14px var(--brand)",
          }}
        >
          {isPending
            ? "Guardando…"
            : mode === "create"
              ? "Crear promoción"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
      {children}
    </h2>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function DiscountTypeCard({
  active,
  onSelect,
  icon,
  label,
  sub,
}: {
  type: PromoDiscountType;
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition",
        active
          ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900/10"
          : "border-zinc-200 bg-white hover:border-zinc-300",
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600",
        )}
      >
        {icon}
      </span>
      <span className="mt-1 text-sm font-semibold text-zinc-900">{label}</span>
      <span className="text-xs text-zinc-500">{sub}</span>
    </button>
  );
}
