"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChatbotPromptEditor({ businessSlug }: { businessSlug: string }) {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [defaultPrompt, setDefaultPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/chatbot/config?businessSlug=${encodeURIComponent(businessSlug)}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { systemPrompt: string; defaultPrompt: string } =
          await res.json();
        if (cancelled) return;
        setSystemPrompt(data.systemPrompt);
        setDefaultPrompt(data.defaultPrompt);
      } catch (err) {
        if (!cancelled) {
          toast.error(
            `No pude cargar el prompt: ${err instanceof Error ? err.message : "error"}`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/chatbot/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessSlug, systemPrompt }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setDirty(false);
      toast.success("Prompt guardado");
    } catch (err) {
      toast.error(
        `No pude guardar: ${err instanceof Error ? err.message : "error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const restoreDefault = () => {
    setSystemPrompt(defaultPrompt);
    setDirty(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            System prompt
          </h2>
          <p className="text-xs text-zinc-500">
            Markdown libre. Usá{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.7rem]">
              {"{{businessName}}"}
            </code>{" "}
            para interpolar el nombre del negocio.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={restoreDefault}
            disabled={loading || saving}
          >
            <RotateCcw className="size-4" />
            Cargar default
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={loading || saving || !dirty}
          >
            <Save className="size-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <Textarea
        value={systemPrompt}
        onChange={(e) => {
          setSystemPrompt(e.target.value);
          setDirty(true);
        }}
        disabled={loading || saving}
        placeholder={loading ? "Cargando..." : defaultPrompt}
        className="flex-1 resize-none font-mono text-xs leading-relaxed"
      />
    </div>
  );
}
