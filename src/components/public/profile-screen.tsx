"use client";

import Link from "next/link";

import { I } from "@/components/delivery/primitives";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ProfileScreen({
  slug,
  firstName,
  lastName,
  email,
}: {
  slug: string;
  firstName: string;
  lastName: string;
  email: string;
}) {
  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = `/${slug}/menu`;
  };

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          paddingTop: 16,
          paddingBottom: 8,
          paddingLeft: 8,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          href={`/${slug}/menu`}
          aria-label="Cerrar"
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {I.close("var(--ink)", 20)}
        </Link>
      </div>

      <div style={{ flex: 1, paddingBottom: 40 }}>
        <div style={{ padding: "16px 24px 32px" }}>
          <div
            className="d-display"
            style={{
              fontSize: 36,
              lineHeight: 1.05,
              color: "var(--ink)",
            }}
          >
            {firstName} {lastName}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
            {email}
          </div>
        </div>

        <div style={{ padding: "0 24px" }}>
          <MenuRow label="Mis pedidos" />
          <MenuRow label="Direcciones" />
          <MenuRow label="Métodos de pago" />
          <MenuRow label="Ayuda" last />
        </div>

        <div style={{ padding: "40px 24px 0" }}>
          <button
            onClick={handleSignOut}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--ink-3)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuRow({ label, last }: { label: string; last?: boolean }) {
  return (
    <button
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        padding: "18px 0",
        background: "none",
        border: "none",
        borderBottom: last ? "none" : "1px solid var(--hairline)",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        style={{ flex: 1, fontSize: 15, color: "var(--ink)", fontWeight: 500 }}
      >
        {label}
      </span>
      {I.chevRight("var(--ink-3)", 14)}
    </button>
  );
}
