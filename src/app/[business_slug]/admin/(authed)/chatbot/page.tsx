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
    <div className="mx-auto flex h-screen max-w-3xl flex-col p-4">
      <ChatbotPanel
        businessSlug={business_slug}
        businessName={business.name}
      />
    </div>
  );
}
