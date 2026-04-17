import { notFound } from "next/navigation";

import { getBusiness, getBusinessSettings } from "@/lib/tenant";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const settings = getBusinessSettings(business);
  const primary = settings.primary_color ?? "#0f172a";
  const primaryForeground = settings.primary_foreground ?? "#ffffff";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root{--primary:${primary};--primary-foreground:${primaryForeground};--ring:${primary};}`,
        }}
      />
      {children}
    </>
  );
}
