"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  ChevronRight,
  Megaphone,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { deleteCampaign } from "@/lib/admin/campaigns-actions";
import type { Campaign } from "@/lib/campaigns/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  Campaign["status"],
  { label: string; tone: string; dot: string }
> = {
  draft: {
    label: "Borrador",
    tone: "text-amber-800 bg-amber-50",
    dot: "bg-amber-500",
  },
  sending: {
    label: "Enviando",
    tone: "text-sky-800 bg-sky-50",
    dot: "bg-sky-500",
  },
  sent: {
    label: "Lanzada",
    tone: "text-emerald-800 bg-emerald-50",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelada",
    tone: "text-zinc-700 bg-zinc-100",
    dot: "bg-zinc-400",
  },
};

export function CampaignsListClient({
  slug,
  initialCampaigns,
}: {
  slug: string;
  initialCampaigns: Campaign[];
}) {
  const [isPending, startTransition] = useTransition();

  const onDelete = (id: string, name: string) => {
    if (
      !window.confirm(
        `¿Eliminar la campaña "${name}"? Si fue lanzada, los códigos personales seguirán siendo válidos para los clientes que ya recibieron el mensaje.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteCampaign({ business_slug: slug, campaign_id: id });
      if (!result.ok) toast.error(result.error);
      else toast.success("Campaña eliminada.");
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Campañas
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            Campañas de marketing
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Mandales una promo personalizada a un segmento de clientes. Por ahora se envía con
            tu WhatsApp personal — cuando conectes WhatsApp Business se va a automatizar.
          </p>
        </div>
        <Link
          href={`/${slug}/admin/campanas/nueva`}
          className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold transition hover:brightness-95 active:translate-y-px"
          style={{
            background: "var(--brand, #18181B)",
            color: "var(--brand-foreground, white)",
          }}
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Nueva campaña
        </Link>
      </div>

      {initialCampaigns.length === 0 ? (
        <EmptyState slug={slug} />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70">
          <ul>
            {initialCampaigns.map((c, idx) => (
              <CampaignRow
                key={c.id}
                campaign={c}
                slug={slug}
                striped={idx % 2 === 1}
                isPending={isPending}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CampaignRow({
  campaign,
  slug,
  striped,
  isPending,
  onDelete,
}: {
  campaign: Campaign;
  slug: string;
  striped: boolean;
  isPending: boolean;
  onDelete: (id: string, name: string) => void;
}) {
  const meta = STATUS_META[campaign.status];
  const audienceLabel =
    campaign.audience_type === "all"
      ? "Todos los clientes"
      : campaign.audience_type === "manual"
        ? "Selección manual"
        : `Segmento: ${campaign.audience_segment ?? "—"}`;

  const redemptionRate =
    campaign.audience_count > 0
      ? Math.round((campaign.redeemed_count / campaign.audience_count) * 100)
      : 0;

  return (
    <li
      style={
        striped
          ? { background: "color-mix(in oklch, var(--brand, #2563eb) 14%, white)" }
          : undefined
      }
      className="border-b border-zinc-100 last:border-b-0"
    >
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <Link
          href={`/${slug}/admin/campanas/${campaign.id}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "var(--brand, #2563eb)",
              color: "var(--brand-foreground, white)",
            }}
          >
            <Megaphone className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-zinc-900">
              {campaign.name}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {audienceLabel} · {campaign.audience_count} clientes
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          {campaign.status === "sent" && campaign.audience_count > 0 && (
            <div
              className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-700"
              title={`${campaign.redeemed_count} de ${campaign.audience_count} clientes usaron su código`}
            >
              <TrendingUp className="size-3" />
              {redemptionRate}% canjeado
            </div>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
              meta.tone,
            )}
          >
            <span className={cn("size-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>

          <button
            type="button"
            onClick={() => onDelete(campaign.id, campaign.name)}
            disabled={isPending}
            title="Eliminar"
            className="inline-flex size-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-wait disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
          </button>

          <Link
            href={`/${slug}/admin/campanas/${campaign.id}`}
            className="inline-flex items-center text-zinc-300 transition hover:text-zinc-500"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </li>
  );
}

function EmptyState({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-12 text-center ring-1 ring-zinc-200/70">
      <Megaphone className="size-8 text-zinc-300" strokeWidth={1.5} />
      <p className="text-sm font-medium text-zinc-700">
        Todavía no creaste campañas
      </p>
      <p className="max-w-sm text-xs text-zinc-500">
        Una campaña te deja mandar una promo personalizada a un grupo de clientes.
        Por ejemplo: &ldquo;10% off para todos los clientes inactivos&rdquo;.
      </p>
      <Link
        href={`/${slug}/admin/campanas/nueva`}
        className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:brightness-95"
        style={{
          background: "var(--brand, #18181B)",
          color: "var(--brand-foreground, white)",
        }}
      >
        <Plus className="size-4" strokeWidth={2.5} />
        Crear la primera campaña
      </Link>
    </div>
  );
}
