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

  // Two scopes:
  //   :root           → shadcn `--primary` tokens (admin + generic UI)
  //   .delivery-theme → the public menu's `--accent` token (hardcoded
  //                     orange in globals.css otherwise).
  //
  // We override both so that the business's branding is consistent between
  // the admin panel (primary-colored buttons) and the customer-facing menu
  // (accent-colored CTA, cart pill, etc).
  const css = `
:root{--primary:${primary};--primary-foreground:${primaryForeground};--ring:${primary};}
.delivery-theme{--accent:${primary};--accent-soft:color-mix(in oklch, ${primary} 6%, #fff);}
`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
