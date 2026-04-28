/**
 * Customer segmentation — single source of truth.
 *
 * A customer can belong to multiple segments simultaneously (ej: "frequent" + "top").
 * The vista admin de clientes lo usa para filtrar/mostrar chips. En Fase 3, el
 * lanzador de campañas via WABA va a usar esta misma función para resolver
 * audiencias ("mandar a todos los inactivos") — por eso vive como pure function
 * fuera del módulo `admin/`, así no hay duplicación cliente↔dispatcher.
 */

export type CustomerSegment =
  | "new"
  | "frequent"
  | "top"
  | "inactive"
  | "lost"
  | "regular";

export const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  new: "Nuevo",
  frequent: "Frecuente",
  top: "Top",
  inactive: "Inactivo",
  lost: "Perdido",
  regular: "Regular",
};

/**
 * Tailwind classes for chip rendering. Same color language as STATUS_META.
 */
export const SEGMENT_TONE: Record<CustomerSegment, { dot: string; tone: string }> = {
  new: { dot: "bg-sky-500", tone: "text-sky-800 bg-sky-50" },
  frequent: { dot: "bg-emerald-500", tone: "text-emerald-800 bg-emerald-50" },
  top: { dot: "bg-amber-500", tone: "text-amber-800 bg-amber-50" },
  inactive: { dot: "bg-zinc-400", tone: "text-zinc-700 bg-zinc-100" },
  lost: { dot: "bg-rose-500", tone: "text-rose-800 bg-rose-50" },
  regular: { dot: "bg-zinc-300", tone: "text-zinc-600 bg-zinc-50" },
};

const DAY_MS = 24 * 60 * 60 * 1000;
const NEW_WINDOW_DAYS = 14;
const FREQUENT_THRESHOLD = 5;
const INACTIVE_FROM_DAYS = 30;
const LOST_FROM_DAYS = 90;

export type SegmentInput = {
  order_count: number;
  total_spent_cents: number;
  last_order_at: Date | string | null;
  created_at: Date | string;
};

export type SegmentContext = {
  /** Threshold (typically business p90 of total_spent) above which the customer is "top". */
  topSpenderThresholdCents: number;
  /** Allows "now" to be injected for testability. Defaults to Date.now(). */
  now?: Date;
};

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  return v instanceof Date ? v : new Date(v);
}

export function computeSegments(
  c: SegmentInput,
  ctx: SegmentContext,
): CustomerSegment[] {
  const now = ctx.now ?? new Date();
  const created = toDate(c.created_at)!;
  const lastOrder = toDate(c.last_order_at);

  const segments: CustomerSegment[] = [];

  // "new" — placed only 1 order recently (last 14 days)
  const createdDaysAgo = (now.getTime() - created.getTime()) / DAY_MS;
  if (c.order_count <= 1 && createdDaysAgo <= NEW_WINDOW_DAYS) {
    segments.push("new");
  }

  // "frequent" — 5+ orders
  if (c.order_count >= FREQUENT_THRESHOLD) {
    segments.push("frequent");
  }

  // "top" — total spent in top decile of the business (passed via context)
  if (
    ctx.topSpenderThresholdCents > 0 &&
    c.total_spent_cents >= ctx.topSpenderThresholdCents &&
    c.order_count > 0
  ) {
    segments.push("top");
  }

  // "inactive" / "lost" — based on days since last order. Only meaningful if
  // they did at least one order.
  if (lastOrder && c.order_count > 0) {
    const daysSinceLast = (now.getTime() - lastOrder.getTime()) / DAY_MS;
    if (daysSinceLast >= LOST_FROM_DAYS) {
      segments.push("lost");
    } else if (daysSinceLast >= INACTIVE_FROM_DAYS) {
      segments.push("inactive");
    }
  }

  // Default "regular" if nothing else matched (and they did order)
  if (segments.length === 0 && c.order_count > 0) {
    segments.push("regular");
  }

  return segments;
}

/**
 * Convenience wrapper: does this customer match the given segment filter?
 * Used both by the list filter and by future campaign audience resolution.
 */
export function matchesSegment(
  c: SegmentInput,
  ctx: SegmentContext,
  filter: CustomerSegment | "all",
): boolean {
  if (filter === "all") return true;
  return computeSegments(c, ctx).includes(filter);
}
