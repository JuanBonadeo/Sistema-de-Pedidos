import { PublicTopbar } from "@/components/public/public-topbar";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  return (
    <>
      <PublicTopbar slug={business_slug} />
      {children}
    </>
  );
}
