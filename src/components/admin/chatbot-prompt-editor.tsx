"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Code,
  Eye,
  Pencil,
  RotateCcw,
  Save,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { MarkdownPreview } from "@/components/admin/markdown-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  buildEnabledToolsList,
  buildEnabledToolsMarkdown,
  TOOL_GROUPS,
  TOOL_METADATA,
  type ToolGroup,
  type ToolMetadata,
  type ToolOverrides,
} from "@/lib/chatbot/tools-metadata";
import { cn } from "@/lib/utils";

const ALL_TOOL_NAMES = TOOL_METADATA.map((t) => t.name);

type ToolDefaults = Record<string, { promptSection: string }>;

/**
 * Resolves the same placeholders the server does in agent.ts (keep in sync).
 * Used only by the preview panel — the server still holds the canonical logic.
 */
function resolvePromptPlaceholders(
  template: string,
  businessName: string,
  enabledTools: string[] | null,
  toolOverrides: ToolOverrides,
): string {
  return template
    .replaceAll("{{businessName}}", businessName)
    .replaceAll("{{enabled_tools_list}}", buildEnabledToolsList(enabledTools))
    .replaceAll(
      "{{enabled_tools_markdown}}",
      buildEnabledToolsMarkdown(enabledTools, toolOverrides),
    );
}

export function ChatbotPromptEditor({
  businessSlug,
  businessName,
}: {
  businessSlug: string;
  businessName: string;
}) {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [defaultPrompt, setDefaultPrompt] = useState("");
  const [enabledTools, setEnabledTools] = useState<string[] | null>(null);
  const [toolOverrides, setToolOverrides] = useState<ToolOverrides>({});
  const [toolDefaults, setToolDefaults] = useState<ToolDefaults>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [editingTool, setEditingTool] = useState<ToolMetadata | null>(null);
  const [promptView, setPromptView] = useState<"edit" | "preview">("preview");
  const [resolveVars, setResolveVars] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/chatbot/config?businessSlug=${encodeURIComponent(businessSlug)}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: {
          systemPrompt: string;
          defaultPrompt: string;
          enabledTools: string[] | null;
          toolOverrides: ToolOverrides;
          toolDefaults: ToolDefaults;
        } = await res.json();
        if (cancelled) return;
        setSystemPrompt(data.systemPrompt);
        setDefaultPrompt(data.defaultPrompt);
        setEnabledTools(data.enabledTools);
        setToolOverrides(data.toolOverrides ?? {});
        setToolDefaults(data.toolDefaults ?? {});
      } catch (err) {
        if (!cancelled) {
          toast.error(
            `No pude cargar la config: ${err instanceof Error ? err.message : "error"}`,
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

  const enabledSet = useMemo(
    () => new Set(enabledTools ?? ALL_TOOL_NAMES),
    [enabledTools],
  );

  const toggleTool = (name: string) => {
    setDirty(true);
    setEnabledTools((prev) => {
      const current = new Set(prev ?? ALL_TOOL_NAMES);
      if (current.has(name)) current.delete(name);
      else current.add(name);
      if (current.size === ALL_TOOL_NAMES.length) return null;
      return [...current];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/chatbot/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug,
          systemPrompt,
          enabledTools,
          toolOverrides,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setDirty(false);
      toast.success("Configuración guardada");
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

  const updateToolOverride = (name: string, value: string) => {
    setDirty(true);
    setToolOverrides((prev) => {
      const next = { ...prev };
      if (value.trim().length === 0) {
        delete next[name];
      } else {
        next[name] = { promptSection: value };
      }
      return next;
    });
  };

  const depWarnings = useMemo(() => {
    const warnings: string[] = [];
    for (const t of TOOL_METADATA) {
      if (!enabledSet.has(t.name) || !t.dependsOn) continue;
      const missing = t.dependsOn.filter((d) => !enabledSet.has(d));
      if (missing.length > 0) {
        warnings.push(`${t.label} necesita: ${missing.join(", ")}`);
      }
    }
    return warnings;
  }, [enabledSet]);

  const grouped = useMemo(() => {
    const map = new Map<ToolGroup, ToolMetadata[]>();
    for (const t of TOOL_METADATA) {
      const list = map.get(t.group) ?? [];
      list.push(t);
      map.set(t.group, list);
    }
    return map;
  }, []);

  const enabledCount = enabledSet.size;
  const totalCount = ALL_TOOL_NAMES.length;
  const overrideCount = Object.keys(toolOverrides).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Configuración del chatbot
          </h2>
          <p className="text-xs text-zinc-500">
            Prompt del sistema + qué tools puede usar. Usá{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.7rem]">
              {"{{businessName}}"}
            </code>
            ,{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.7rem]">
              {"{{enabled_tools_list}}"}
            </code>{" "}
            y{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.7rem]">
              {"{{enabled_tools_markdown}}"}
            </code>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
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

      {/* Tools section (collapsible) */}
      <section className="mb-3 rounded-lg border border-zinc-200 bg-white">
        <button
          type="button"
          onClick={() => setToolsOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition hover:bg-zinc-50"
        >
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-zinc-500" />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Herramientas disponibles
              </p>
              <p className="text-[0.7rem] text-zinc-500">
                {enabledCount} de {totalCount} activas
                {overrideCount > 0 && (
                  <span className="ml-1 text-primary">
                    · {overrideCount} personalizada
                    {overrideCount === 1 ? "" : "s"}
                  </span>
                )}
                {depWarnings.length > 0 && (
                  <span className="ml-1 text-amber-600">
                    · {depWarnings.length} aviso
                    {depWarnings.length === 1 ? "" : "s"}
                  </span>
                )}
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "size-4 text-zinc-400 transition",
              toolsOpen && "rotate-180",
            )}
          />
        </button>

        {toolsOpen && (
          <div className="border-t border-zinc-100">
            {depWarnings.length > 0 && (
              <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <ul className="space-y-0.5">
                  {depWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="divide-y divide-zinc-100">
              {(Object.keys(TOOL_GROUPS) as ToolGroup[]).map((group) => {
                const meta = TOOL_GROUPS[group];
                const tools = grouped.get(group) ?? [];
                return (
                  <div key={group}>
                    <div className="bg-zinc-50 px-4 py-1.5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-600">
                        {meta.label}
                      </p>
                    </div>
                    {tools.map((t) => {
                      const on = enabledSet.has(t.name);
                      const hasOverride = Boolean(
                        toolOverrides[t.name]?.promptSection,
                      );
                      return (
                        <div
                          key={t.name}
                          className={cn(
                            "flex items-start gap-3 px-4 py-2 transition",
                            loading || saving
                              ? "opacity-50"
                              : "hover:bg-zinc-50",
                          )}
                        >
                          <label className="flex flex-1 cursor-pointer items-start gap-3">
                            <Toggle on={on} disabled={loading || saving} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-zinc-900">
                                  {t.label}
                                </span>
                                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.6rem] text-zinc-600">
                                  {t.name}
                                </code>
                                {hasOverride && (
                                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary">
                                    personalizada
                                  </span>
                                )}
                              </div>
                              <p className="text-[0.7rem] text-zinc-500">
                                {t.description}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={on}
                              onChange={() => toggleTool(t.name)}
                              disabled={loading || saving}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditingTool(t)}
                            disabled={loading || saving}
                            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
                            aria-label={`Editar documentación de ${t.label}`}
                            title="Editar documentación"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Prompt — edit/preview toggle + textarea or rendered */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600">
          System prompt
        </span>
        <div className="flex items-center gap-3">
          {promptView === "preview" && (
            <label className="flex cursor-pointer items-center gap-1.5 text-[0.7rem] text-zinc-600">
              <input
                type="checkbox"
                checked={resolveVars}
                onChange={(e) => setResolveVars(e.target.checked)}
                className="size-3 rounded border-zinc-300"
              />
              Resolver variables
            </label>
          )}
          <div className="flex gap-1 rounded-md bg-zinc-100 p-0.5 text-[0.7rem]">
            <ViewTab
              active={promptView === "preview"}
              onClick={() => setPromptView("preview")}
              icon={<Eye className="size-3" />}
            >
              Vista previa
            </ViewTab>
            <ViewTab
              active={promptView === "edit"}
              onClick={() => setPromptView("edit")}
              icon={<Code className="size-3" />}
            >
              Editar
            </ViewTab>
          </div>
        </div>
      </div>
      {promptView === "edit" ? (
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
      ) : (
        <MarkdownPreview
          source={
            resolveVars
              ? resolvePromptPlaceholders(
                  systemPrompt || defaultPrompt,
                  businessName,
                  enabledTools,
                  toolOverrides,
                )
              : systemPrompt || defaultPrompt
          }
          className="flex-1"
        />
      )}

      {editingTool && (
        <ToolOverrideDialog
          tool={editingTool}
          defaultSection={
            toolDefaults[editingTool.name]?.promptSection ??
            editingTool.promptSection
          }
          currentOverride={
            toolOverrides[editingTool.name]?.promptSection ?? ""
          }
          onClose={() => setEditingTool(null)}
          onSave={(value) => {
            updateToolOverride(editingTool.name, value);
            setEditingTool(null);
          }}
        />
      )}
    </div>
  );
}

function ToolOverrideDialog({
  tool,
  defaultSection,
  currentOverride,
  onClose,
  onSave,
}: {
  tool: ToolMetadata;
  defaultSection: string;
  currentOverride: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  // Empty value means "use default" — that's what we persist.
  const [value, setValue] = useState(currentOverride);
  const [view, setView] = useState<"edit" | "preview">("preview");
  const isCustom =
    value.trim().length > 0 && value.trim() !== defaultSection.trim();

  const effective = value.trim().length > 0 ? value : defaultSection;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-[min(960px,95vw)] max-w-none overflow-hidden sm:max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Documentación de</span>
            <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-sm text-zinc-800">
              {tool.name}
            </code>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          <p className="text-xs text-zinc-500">
            Este bloque es lo que el LLM lee sobre esta tool. Si lo dejás vacío
            se usa el default del sistema. Si lo editás, se guarda una versión
            personalizada para este negocio.
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-md bg-zinc-100 p-0.5 text-[0.7rem]">
              <ViewTab
                active={view === "preview"}
                onClick={() => setView("preview")}
                icon={<Eye className="size-3" />}
              >
                Vista previa
              </ViewTab>
              <ViewTab
                active={view === "edit"}
                onClick={() => setView("edit")}
                icon={<Code className="size-3" />}
              >
                Editar
              </ViewTab>
            </div>
            <button
              type="button"
              onClick={() => setValue(defaultSection)}
              className="text-[0.7rem] text-zinc-500 hover:text-zinc-900"
            >
              Cargar default
            </button>
          </div>

          {view === "edit" ? (
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={18}
              placeholder={defaultSection}
              className="resize-none font-mono text-xs leading-relaxed"
            />
          ) : (
            <MarkdownPreview
              source={effective}
              className="max-h-[55vh] min-h-[16rem]"
            />
          )}

          <div className="flex items-center justify-between text-[0.7rem]">
            <span className={cn(isCustom ? "text-primary" : "text-zinc-500")}>
              {isCustom
                ? "Usando versión personalizada"
                : "Usando default del sistema"}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setValue("");
              onSave("");
            }}
          >
            Quitar personalización
          </Button>
          <Button onClick={() => onSave(value)}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewTab({
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
        "flex items-center gap-1 rounded px-2 py-1 font-medium transition",
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

function Toggle({ on, disabled }: { on: boolean; disabled: boolean }) {
  return (
    <span
      className={cn(
        "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition",
        on ? "bg-primary" : "bg-zinc-300",
        disabled && "opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition",
          on ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </span>
  );
}
