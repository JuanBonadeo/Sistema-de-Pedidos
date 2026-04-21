"use client";

import { useState } from "react";

import { I, ImageTile } from "@/components/delivery/primitives";
import { formatCurrency } from "@/lib/currency";
import type { MenuDailyMenu } from "@/lib/menu";
import { useCart } from "@/stores/cart";

/**
 * Drawer de detalle del menú del día. Muestra todos los componentes + botón
 * "Agregar". El botón construye un CartItem con `kind: 'daily_menu'` y
 * `modifiers: []` (los combos cerrados no se customizan en V1).
 */
export function DailyMenuSheet({
  slug,
  menu,
  open,
  onOpenChange,
  disabled,
}: {
  slug: string;
  menu: MenuDailyMenu | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  const addItem = useCart(slug, (s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  // Reset de cantidad cuando cambia el menú seleccionado (no se mezcla entre
  // aperturas). `open` también lo cierra visualmente antes del reset, pero
  // mantenemos el valor en 1 al reabrir.
  if (!open || !menu) return null;

  const lineTotal = menu.price_cents * quantity;

  const handleAdd = () => {
    addItem({
      id: crypto.randomUUID(),
      kind: "daily_menu",
      daily_menu_id: menu.id,
      components_snapshot: menu.components.map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
      })),
      product_name: menu.name,
      unit_price_cents: menu.price_cents,
      quantity,
      image_url: menu.image_url,
      modifiers: [],
    });
    setQuantity(1);
    onOpenChange(false);
  };

  return (
    <div
      onClick={() => onOpenChange(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.38)",
        animation: "d-fade-in 200ms",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          borderRadius: "18px 18px 0 0",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          animation: "d-sheet-up 260ms cubic-bezier(.2,.8,.2,1)",
          maxWidth: 520,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div
          style={{ padding: "8px 0 0", display: "flex", justifyContent: "center" }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 4,
              background: "var(--hairline-2)",
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <ImageTile
              src={menu.image_url}
              alt={menu.name}
              tone="#E9C88A"
              radius={0}
              sizes="520px"
              style={{ height: 200, marginTop: 10 }}
            />
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Cerrar"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 34,
                height: 34,
                borderRadius: 99,
                border: "none",
                background: "rgba(255,255,255,0.92)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {I.close("var(--ink)", 16)}
            </button>
          </div>

          <div style={{ padding: "16px 16px 8px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 8px",
                borderRadius: 99,
                background: "#FFF0CF",
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                color: "#8A5E18",
              }}
            >
              Menú del día
            </div>
            <div
              className="d-display"
              style={{
                fontSize: 26,
                lineHeight: 1.1,
                color: "var(--ink)",
                marginTop: 6,
              }}
            >
              {menu.name}
            </div>
            {menu.description && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-2)",
                  marginTop: 6,
                  lineHeight: 1.4,
                }}
              >
                {menu.description}
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>
              {formatCurrency(menu.price_cents)}
            </div>
          </div>

          <div
            style={{
              borderTop: "8px solid #F3EEE4",
              padding: "14px 16px 18px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                color: "var(--ink-3)",
                marginBottom: 10,
              }}
            >
              Incluye
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {menu.components.map((c, idx) => (
                <li
                  key={c.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    paddingBottom: 12,
                    borderBottom:
                      idx === menu.components.length - 1
                        ? "none"
                        : "1px solid var(--hairline)",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      borderRadius: 99,
                      background: "#FFF0CF",
                      color: "#8A5E18",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {c.label}
                    </div>
                    {c.description && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "var(--ink-2)",
                          marginTop: 2,
                          lineHeight: 1.4,
                        }}
                      >
                        {c.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ height: 12 }} />
        </div>

        <div
          style={{
            padding: "12px 16px 22px",
            borderTop: "1px solid var(--hairline)",
            background: "var(--bg)",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 48,
              borderRadius: 99,
              border: "1px solid var(--hairline-2)",
              background: "#fff",
            }}
          >
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Menos"
              style={{
                width: 44,
                height: 46,
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {I.minus("var(--ink)", 18)}
            </button>
            <span
              style={{
                minWidth: 20,
                textAlign: "center",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
              aria-label="Más"
              style={{
                width: 44,
                height: 46,
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {I.plus("var(--ink)", 18)}
            </button>
          </div>
          <button
            disabled={disabled}
            onClick={handleAdd}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 99,
              background: disabled ? "#D8CFC0" : "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: -0.1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 18px",
            }}
          >
            <span>Agregar</span>
            <span>{formatCurrency(lineTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
