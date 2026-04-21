import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SettingsSection({
  step,
  icon,
  eyebrow,
  title,
  description,
  aside,
  children,
  className,
}: {
  step?: number;
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-6 rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
            style={{
              background: "var(--brand)",
              color: "var(--brand-foreground)",
            }}
          >
            {icon}
            {step ? (
              <span
                className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white text-[0.65rem] font-bold tabular-nums text-zinc-900 ring-1 ring-zinc-200/70"
                aria-hidden
              >
                {step}
              </span>
            ) : null}
          </span>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 max-w-xl text-sm text-zinc-600">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </header>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

export function SectionField({
  label,
  hint,
  children,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      {label ? (
        <label className="text-sm font-medium text-zinc-900">{label}</label>
      ) : null}
      {children}
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
