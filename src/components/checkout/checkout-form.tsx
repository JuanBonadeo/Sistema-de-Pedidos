"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { I } from "@/components/delivery/primitives";
import { formatCurrency } from "@/lib/currency";
import { createOrder } from "@/lib/orders/create-order";
import { cartTotal, useCart } from "@/stores/cart";

type PaymentId = "mp" | "cash" | "pickup-cash";

export function CheckoutForm({
  slug,
  businessName,
  businessAddress,
  deliveryFeeCents,
  estimatedMinutes,
  savedAddresses = [],
  mpEnabled = false,
  initialName = "",
  initialEmail = "",
}: {
  slug: string;
  businessName: string;
  businessAddress: string | null;
  deliveryFeeCents: number;
  estimatedMinutes: number | null;
  savedAddresses?: { id: string; street: string }[];
  mpEnabled?: boolean;
  initialName?: string;
  initialEmail?: string;
}) {
  const router = useRouter();
  const items = useCart(slug, (s) => s.items);
  const clearCart = useCart(slug, (s) => s.clear);
  const [submitting, setSubmitting] = useState(false);

  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [apt, setApt] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [email] = useState(initialEmail);
  const [payment, setPayment] = useState<PaymentId>(mpEnabled ? "mp" : "cash");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<{
    address?: string;
    phone?: string;
    name?: string;
  }>({});

  const isPickup = mode === "pickup";
  const subtotal = cartTotal(items);
  const deliveryFee = isPickup ? 0 : deliveryFeeCents;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (isPickup && payment === "cash") setPayment("pickup-cash");
    else if (!isPickup && payment === "pickup-cash") setPayment("cash");
  }, [isPickup, payment]);

  const paymentOptions: { id: PaymentId; label: string; sub: string }[] = [
    ...(mpEnabled
      ? [
          {
            id: "mp" as const,
            label: "Mercado Pago",
            sub: "Pagás ahora desde la app",
          },
        ]
      : []),
    isPickup
      ? {
          id: "pickup-cash" as const,
          label: "Efectivo al retirar",
          sub: "Pagás en el local",
        }
      : {
          id: "cash" as const,
          label: "Efectivo al recibir",
          sub: "Indicá con cuánto abonás",
        },
  ];

  const phoneOk = /^\+?[\d\s-]{8,}$/.test(phone);

  const submit = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Ingresá tu nombre.";
    if (!phoneOk) next.phone = "Teléfono inválido.";
    if (!isPickup && address.trim().length < 5) {
      next.address = "Completá la dirección.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    if (items.length === 0) {
      toast.error("Tu carrito está vacío.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrder({
        business_slug: slug,
        delivery_type: mode,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim() || undefined,
        delivery_address: isPickup
          ? undefined
          : `${address.trim()}${apt.trim() ? ` · ${apt.trim()}` : ""}`,
        delivery_notes: notes.trim() || undefined,
        payment_method: payment === "mp" ? "mp" : "cash",
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          notes: i.notes,
          modifier_ids: i.modifiers.map((m) => m.modifier_id),
        })),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      clearCart();
      // If MP returned a redirect URL, kick the user to Checkout Pro.
      // Otherwise (cash / pickup-cash) go straight to the tracking page.
      if (result.data.mp_init_point) {
        window.location.href = result.data.mp_init_point;
        return;
      }
      router.push(`/${slug}/confirmacion/${result.data.order_id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-2)",
          padding: 32,
          textAlign: "center",
        }}
      >
        Tu carrito está vacío.
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 110,
      }}
    >
      {/* Header */}
      <div
        style={{
          paddingTop: 16,
          paddingBottom: 10,
          paddingLeft: 8,
          paddingRight: 16,
          display: "flex",
          alignItems: "center",
          gap: 4,
          borderBottom: "1px solid var(--hairline)",
          background: "var(--bg)",
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          style={{
            width: 40,
            height: 40,
            border: "none",
            background: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {I.chevLeft("var(--ink)", 22)}
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.1 }}>
          Finalizar pedido
        </div>
      </div>

      {/* Collapsible summary */}
      <button
        onClick={() => setSummaryOpen(!summaryOpen)}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "none",
          border: "none",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 99,
              background: "#F1EBDF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {I.bag("var(--ink-2)", 14)}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {items.length} ítems · {formatCurrency(total)}
          </span>
        </span>
        <span
          style={{
            transform: summaryOpen ? "rotate(180deg)" : "none",
            transition: "transform 200ms",
          }}
        >
          {I.chevDown("var(--ink-3)", 16)}
        </span>
      </button>
      {summaryOpen && (
        <div
          style={{
            padding: "4px 16px 16px",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                fontSize: 13,
                color: "var(--ink-2)",
              }}
            >
              <span>
                {it.quantity}× {it.product_name}
              </span>
              <span>
                {formatCurrency(
                  (it.unit_price_cents +
                    it.modifiers.reduce((a, m) => a + m.price_delta_cents, 0)) *
                    it.quantity,
                )}
              </span>
            </div>
          ))}
          <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} muted />
          <SummaryRow
            label={isPickup ? "Retiro" : "Envío"}
            value={isPickup ? "Gratis" : formatCurrency(deliveryFee)}
            muted
          />
          <SummaryRow label="Total" value={formatCurrency(total)} />
        </div>
      )}

      {/* Mode */}
      <Section title="¿Cómo lo recibís?">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {([
            {
              id: "delivery",
              label: "Envío a domicilio",
              sub: estimatedMinutes ? `${estimatedMinutes} min` : "30–45 min",
            },
            { id: "pickup", label: "Retiro en el local", sub: "15–20 min" },
          ] as const).map((o) => {
            const sel = mode === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setMode(o.id)}
                style={{
                  padding: "14px 12px",
                  borderRadius: 12,
                  border: `1.5px solid ${sel ? "var(--accent)" : "var(--hairline-2)"}`,
                  background: sel ? "var(--accent-soft)" : "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                  {o.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}>
                  {o.sub}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {!isPickup ? (
        <Section title="Entrega">
          {savedAddresses.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-2)",
                  marginBottom: 6,
                }}
              >
                Mis direcciones
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {savedAddresses.map((a) => {
                  const sel = address === a.street;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setAddress(a.street);
                        setApt("");
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 99,
                        border: `1px solid ${sel ? "var(--accent)" : "var(--hairline-2)"}`,
                        background: sel ? "var(--accent-soft)" : "#fff",
                        color: "var(--ink)",
                        fontSize: 12,
                        cursor: "pointer",
                        maxWidth: "100%",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={a.street}
                    >
                      {a.street}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Field label="Dirección" error={errors.address}>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle y número"
              autoComplete="street-address"
              style={inputStyle(!!errors.address)}
            />
          </Field>
          <Field label="Piso / depto (opcional)">
            <input
              value={apt}
              onChange={(e) => setApt(e.target.value)}
              placeholder="3° B"
              style={inputStyle()}
            />
          </Field>
          <Field label="Notas para el repartidor">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: timbre no funciona, llamar al celu"
              style={inputStyle()}
            />
          </Field>
        </Section>
      ) : (
        <Section title="Retirá en">
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: "4px 0 14px",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                flexShrink: 0,
                background: "#E8D9BA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {I.store("var(--ink)", 20)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{businessName}</div>
              {businessAddress && (
                <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>
                  {businessAddress}
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                Listo en 15–20 min
              </div>
            </div>
          </div>
          <Field label="Notas (opcional)">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: pasame la cuenta cuando llegue"
              style={inputStyle()}
            />
          </Field>
        </Section>
      )}

      <Section title="Contacto">
        <Field label="Nombre" error={errors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            style={inputStyle(!!errors.name)}
          />
        </Field>
        <Field label="Teléfono" error={errors.phone}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="11 5555 5555"
            inputMode="tel"
            autoComplete="tel"
            style={inputStyle(!!errors.phone)}
          />
        </Field>
      </Section>

      <Section title="Método de pago">
        {paymentOptions.map((p) => (
          <button
            key={p.id}
            onClick={() => setPayment(p.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 0",
              background: "none",
              border: "none",
              borderBottom: "1px solid var(--hairline)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 99,
                flexShrink: 0,
                border: `1.6px solid ${payment === p.id ? "var(--accent)" : "var(--hairline-2)"}`,
                background: payment === p.id ? "var(--accent)" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {payment === p.id && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: "#fff",
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
                {p.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>
                {p.sub}
              </div>
            </div>
          </button>
        ))}
      </Section>

      <div
        style={{
          padding: "12px 16px",
          fontSize: 11,
          color: "var(--ink-3)",
          textAlign: "center",
        }}
      >
        {isPickup ? `Retirás en ${businessName}` : `Pedido de ${businessName}`}
      </div>

      <div
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: 20,
          zIndex: 20,
          maxWidth: 496,
          margin: "0 auto",
        }}
      >
        <button
          disabled={submitting}
          onClick={submit}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 14,
            background: submitting ? "#C7BBA6" : "var(--accent)",
            color: "#fff",
            border: "none",
            cursor: submitting ? "wait" : "pointer",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: -0.1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
          }}
        >
          <span>{submitting ? "Procesando…" : "Confirmar pedido"}</span>
          <span>{formatCurrency(total)}</span>
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "18px 16px 4px",
        borderBottom: "8px solid #F3EEE4",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 6 }}>
        {label}
      </div>
      {children}
      {error && (
        <div style={{ fontSize: 12, color: "#B94A2A", marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 14,
        color: muted ? "var(--ink-2)" : "var(--ink)",
        padding: "4px 0",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function inputStyle(err?: boolean): React.CSSProperties {
  return {
    width: "100%",
    height: 44,
    padding: "0 14px",
    borderRadius: 10,
    border: `1px solid ${err ? "#E0A898" : "var(--hairline-2)"}`,
    background: "#fff",
    fontSize: 15,
    color: "var(--ink)",
    outline: "none",
    boxSizing: "border-box",
  };
}
