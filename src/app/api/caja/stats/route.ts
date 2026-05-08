import { NextResponse } from "next/server";

import { ensureMozoAccess } from "@/lib/mozo/auth";
import { getTurnoLiveStats } from "@/lib/caja/queries";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// Endpoint de polling para stats vivos de un turno. El cliente lo llama cada
// 30s. Cross-tenant: el turno tiene que pertenecer al business del usuario,
// y el usuario tiene que ser miembro (mozo+) de ese business.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const turnoId = url.searchParams.get("turno");
  if (!turnoId) {
    return NextResponse.json({ error: "missing turno" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { data: turnoRow } = await service
    .from("caja_turnos")
    .select("id, business_id")
    .eq("id", turnoId)
    .maybeSingle();
  if (!turnoRow) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const businessId = (turnoRow as { business_id: string }).business_id;

  const { data: bizRow } = await service
    .from("businesses")
    .select("slug")
    .eq("id", businessId)
    .single();
  if (!bizRow) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // ensureMozoAccess valida sesión + membership; redirige si falla, lo que
  // en un endpoint REST devuelve 307. Atajamos para responder 401 limpio.
  try {
    await ensureMozoAccess(businessId, bizRow.slug as string);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stats = await getTurnoLiveStats(turnoId, businessId);
  return NextResponse.json({ stats });
}
