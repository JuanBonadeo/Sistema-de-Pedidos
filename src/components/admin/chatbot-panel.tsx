"use client";

import { useState } from "react";
import { MessageSquare, SlidersHorizontal } from "lucide-react";

import { ChatbotPromptEditor } from "@/components/admin/chatbot-prompt-editor";
import { ChatbotTester } from "@/components/admin/chatbot-tester";
import { cn } from "@/lib/utils";

type Tab = "chat" | "prompt";

export function ChatbotPanel({
  businessSlug,
  businessName,
}: {
  businessSlug: string;
  businessName: string;
}) {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <>
      <header className="flex items-end justify-between gap-4 pb-4">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Chatbot (testing)</h1>
          <p className="text-xs text-zinc-500">
            Probá el bot y editá su prompt. El mismo agente se va a usar para
            WhatsApp.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
          <TabButton
            active={tab === "chat"}
            onClick={() => setTab("chat")}
            icon={<MessageSquare className="size-4" />}
          >
            Chat
          </TabButton>
          <TabButton
            active={tab === "prompt"}
            onClick={() => setTab("prompt")}
            icon={<SlidersHorizontal className="size-4" />}
          >
            Prompt
          </TabButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {tab === "chat" ? (
          <ChatbotTester
            businessSlug={businessSlug}
            businessName={businessName}
          />
        ) : (
          <ChatbotPromptEditor businessSlug={businessSlug} />
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition",
        active
          ? "bg-white text-zinc-900 shadow-sm"
          : "text-zinc-500 hover:text-zinc-900",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
