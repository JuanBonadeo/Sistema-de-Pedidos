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
  canManageCajas,
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

// ── CRUD de cajas físicas ──────────────────────────────────────

/**
 * Crea una caja física del local. Permiso: admin / encargado (mismo gate
 * que abrir turno — quien puede operar puede dar de alta el recurso).
 */
export async function crearCaja(
  name: string,
  businessSlug: string,
): Promise<ActionResult<{ id: string; name: string }>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  if (!canManageCajas(ctx.role)) {
    return actionError("Solo admin puede configurar cajas.");
  }
  const trimmed = name.trim();
  if (trimmed === "") return actionError("La caja necesita un nombre.");
  if (trimmed.length > 60) return actionError("Nombre demasiado largo.");

  const service = createSupabaseServiceClient() as unknown as GenericClient;
  const { data, error } = await service
    .from("cajas")
    .insert({
      business_id: business.id,
      name: trimmed,
      is_active: true,
    })
    .select("id, name")
    .single();

  if (error) {
    if (error.code === "23505") {
      return actionError("Ya existe una caja con ese nombre.");
    }
    return actionError(`No se pudo crear la caja: ${error.message}`);
  }

  revalidatePath(`/${businessSlug}/admin/cajas`);
  revalidatePath(`/${businessSlug}/admin/local`);
  return actionOk({
    id: (data as { id: string }).id,
    name: (data as { name: string }).name,
  });
}

/**
 * Renombrar una caja existente. Admin only. Único por business (FK 23505).
 */
export async function renombrarCaja(
  cajaId: string,
  newName: string,
  businessSlug: string,
): Promise<ActionResult<{ id: string; name: string }>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  if (!canManageCajas(ctx.role)) {
    return actionError("Solo admin puede configurar cajas.");
  }
  const trimmed = newName.trim();
  if (trimmed === "") return actionError("La caja necesita un nombre.");
  if (trimmed.length > 60) return actionError("Nombre demasiado largo.");

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  const caja = await loadCajaForBusiness(service, cajaId, business.id);
  if (!caja) return actionError("Caja no encontrada.");

  const { data, error } = await service
    .from("cajas")
    .update({ name: trimmed })
    .eq("id", cajaId)
    .select("id, name")
    .single();

  if (error) {
    if (error.code === "23505") {
      return actionError("Ya existe una caja con ese nombre.");
    }
    return actionError(`No se pudo renombrar la caja: ${error.message}`);
  }

  revalidatePath(`/${businessSlug}/admin/cajas`);
  revalidatePath(`/${businessSlug}/admin/local`);
  return actionOk({
    id: (data as { id: string }).id,
    name: (data as { name: string }).name,
  });
}

/**
 * Soft-delete: marca `is_active=false`. La caja deja de aparecer para abrir
 * turno pero los turnos históricos siguen accesibles read-only (R6/A6 de
 * CU-06). Si tiene un turno open, falla — primero hay que cerrarlo.
 */
export async function setCajaActive(
  cajaId: string,
  isActive: boolean,
  businessSlug: string,
): Promise<ActionResult<void>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  const ctx = ctxResult.data;

  if (!canManageCajas(ctx.role)) {
    return actionError("Solo admin puede configurar cajas.");
  }

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  const caja = await loadCajaForBusiness(service, cajaId, business.id);
  if (!caja) return actionError("Caja no encontrada.");

  if (!isActive) {
    const { data: openTurno } = await service
      .from("caja_turnos")
      .select("id")
      .eq("caja_id", cajaId)
      .eq("status", "open")
      .maybeSingle();
    if (openTurno) {
      return actionError(
        "No se puede deshabilitar: tiene un turno abierto. Cerralo primero.",
      );
    }
  }

  const { error } = await service
    .from("cajas")
    .update({ is_active: isActive })
    .eq("id", cajaId);
  if (error) return actionError(`No se pudo actualizar la caja: ${error.message}`);

  revalidatePath(`/${businessSlug}/admin/cajas`);
  revalidatePath(`/${businessSlug}/admin/local`);
  return actionOk(undefined);
}

// ── Apertura ───────────────────────────────────────────────────

/**
 * Apertura simple para el flujo conversacional "Abrir caja". Pensado para
 * el 95% de locales con UNA sola caja física: no obliga al usuario a saber
 * que "caja" (config) y "turno" (sesión) son cosas distintas. Si no hay
 * cajas configuradas, crea silenciosamente una llamada "Caja Principal" y
 * le abre turno. Si hay varias activas, usa la primera por sort_order.
 *
 * Para multi-caja real, `abrirTurno(cajaId, ...)` sigue disponible.
 */
export async function abrirCajaConDefault(
  opening_cash_cents: number,
  businessSlug: string,
): Promise<ActionResult<{ turno: CajaTurno }>> {
  const business = await getBusiness(businessSlug);
  if (!business) return actionError("Negocio no encontrado.");

  const ctxResult = await requireMozoActionContext(business.id);
  if (!ctxResult.ok) return ctxResult;
  if (!canOpenCajaTurno(ctxResult.data.role)) {
    return actionError("Solo encargado o admin pueden abrir la caja.");
  }
  if (opening_cash_cents < 0) {
    return actionError("El monto inicial no puede ser negativo.");
  }

  const service = createSupabaseServiceClient() as unknown as GenericClient;

  // Buscar primera caja activa
  const { data: existing } = await service
    .from("cajas")
    .select("id, name")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  let cajaId: string;
  if (existing) {
    cajaId = (existing as { id: string }).id;
  } else {
    // Auto-crear "Caja Principal" — primera vez del local.
    const { data: created, error: createErr } = await service
      .from("cajas")
      .insert({
        business_id: business.id,
        name: "Caja Principal",
        is_active: true,
        sort_order: 0,
      })
      .select("id")
      .single();
    if (createErr || !created) {
      if (createErr?.code === "23505") {
        // Carrera: alguien la creó entre el SELECT y el INSERT. Releemos.
        const { data: retry } = await service
          .from("cajas")
          .select("id")
          .eq("business_id", business.id)
          .eq("name", "Caja Principal")
          .maybeSingle();
        if (!retry) return actionError("No se pudo crear la caja.");
        cajaId = (retry as { id: string }).id;
      } else {
        return actionError(`No se pudo crear la caja: ${createErr?.message ?? "desconocido"}`);
      }
    } else {
      cajaId = (created as { id: string }).id;
    }
  }

  return abrirTurno(cajaId, opening_cash_cents, businessSlug);
}

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

  revalidatePath(`/${businessSlug}/admin/local`);
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

  revalidatePath(`/${businessSlug}/admin/local`);
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
