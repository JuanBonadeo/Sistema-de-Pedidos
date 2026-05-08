import { NextResponse } from "next/server";

import { ensureMozoAccess } from "@/lib/mozo/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// Polling endpoint para que la UI de cobro chequee si un payment MP ya quedó
// paid (vía webhook). Cross-tenant: el payment debe ser de un business del
// que el usuario es miembro mozo+.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const service = createSupabaseServiceClient();
  const { data: paymentRow } = await service
    .from("payments")
    .select("id, business_id, payment_status, mp_payment_id")
    .eq("id", id)
    .maybeSingle();
  if (!paymentRow) return NextResponse.json({ error: "not found" }, { status: 404 });

  const businessId = (paymentRow as { business_id: string }).business_id;
  const { data: bizRow } = await service
    .from("businesses")
    .select("slug")
    .eq("id", businessId)
    .single();
  if (!bizRow) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    await ensureMozoAccess(businessId, bizRow.slug as string);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    payment_status: (paymentRow as { payment_status: string }).payment_status,
    mp_payment_id: (paymentRow as { mp_payment_id: string | null }).mp_payment_id,
  });
}
