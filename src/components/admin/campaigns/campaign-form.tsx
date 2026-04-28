"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Megaphone,
  MessageSquare,
  Percent,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCampaign } from "@/lib/admin/campaigns-actions";
import { MESSAGE_TEMPLATE_PRESETS, renderTemplate } from "@/lib/campaigns/template";
import {
  SEGMENT_LABEL,
  type CustomerSegment,
} from "@/lib/customers/segments";
import { formatPromoDiscount, type PromoDiscountType } from "@/lib/promos/types";
import { cn } from "@/lib/utils";

type AudienceType = "segment" | "all";

const AUDIENCE_SEGMENTS: CustomerSegment[] = [
  "new",
  "frequent",
  "top",
  "inactive",
  "lost",
  "regular",
];

const AUDIENCE_HELP: Record<CustomerSegment, string> = {
  new: "Hicieron 1 pedido en los últimos 14 días.",
  frequent: "Pidieron 5 o más veces.",
  top: "Top 10% en gasto total.",
  inactive: "No piden hace 30–90 días.",
  lost: "No piden hace más de 90 días.",
  regular: "Tienen pedidos pero no entran en otra categoría.",
};

export function CampaignForm({
  slug,
  businessName,
}: {
  slug: string;
  businessName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Step 1: basics ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // ── Step 2: audience ──
  const [audienceType, setAudienceType] = useState<AudienceType>("segment");
  const [audienceSegment, setAudienceSegment] = useState<CustomerSegment>("inactive");

  // ── Step 3: promo ──
  const [discountType, setDiscountType] = useState<PromoDiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<string>("10");
  const [minOrderPesos, setMinOrderPesos] = useState<string>("");
  const [validForDays, setValidForDays] = useState<string>("30");
  const [codePrefix, setCodePrefix] = useState<string>("");

  // ── Step 4: message ──
  const [messageTemplate, setMessageTemplate] = useState<string>(
    MESSAGE_TEMPLATE_PRESETS[0]!.template,
  );

  const promoSnapshot = {
    discount_type: discountType,
    discount_value:
      discountType === "free_shipping"
        ? 0
        : discountType === "percentage"
          ? Number(discountValue) || 0
          : Math.round((Number(discountValue) || 0) * 100),
  };
  const previewDiscount = formatPromoDiscount(promoSnapshot);
  const previewMessage = renderTemplate(messageTemplate, {
    name: "María",
    code: "VUELVE-A1B2C3",
    discount: previewDiscount,
    business: businessName,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Ponele un nombre a la campaña.");
      return;
    }
    if (!messageTemplate.trim()) {
      toast.error("Escribí un mensaje.");
      return;
    }

    const promo_template = {
      discount_type: discountType,
      discount_value:
        discountType === "free_shipping"
          ? 0
          : discountType === "percentage"
            ? Number(discountValue)
            : Math.round(Number(discountValue) * 100),
      min_order_cents:
        minOrderPesos === "" ? 0 : Math.round(Number(minOrderPesos) * 100),
      valid_for_days: validForDays === "" ? null : Number(validForDays),
      single_use: true,
      code_prefix: codePrefix.trim() || undefined,
    };

    startTransition(async () => {
      const result = await createCampaign({
        business_slug: slug,
        name: name.trim(),
        description: description.trim() || undefined,
        audience_type: audienceType,
        audience_segment: audienceType === "segment" ? audienceSegment : null,
        promo_template,
        message_template: messageTemplate,
        channel: "manual",
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Campaña creada. Revisá los recipientes y lanzala cuando quieras.");
      router.push(`/${slug}/admin/campanas/${result.data.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Step 1: name ───────────────────────────────────────────────── */}
      <Card icon={<Sparkles className="size-4" />} title="Nombre interno">
        <Field label="Nombre de la campaña" hint="Solo lo ves vos. Ej: 'Black Friday', 'Reactivación octubre'.">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Reactivación inactivos"
            maxLength={120}
            required
          />
        </Field>
        <Field label="Descripción" hint="Opcional.">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notas para vos…"
            maxLength={300}
          />
        </Field>
      </Card>

      {/* ── Step 2: audience ────────────────────────────────────────────── */}
      <Card icon={<Users className="size-4" />} title="Audiencia">
        <p className="text-sm text-zinc-600">
          ¿A quiénes se la enviás?
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <AudiencePill
            active={audienceType === "segment"}
            onClick={() => setAudienceType("segment")}
            label="Por segmento"
            sub="Filtrar por comportamiento"
          />
          <AudiencePill
            active={audienceType === "all"}
            onClick={() => setAudienceType("all")}
            label="Todos los clientes"
            sub="Toda tu base"
          />
        </div>

        {audienceType === "segment" && (
          <div className="grid gap-2 sm:grid-cols-3">
            {AUDIENCE_SEGMENTS.map((s) => (
              <SegmentCard
                key={s}
                active={audienceSegment === s}
                onClick={() => setAudienceSegment(s)}
                label={SEGMENT_LABEL[s]}
                hint={AUDIENCE_HELP[s]}
              />
            ))}
          </div>
        )}
      </Card>

      {/* ── Step 3: promo ──────────────────────────────────────────────── */}
      <Card icon={<Percent className="size-4" />} title="Descuento que vas a ofrecer">
        <p className="text-sm text-zinc-600">
          Cada cliente recibe un código personal único, de un solo uso.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <DiscountTypeCard
            active={discountType === "percentage"}
            onSelect={() => setDiscountType("percentage")}
            icon={<Percent className="size-5" />}
            label="Porcentaje"
            sub="Ej: 10% off"
          />
          <DiscountTypeCard
            active={discountType === "fixed_amount"}
            onSelect={() => setDiscountType("fixed_amount")}
            icon={<ShoppingBag className="size-5" />}
            label="Monto fijo"
            sub="Ej: $1500 off"
          />
          <DiscountTypeCard
            active={discountType === "free_shipping"}
            onSelect={() => setDiscountType("free_shipping")}
            icon={<Truck className="size-5" />}
            label="Envío gratis"
            sub="Anula el envío"
          />
        </div>

        {discountType !== "free_shipping" && (
          <Field
            label={discountType === "percentage" ? "Porcentaje" : "Monto en pesos"}
            hint={
              discountType === "percentage" ? "Entre 1 y 100." : "Lo restamos del subtotal."
            }
          >
            <div className="relative max-w-[200px]">
              {discountType === "percentage" ? (
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
                max={discountType === "percentage" ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className={discountType === "percentage" ? "pr-8" : "pl-7"}
                required
              />
            </div>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Pedido mínimo" hint="Vacío = sin mínimo.">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                $
              </span>
              <Input
                type="number"
                min={0}
                value={minOrderPesos}
                onChange={(e) => setMinOrderPesos(e.target.value)}
                placeholder="0"
                className="pl-7"
              />
            </div>
          </Field>
          <Field label="Vencimiento" hint="Días desde el lanzamiento.">
            <Input
              type="number"
              min={1}
              value={validForDays}
              onChange={(e) => setValidForDays(e.target.value)}
              placeholder="30"
            />
          </Field>
          <Field label="Prefijo del código" hint="Opcional. Ej: 'VUELVE'.">
            <Input
              value={codePrefix}
              onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
              placeholder="VUELVE"
              maxLength={12}
              className="font-mono uppercase"
            />
          </Field>
        </div>
      </Card>

      {/* ── Step 4: message ─────────────────────────────────────────────── */}
      <Card icon={<MessageSquare className="size-4" />} title="Mensaje">
        <p className="text-sm text-zinc-600">
          Lo que ve cada cliente cuando reciba el WhatsApp. Podés usar:{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">{`{name}`}</code>,{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">{`{code}`}</code>,{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">{`{discount}`}</code>,{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">{`{business}`}</code>.
        </p>

        <div>
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">
            Plantillas sugeridas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MESSAGE_TEMPLATE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setMessageTemplate(p.template)}
                className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Mensaje">
          <Textarea
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            rows={4}
            maxLength={1000}
            required
          />
        </Field>

        {/* Preview */}
        <div className="rounded-xl bg-emerald-50/50 p-4 ring-1 ring-emerald-200/40">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-800">
            <MessageSquare className="size-3" /> Vista previa
          </p>
          <p className="whitespace-pre-wrap text-sm text-zinc-800">
            {previewMessage}
          </p>
        </div>
      </Card>

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <div className="sticky bottom-6 z-10 flex items-center justify-end gap-2 rounded-full bg-white/80 p-2 pl-6 shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-200/70 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/${slug}/admin/campanas`)}
          disabled={isPending}
          className="rounded-full"
        >
          Cancelar
        </Button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all hover:brightness-95 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
          style={{
            background: "var(--brand, #18181B)",
            color: "var(--brand-foreground, white)",
            boxShadow: "0 10px 24px -14px var(--brand)",
          }}
        >
          <Megaphone className="size-4" strokeWidth={2.5} />
          {isPending ? "Creando…" : "Crear campaña"}
        </button>
      </div>
    </form>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70">
      <h2 className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        <span className="text-zinc-400">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
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

function AudiencePill({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition",
        active
          ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900/10"
          : "border-zinc-200 bg-white hover:border-zinc-300",
      )}
    >
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      <span className="text-xs text-zinc-500">{sub}</span>
    </button>
  );
}

function SegmentCard({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
        active
          ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900/10"
          : "border-zinc-200 bg-white hover:border-zinc-300",
      )}
    >
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      <span className="text-xs leading-snug text-zinc-500">{hint}</span>
    </button>
  );
}

function DiscountTypeCard({
  active,
  onSelect,
  icon,
  label,
  sub,
}: {
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
