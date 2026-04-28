"use client";

import { useState, useTransition } from "react";
import { Camera, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { generateProductImages } from "@/lib/admin/generate-images-action";
import { cn } from "@/lib/utils";

export function GenerateImagesCard({ slug }: { slug: string }) {
  const [isPending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<{
    total: number;
    found: number;
    not_found: number;
    errors: number;
  } | null>(null);
  const [onlyMissing, setOnlyMissing] = useState(true);

  const handleRun = () => {
    if (
      !window.confirm(
        onlyMissing
          ? "¿Generar fotos de Pexels para todos los productos que NO tienen imagen? Puede tardar 1-3 minutos."
          : "¿Regenerar fotos para TODOS los productos? Esto reemplaza las que ya tengas. Puede tardar varios minutos.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await generateProductImages({
        business_slug: slug,
        only_missing: onlyMissing,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setLastResult(result.data);
      toast.success(
        `${result.data.found} fotos cargadas` +
          (result.data.not_found > 0
            ? ` · ${result.data.not_found} sin match`
            : "") +
          (result.data.errors > 0 ? ` · ${result.data.errors} con error` : ""),
      );
    });
  };

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <header className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "var(--brand, #18181B)",
            color: "var(--brand-foreground, white)",
          }}
        >
          <Camera className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-900">
            Generar fotos automáticamente
          </h2>
          <p className="mt-0.5 text-sm text-zinc-600">
            Buscamos en Pexels una foto para cada producto del menú y la asignamos al
            catálogo. Son fotos de stock genéricas — sirven como placeholder hasta que
            puedas sacar las del local.
          </p>
        </div>
      </header>

      {/* Toggle: solo faltantes vs todos */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <ScopeCard
          active={onlyMissing}
          onSelect={() => setOnlyMissing(true)}
          title="Solo los que no tienen foto"
          sub="Recomendado · respeta lo que ya cargaste"
        />
        <ScopeCard
          active={!onlyMissing}
          onSelect={() => setOnlyMissing(false)}
          title="Todos los productos"
          sub="Reemplaza también las que ya tenías"
        />
      </div>

      {/* Result summary */}
      {lastResult && (
        <div className="mt-4 grid gap-2 rounded-xl bg-emerald-50/50 p-4 ring-1 ring-emerald-200/40 sm:grid-cols-4">
          <Stat label="Procesados" value={lastResult.total} />
          <Stat label="Con foto" value={lastResult.found} accent />
          <Stat label="Sin match" value={lastResult.not_found} />
          <Stat label="Errores" value={lastResult.errors} />
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition hover:brightness-95 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          style={{
            background: "var(--brand, #18181B)",
            color: "var(--brand-foreground, white)",
            boxShadow: "0 10px 24px -14px var(--brand)",
          }}
        >
          {isPending ? (
            <>
              <Sparkles className="size-4 animate-pulse" strokeWidth={2.5} />
              Generando…
            </>
          ) : lastResult ? (
            <>
              <CheckCircle2 className="size-4" strokeWidth={2.5} />
              Volver a generar
            </>
          ) : (
            <>
              <Sparkles className="size-4" strokeWidth={2.5} />
              Generar fotos
            </>
          )}
        </button>
      </div>

      <p className="mt-4 text-xs text-zinc-400">
        Tip: las fotos quedan en{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5">products.image_url</code>{" "}
        apuntando al CDN de Pexels. Podés reemplazarlas una a una desde el catálogo
        cuando tengas las del local.
      </p>
    </section>
  );
}

function ScopeCard({
  active,
  onSelect,
  title,
  sub,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition",
        active
          ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900/10"
          : "border-zinc-200 bg-white hover:border-zinc-300",
      )}
    >
      <span className="text-sm font-semibold text-zinc-900">{title}</span>
      <span className="text-xs text-zinc-500">{sub}</span>
    </button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xl font-semibold tabular-nums",
          accent ? "text-emerald-700" : "text-zinc-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}
