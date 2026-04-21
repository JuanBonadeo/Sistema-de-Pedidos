"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Paperclip, RotateCcw, Send, Smile, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  at: Date;
};

const STORAGE_KEY = "chatbotTesterContactId";

function randomContactId() {
  return `test-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatbotTester({
  businessSlug,
  businessName,
}: {
  businessSlug: string;
  businessName: string;
}) {
  const [contactIdentifier, setContactIdentifier] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setContactIdentifier(stored);
      else {
        const fresh = randomContactId();
        localStorage.setItem(STORAGE_KEY, fresh);
        setContactIdentifier(fresh);
      }
    } catch {
      setContactIdentifier(randomContactId());
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Auto-grow textarea.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  const persistContact = (value: string) => {
    setContactIdentifier(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setConversationId(null);
    setMessages([]);
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    if (!contactIdentifier.trim()) {
      toast.error("Ingresá un identificador de contacto");
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, at: new Date() },
    ]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug,
          contactIdentifier: contactIdentifier.trim(),
          message: trimmed,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: { conversationId: string; assistantMessage: string } =
        await res.json();
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.assistantMessage, at: new Date() },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`No pude obtener respuesta: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = async () => {
    if (conversationId) {
      try {
        await fetch(
          `/api/chatbot/test?businessSlug=${encodeURIComponent(businessSlug)}&conversationId=${encodeURIComponent(conversationId)}`,
          { method: "DELETE" },
        );
      } catch {
        // ignore
      }
    }
    setConversationId(null);
    setMessages([]);
    toast.success("Nueva conversación");
  };

  const initials =
    businessName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <div className="flex flex-1 flex-col items-center gap-3 pb-4">
      {/* Dev controls — fuera del mockup */}
      <div className="flex w-full max-w-sm flex-wrap items-center gap-2 text-xs">
        <label className="font-medium text-zinc-600" htmlFor="contact-id">
          Tel
        </label>
        <Input
          id="contact-id"
          value={contactIdentifier}
          onChange={(e) => persistContact(e.target.value)}
          placeholder="+5491122334455"
          className="h-7 flex-1 text-xs"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={resetConversation}
          disabled={loading}
        >
          <RotateCcw className="size-3.5" />
          Reiniciar
        </Button>
      </div>

      {/* Phone frame */}
      <div className="relative w-full max-w-sm rounded-[2.5rem] bg-zinc-900 p-2 shadow-2xl ring-1 ring-zinc-800/50">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />

        <div className="flex h-[640px] flex-col overflow-hidden rounded-[2rem] bg-[#EFE9E1]">
          {/* WA header */}
          <div className="flex shrink-0 items-center gap-3 bg-[#008069] px-3 py-2.5 pt-7 text-white">
            <ArrowLeft className="size-5 shrink-0 opacity-80" />
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{businessName}</p>
              <p className="truncate text-[0.65rem] opacity-80">
                {loading ? "escribiendo..." : "en línea"}
              </p>
            </div>
            <Video className="size-5 shrink-0 opacity-80" />
          </div>

          {/* Chat background */}
          <div
            ref={scrollRef}
            className="wa-bg flex-1 overflow-y-auto px-3 py-3"
          >
            {messages.length === 0 && !loading ? (
              <div className="mx-auto mt-8 max-w-[85%] rounded-lg bg-[#FFF3C4] px-3 py-2 text-center text-[0.7rem] text-zinc-700 shadow-sm">
                🔒 Los mensajes están cifrados de extremo a extremo. Escribí
                para empezar a probar el bot.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const isFirstOfRun = !prev || prev.role !== m.role;
                  return (
                    <Bubble
                      key={i}
                      role={m.role}
                      content={m.content}
                      time={formatTime(m.at)}
                      firstOfRun={isFirstOfRun}
                    />
                  );
                })}
                {loading && <TypingBubble />}
              </div>
            )}
          </div>

          {/* Input bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex shrink-0 items-end gap-1.5 bg-[#F0F2F5] px-2 py-2"
          >
            <div className="flex flex-1 items-end gap-1 rounded-3xl bg-white px-3 py-1.5 shadow-sm">
              <Smile className="size-5 shrink-0 translate-y-1 text-zinc-500" />
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Mensaje"
                rows={1}
                className="min-h-[20px] flex-1 resize-none bg-transparent py-1 text-sm leading-5 placeholder:text-zinc-400 focus:outline-none"
                disabled={loading}
              />
              <Paperclip className="size-5 shrink-0 translate-y-1 -rotate-45 text-zinc-500" />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full text-white transition",
                "bg-[#008069] hover:bg-[#006E5C] disabled:bg-zinc-400",
              )}
              aria-label="Enviar"
            >
              <Send className="size-4 translate-x-[-1px]" />
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .wa-bg {
          background-color: #EFE9E1;
          background-image:
            radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 20px 20px, 40px 40px;
          background-position: 0 0, 10px 10px;
        }
      `}</style>
    </div>
  );
}

function Bubble({
  role,
  content,
  time,
  firstOfRun,
}: {
  role: "user" | "assistant";
  content: string;
  time: string;
  firstOfRun: boolean;
}) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
        !firstOfRun && "mt-0.5",
      )}
    >
      <div
        className={cn(
          "relative max-w-[78%] px-2.5 pb-1 pt-1.5 text-sm shadow-sm",
          isUser ? "bg-[#D9FDD3]" : "bg-white",
          "rounded-lg",
          firstOfRun && (isUser ? "rounded-tr-[3px]" : "rounded-tl-[3px]"),
        )}
      >
        <p className="whitespace-pre-wrap break-words pr-10 text-zinc-900">
          {content}
        </p>
        <span className="absolute bottom-0.5 right-2 text-[0.6rem] text-zinc-500">
          {time}
        </span>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-lg rounded-tl-[3px] bg-white px-3 py-2 shadow-sm">
        <div className="flex items-center gap-1">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-zinc-400"
      style={{ animationDelay: delay }}
    />
  );
}
