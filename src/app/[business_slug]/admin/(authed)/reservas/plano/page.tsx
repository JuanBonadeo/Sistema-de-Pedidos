import { redirect } from "next/navigation";

export default async function FloorPlanRedirect({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  redirect(`/${business_slug}/admin/salones`);
}

export const dynamic = "force-dynamic";
