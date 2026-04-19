import Link from "next/link";

/**
 * Shows a payment-specific banner above the order tracker when relevant.
 * - MP + pending   → "procesando tu pago" (poller keeps refreshing)
 * - MP + failed    → "no se pudo completar" + retry CTA
 * - Anything else  → null (order is confirmed or cash, no banner needed)
 */
export function PaymentBanner({
  slug,
  paymentStatus,
  paymentMethod,
}: {
  slug: string;
  paymentStatus: string;
  paymentMethod: string;
}) {
  if (paymentMethod !== "mp") return null;

  if (paymentStatus === "pending") {
    return (
      <div
        style={{
          margin: "12px 16px",
          padding: "12px 14px",
          borderRadius: 12,
          background: "color-mix(in oklch, var(--accent) 10%, #fff)",
          border: "1px solid color-mix(in oklch, var(--accent) 25%, transparent)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: 99,
            background: "var(--accent)",
            animation: "mp-pulse 1.4s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            Procesando tu pago
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 2 }}>
            Estamos esperando la confirmación de Mercado Pago. Puede tardar
            unos segundos.
          </div>
        </div>
        <style>{`
          @keyframes mp-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.3); }
          }
        `}</style>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div
        style={{
          margin: "12px 16px",
          padding: "12px 14px",
          borderRadius: 12,
          background: "#FCEDE5",
          border: "1px solid #F4C9B0",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: 99,
            background: "#B94A2A",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#6B2E17" }}>
            No pudimos completar el pago
          </div>
          <div style={{ fontSize: 11, color: "#8C4A30", marginTop: 2 }}>
            Podés volver al menú y hacer el pedido de nuevo, o elegir pagar en
            efectivo.
          </div>
        </div>
        <Link
          href={`/${slug}/menu`}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#B94A2A",
            textDecoration: "none",
            padding: "6px 12px",
            borderRadius: 99,
            border: "1px solid #E5AB8D",
            background: "#fff",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Volver al menú
        </Link>
      </div>
    );
  }

  return null;
}
