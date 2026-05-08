import { notFound } from "next/navigation";

import { getActiveTurnos, getAllCajasForBusiness } from "@/lib/caja/queries";
import { ensureMozoAccess } from "@/lib/mozo/auth";
import { getBusiness } from "@/lib/tenant";

import { CajaClient } from "./caja-client";

export const dynamic = "force-dynamic";

export default async function CajaPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureMozoAccess(business.id, business_slug);

  const [cajas, activeTurnos] = await Promise.all([
    getAllCajasForBusiness(business.id),
    getActiveTurnos(business.id),
  ]);

  return (
    <CajaClient
      slug={business_slug}
      role={ctx.role}
      cajas={cajas}
      activeTurnos={activeTurnos}
    />
  );
}
