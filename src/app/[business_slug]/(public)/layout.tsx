export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ business_slug: string }>;
}) {
  return <div className="delivery-theme min-h-screen">{children}</div>;
}
