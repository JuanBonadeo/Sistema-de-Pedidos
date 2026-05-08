"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { actionError, actionOk, type ActionResult } from "@/lib/actions";
import { assignMozoToTable } from "@/lib/mozo/actions";
import { requireMozoActionContext } from "@/lib/mozo/auth";
import {
  canAcceptCajaDifference,
  canAssignMozo,
  canCloseCajaTurno,
  canMakeSangria,
  canOpenCajaTurno,
} from "@/lib/permissions/can";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

import { getTurnoLiveStats } from "./queries";
import type { CajaTurno } from "./types";

type GenericClient = SupabaseClient;

// ── Helpers internos ───────────────────────────────────────────

async function loadCajaForBusiness(
  service: GenericClient,
  cajaId: string,
  businessId: string,
): Promise<{ id: string; is_active: boolean } | null> {
  const { data } = await service
    .from("cajas")
    .select("id, business_id, is_active")
    .eq("id", cajaId)
    .maybeSingle();
  if (!data) return null;
  const row = data as { id: string; business_id: string; is_active: boolean };
  if (row.business_id !== businessId) return null;
  return { id: row.id, is_active: row.is_active };
}

async function loadTurnoForBusiness(
  service: GenericClient,
  turnoId: string,
  businessId: string,
): Promise<CajaTurno | null> {
  const { data } = await service
    .from("caja_turnos")
    .select(
      "id, caja_id, business_id, encargado_id, opening_cash_cents, expected_cash_cents, closing_cash_cents, difference_cents, closing_notes, status, opened_at, closed_at",
    )
    .eq("id", turnoId)
    .maybeSingle();
  if (!data) return null;
  const row = data as CajaTurno;
  if (row.business_id !== businessId) return null;
  return row;
}

// ── Apertura ───────────────────────────────────────────────────

export async function abrirTurno(
  cajaId: string,
  opening_cash_cents: number,
  businessSlug: string,
): Promise<ActionResult<{ turno: CajaTurno }>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  if (!canOpenCajaTurno(ctx.role)) {
    return actionError("Solo encargado o admin pueden abrir turno de caja.");
  }
  if (opening_cash_cents < 0) {
    return actionError("El monto inicial no puede ser negativo.");
  }

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  const caja = await loadCajaForBusiness(service, cajaId, business.id);
  if (!caja) return actionError("Caja no encontrada.");
  if (!caja.is_active) return actionError("Caja inactiva. Pedile al admin que la habilite.");

  const { data: inserted, error } = await service
    .from("caja_turnos")
    .insert({
      caja_id: cajaId,
      business_id: business.id,
      encargado_id: ctx.userId,
      opening_cash_cents,
      status: "open",
    })
    .select(
      "id, caja_id, business_id, encargado_id, opening_cash_cents, expected_cash_cents, closing_cash_cents, difference_cents, closing_notes, status, opened_at, closed_at",
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      // Partial unique caja_turnos_one_open_per_caja.
      return actionError("Ya hay un turno abierto en esta caja.");
    }
    return actionError(`No se pudo abrir el turno: ${error.message}`);
  }

  const turno = inserted as CajaTurno;

  await service.from("caja_movimientos").insert({
    caja_turno_id: turno.id,
    business_id: business.id,
    kind: "apertura",
    amount_cents: opening_cash_cents,
    reason: null,
    created_by: ctx.userId,
  });

  revalidatePath(`/${businessSlug}/caja`);
  revalidatePath(`/${businessSlug}/admin/local`);
  return actionOk({ turno });
}

// ── Cierre ─────────────────────────────────────────────────────

export async function cerrarTurno(
  turnoId: string,
  closing_cash_cents: number,
  closing_notes: string | null,
  businessSlug: string,
): Promise<ActionResult<{ turno: CajaTurno }>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  if (!canCloseCajaTurno(ctx.role)) {
    return actionError("Solo encargado o admin pueden cerrar turno.");
  }
  if (closing_cash_cents < 0) {
    return actionError("El monto de cierre no puede ser negativo.");
  }

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  const turno = await loadTurnoForBusiness(service, turnoId, business.id);
  if (!turno) return actionError("Turno no encontrado.");
  if (turno.status !== "open") return actionError("El turno ya está cerrado.");

  const stats = await getTurnoLiveStats(turnoId, business.id);
  if (!stats) return actionError("No se pudieron calcular los stats del turno.");
  const expected_cash_cents = stats.expected_cash_cents;
  const difference_cents = closing_cash_cents - expected_cash_cents;

  if (difference_cents !== 0) {
    if (!closing_notes || closing_notes.trim() === "") {
      return actionError(
        "Hay diferencia con el efectivo esperado. Tenés que registrar el motivo en las notas.",
      );
    }
    if (!canAcceptCajaDifference(ctx.role, difference_cents)) {
      return actionError(
        "La diferencia excede tu autorización. Pedile al admin que cierre el turno.",
      );
    }
  }

  const { data: updated, error } = await service
    .from("caja_turnos")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      expected_cash_cents,
      closing_cash_cents,
      difference_cents,
      closing_notes: closing_notes?.trim() || null,
    })
    .eq("id", turnoId)
    .select(
      "id, caja_id, business_id, encargado_id, opening_cash_cents, expected_cash_cents, closing_cash_cents, difference_cents, closing_notes, status, opened_at, closed_at",
    )
    .single();

  if (error) return actionError(`No se pudo cerrar el turno: ${error.message}`);

  await service.from("caja_movimientos").insert({
    caja_turno_id: turnoId,
    business_id: business.id,
    kind: "cierre",
    amount_cents: closing_cash_cents,
    reason: closing_notes?.trim() || null,
    created_by: ctx.userId,
  });

  revalidatePath(`/${businessSlug}/caja`);
  revalidatePath(`/${businessSlug}/admin/local`);
  return actionOk({ turno: updated as CajaTurno });
}

// ── Movimientos manuales ───────────────────────────────────────

export async function registrarSangria(
  turnoId: string,
  amount_cents: number,
  reason: string,
  businessSlug: string,
): Promise<ActionResult<void>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  if (!canMakeSangria(ctx.role)) {
    return actionError("Solo encargado o admin pueden registrar una sangría.");
  }
  if (amount_cents <= 0) return actionError("El monto debe ser mayor a 0.");
  if (!reason || reason.trim() === "") {
    return actionError("La sangría requiere un motivo.");
  }

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  const turno = await loadTurnoForBusiness(service, turnoId, business.id);
  if (!turno) return actionError("Turno no encontrado.");
  if (turno.status !== "open") {
    return actionError("No se puede operar sobre un turno cerrado.");
  }

  const { error } = await service.from("caja_movimientos").insert({
    caja_turno_id: turnoId,
    business_id: business.id,
    kind: "sangria",
    amount_cents,
    reason: reason.trim(),
    created_by: ctx.userId,
  });
  if (error) return actionError(`No se pudo registrar la sangría: ${error.message}`);

  revalidatePath(`/${businessSlug}/caja`);
  return actionOk(undefined);
}

export async function registrarIngreso(
  turnoId: string,
  amount_cents: number,
  reason: string | null,
  businessSlug: string,
): Promise<ActionResult<void>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  if (!canMakeSangria(ctx.role)) {
    return actionError("Solo encargado o admin pueden registrar un ingreso.");
  }
  if (amount_cents <= 0) return actionError("El monto debe ser mayor a 0.");

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  const turno = await loadTurnoForBusiness(service, turnoId, business.id);
  if (!turno) return actionError("Turno no encontrado.");
  if (turno.status !== "open") {
    return actionError("No se puede operar sobre un turno cerrado.");
  }

  const { error } = await service.from("caja_movimientos").insert({
    caja_turno_id: turnoId,
    business_id: business.id,
    kind: "ingreso",
    amount_cents,
    reason: reason?.trim() || null,
    created_by: ctx.userId,
  });
  if (error) return actionError(`No se pudo registrar el ingreso: ${error.message}`);

  revalidatePath(`/${businessSlug}/caja`);
  return actionOk(undefined);
}

// ── Distribución masiva del salón (Paso 2 del wizard) ──────────

export async function distribuirSalon(
  input: {
    assignments: Array<{ tableId: string; mozoId: string | null }>;
    slug: string;
  },
): Promise<ActionResult<{ count: number }>> {
  const business = await getBusiness(input.slug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  if (!canAssignMozo(ctx.role)) {
    return actionError("Solo encargado o admin pueden distribuir el salón.");
  }

  let count = 0;
  for (const a of input.assignments) {
    const r = await assignMozoToTable(a.tableId, a.mozoId, input.slug);
    if (!r.ok) return actionError(`Falló asignar mesa: ${r.error}`);
    count += 1;
  }

  return actionOk({ count });
}
