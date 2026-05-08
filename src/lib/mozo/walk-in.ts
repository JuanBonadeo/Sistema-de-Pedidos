"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { requireMozoActionContext } from "@/lib/mozo/auth";
import { canTransition, nextOpenedAt } from "@/lib/mozo/state-machine";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

type GenericClient = SupabaseClient;

const SentarWalkInInput = z.object({
  tableId: z.string().uuid(),
  partySize: z.number().int().positive(),
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  notes: z.string().trim().optional(),
  slug: z.string().min(1),
});

export type SentarWalkInInput = z.input<typeof SentarWalkInInput>;

export type SentarWalkInResult = {
  customerId: string | null;
  autoAssignedMozo: boolean;
};

/**
 * Sentar un walk-in (CU-08/a):
 *   1. Cross-tenant + canTransition libre→ocupada.
 *   2. Si phone: upsert customer (idempotente por (business_id, phone)).
 *   3. tables.operational_status = 'ocupada', opened_at = now.
 *   4. Auto-asigna mozo si no había (CU-09 R2).
 *   5. **Crea la order open** con customer_name del input (snapshot) +
 *      customer_id si se resolvió. enviarComanda la reusa después al cargar
 *      items. Esto pega el nombre en la card desde el inicio (antes
 *      mostraba "Walk-in" genérico hasta el primer envío).
 *   6. Audit log: status (libre→ocupada) y, si correspondió, assignment.
 *
 * Si el cliente se sienta y se va sin pedir, el encargado anula la mesa
 * → la order open se marca cancelled (`anularMesa`).
 */
export async function sentarWalkIn(
  raw: SentarWalkInInput,
): Promise<ActionResult<SentarWalkInResult>> {
  const parsed = SentarWalkInInput.safeParse(raw);
  if (!parsed.success) {
    return actionError("Datos inválidos.");
  }
  const input = parsed.data;

  const business = await getBusiness(input.slug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  // Cross-tenant: tables → floor_plans → business_id.
  const { data: tableRow } = await service
    .from("tables")
    .select(
      "id, operational_status, opened_at, mozo_id, floor_plans!inner(business_id)",
    )
    .eq("id", input.tableId)
    .maybeSingle();
  if (!tableRow) return actionError("Mesa no encontrada.");
  const fpRaw = (tableRow as unknown as { floor_plans: unknown }).floor_plans;
  const fp = Array.isArray(fpRaw)
    ? (fpRaw[0] as { business_id: string } | undefined)
    : (fpRaw as { business_id: string } | null);
  if (!fp || fp.business_id !== business.id) {
    return actionError("Mesa no encontrada.");
  }
  const table = tableRow as {
    id: string;
    operational_status: "libre" | "ocupada" | "pidio_cuenta";
    opened_at: string | null;
    mozo_id: string | null;
  };

  if (table.operational_status !== "libre") {
    return actionError("La mesa no está libre.");
  }
  if (!canTransition("libre", "ocupada")) {
    return actionError("Transición no permitida.");
  }

  // Customer upsert por (business_id, phone). Idempotente.
  let customerId: string | null = null;
  if (input.phone) {
    const { data: existing } = await service
      .from("customers")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("phone", input.phone)
      .maybeSingle();
    const existingRow = existing as { id: string; name: string | null } | null;
    if (existingRow) {
      customerId = existingRow.id;
      // Actualizar el nombre si llegó uno y difiere del guardado.
      if (input.name && input.name !== existingRow.name) {
        const { error: updErr } = await service
          .from("customers")
          .update({ name: input.name })
          .eq("id", existingRow.id);
        if (updErr) console.error("walk-in customer name update", updErr);
      }
    } else {
      const { data: created, error: insErr } = await service
        .from("customers")
        .insert({
          business_id: business.id,
          phone: input.phone,
          name: input.name ?? null,
        })
        .select("id")
        .single();
      if (insErr) {
        console.error("walk-in customer insert", insErr);
        return actionError("No pudimos guardar el cliente.");
      }
      customerId = (created as { id: string }).id;
    }
  }

  // Auto-asignación: si la mesa no tenía mozo asignado, queda el de la sesión.
  const willAssignMozo = table.mozo_id === null;
  const newMozoId = table.mozo_id ?? ctx.userId;

  const newOpenedAt = nextOpenedAt("libre", "ocupada", table.opened_at);
  const { error: tableErr } = await service
    .from("tables")
    .update({
      operational_status: "ocupada",
      opened_at: newOpenedAt,
      mozo_id: newMozoId,
    })
    .eq("id", table.id);
  if (tableErr) {
    console.error("walk-in table update", tableErr);
    return actionError("No pudimos abrir la mesa.");
  }

  // Crear la order open: snapshot de customer_name/phone para mostrar en
  // la card desde ya. Si ya existe una order open para esta mesa (caso
  // edge: walk-in disparado dos veces), no insertamos otra — el partial
  // unique nos protege.
  const { data: existingOrder } = await service
    .from("orders")
    .select("id")
    .eq("table_id", table.id)
    .eq("business_id", business.id)
    .eq("lifecycle_status", "open")
    .maybeSingle();
  if (!existingOrder) {
    const { error: orderErr } = await service
      .from("orders")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        order_number: 0,
        business_id: business.id,
        customer_name: input.name?.trim() || "Walk-in",
        customer_phone: input.phone?.trim() || "-",
        customer_id: customerId,
        delivery_type: "dine_in",
        table_id: table.id,
        mozo_id: newMozoId,
        lifecycle_status: "open",
        subtotal_cents: 0,
        delivery_fee_cents: 0,
        total_cents: 0,
        delivery_notes: input.notes?.trim() || null,
        payment_method: "cash",
      } as any)
      .select("id");
    if (orderErr) {
      console.error("walk-in order insert", orderErr);
      // No es bloqueante: la mesa quedó ocupada, enviarComanda la creará
      // cuando carguen items. Solo perdemos el snapshot del nombre.
    }
  }

  // Audit: status + (eventualmente) assignment.
  const auditRows: Array<{
    table_id: string;
    business_id: string;
    kind: "status" | "assignment";
    from_value: string | null;
    to_value: string | null;
    by_user_id: string;
  }> = [
    {
      table_id: table.id,
      business_id: business.id,
      kind: "status",
      from_value: "libre",
      to_value: "ocupada",
      by_user_id: ctx.userId,
    },
  ];
  if (willAssignMozo) {
    auditRows.push({
      table_id: table.id,
      business_id: business.id,
      kind: "assignment",
      from_value: null,
      to_value: ctx.userId,
      by_user_id: ctx.userId,
    });
  }
  const { error: auditErr } = await service
    .from("tables_audit_log")
    .insert(auditRows);
  if (auditErr) console.error("walk-in audit", auditErr);

  revalidatePath(`/${input.slug}/mozo`);
  return actionOk({
    customerId,
    autoAssignedMozo: willAssignMozo,
  });
}
