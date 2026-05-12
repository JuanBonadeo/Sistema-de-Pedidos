import { notFound, redirect } from "next/navigation";

import { PageHeader, PageShell } from "@/components/admin/shell/page-shell";
import { canManageBusiness, ensureAdminAccess } from "@/lib/admin/context";
import { getActiveTurnos, getAllCajasForBusiness } from "@/lib/caja/queries";
import { getBusiness } from "@/lib/tenant";

import { CajasClient } from "./cajas-client";

export const dynamic = "force-dynamic";

export default async function CajasPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureAdminAccess(business.id, business_slug);
  // Solo admin: el encargado puede ABRIR turnos pero no configurar cajas.
  if (!canManageBusiness(ctx)) {
    redirect(`/${business_slug}/admin/local?tab=caja`);
  }

  const [cajas, activeTurnos] = await Promise.all([
    getAllCajasForBusiness(business.id),
    getActiveTurnos(business.id),
  ]);

  // Set de cajaIds con turno open, para mostrar la pill "Operando ahora"
  // y bloquear deshabilitar.
  const cajaIdsConTurnoOpen = activeTurnos.map((t) => t.caja_id);

  return (
    <PageShell width="default">
      <PageHeader
        eyebrow="Configuración"
        title="Cajas"
        description="Las cajas físicas del local donde se cobra. Una caja activa puede tener un turno abierto a la vez."
      />
      <CajasClient
        slug={business_slug}
        cajas={cajas}
        cajaIdsConTurnoOpen={cajaIdsConTurnoOpen}
      />
    </PageShell>
  );
}
