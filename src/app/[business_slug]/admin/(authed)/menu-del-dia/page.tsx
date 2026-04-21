import { redirect } from "next/navigation";

export default async function MenuDelDiaRedirect({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  redirect(`/${business_slug}/admin/catalogo?tab=menu-del-dia`);
}

export const dynamic = "force-dynamic";
