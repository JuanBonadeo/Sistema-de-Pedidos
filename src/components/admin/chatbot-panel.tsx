"use client";

import { ChatbotPromptEditor } from "@/components/admin/chatbot-prompt-editor";
import { ChatbotTester } from "@/components/admin/chatbot-tester";

export function ChatbotPanel({
  businessSlug,
  businessName,
}: {
  businessSlug: string;
  businessName: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="pb-4 lg:pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Chatbot
        </h1>
        <p className="text-sm text-zinc-500">
          Probá cómo se comporta el bot en WhatsApp. Editá el prompt y las
          herramientas. Todo en vivo.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
        {/* Tester (phone) — fixed width on desktop */}
        <aside className="flex shrink-0 justify-center lg:w-96 lg:justify-start">
          <ChatbotTester
            businessSlug={businessSlug}
            businessName={businessName}
          />
        </aside>

        {/* Configuration — takes the rest */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ChatbotPromptEditor
            businessSlug={businessSlug}
            businessName={businessName}
          />
        </section>
      </div>
    </div>
  );
}
