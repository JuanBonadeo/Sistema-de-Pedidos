import { notFound } from "next/navigation";

import { ChatbotPanel } from "@/components/admin/chatbot-panel";
import { getBusiness } from "@/lib/tenant";

export default async function ChatbotPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  return (
    <div className="flex h-screen flex-col px-6 py-8 lg:px-10 lg:py-10">
      <ChatbotPanel
        businessSlug={business_slug}
        businessName={business.name}
      />
    </div>
  );
}
