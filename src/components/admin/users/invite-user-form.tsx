"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Copy, Link2, MessageCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inviteBusinessMemberByAdmin,
  type InvitePayload,
} from "@/lib/admin/members-actions";
import { cn } from "@/lib/utils";

const Schema = z.object({
  email: z.string().email("Email inválido."),
  role: z.enum(["admin", "staff"]),
});

type Values = z.infer<typeof Schema>;

export function InviteUserForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InvitePayload | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "", role: "admin" },
  });

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    try {
      const r = await inviteBusinessMemberByAdmin({
        business_slug: slug,
        ...values,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setResult(r.data);
      if (r.data.inviteLink) {
        toast.success(
          r.data.isNewUser
            ? "Invitación lista. Copiala y mandásela."
            : "Acceso actualizado. Tenés un link para que entre directo.",
        );
      } else {
        toast.success(`${values.email} ya tiene acceso.`);
      }
      form.reset({ email: "", role: "admin" });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-wrap items-end gap-3"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="min-w-60 flex-1">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="miembro@ejemplo.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="w-40">
                <FormLabel>Rol</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all hover:brightness-95 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
            style={{
              background: "var(--brand)",
              color: "var(--brand-foreground)",
              boxShadow: "0 10px 24px -14px var(--brand)",
            }}
          >
            <UserPlus className="size-4" strokeWidth={1.75} />
            {submitting ? "Generando…" : "Generar invitación"}
          </button>
        </form>
      </Form>

      {result ? (
        <InviteResultCard result={result} onDismiss={() => setResult(null)} />
      ) : (
        <p className="flex items-start gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600 ring-1 ring-zinc-200/60">
          <Link2 className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
          <span>
            Generamos un link de invitación que podés compartir por WhatsApp,
            DM o el canal que quieras. No mandamos mail automáticamente.
          </span>
        </p>
      )}
    </div>
  );
}

function InviteResultCard({
  result,
  onDismiss,
}: {
  result: InvitePayload;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!result.inviteLink) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200/70">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-emerald-200">
          <Check className="size-4 text-emerald-600" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-900">
            {result.email} ya tiene acceso
          </p>
          <p className="mt-0.5 text-xs text-emerald-800/80">
            No pudimos generar un link de ingreso directo. Puede entrar con su
            contraseña actual en la pantalla de login.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold text-emerald-800 hover:underline"
        >
          OK
        </button>
      </div>
    );
  }

  const link = result.inviteLink;
  const headline = result.isNewUser
    ? `Link listo para ${result.email}`
    : `${result.email} ya tenía cuenta`;
  const subtitle = result.isNewUser
    ? "Al abrirlo, el miembro crea su contraseña y entra al panel."
    : "Generamos un magic link para que entre directo, aunque nunca se haya logueado.";
  const waBody = result.isNewUser
    ? `Te invito a entrar al panel de Pedidos. Abrí este link para crear tu contraseña:\n\n${link}`
    : `Ya tenés acceso al panel de Pedidos. Abrí este link para entrar directo:\n\n${link}`;
  const waMessage = encodeURIComponent(waBody);
  const waHref = `https://wa.me/?text=${waMessage}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("No pudimos copiar automáticamente. Seleccioná manual.");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70">
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: `color-mix(in srgb, var(--brand) 8%, white)`,
        }}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "var(--brand)",
            color: "var(--brand-foreground)",
          }}
        >
          <Link2 className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">{headline}</p>
          <p className="text-xs text-zinc-600">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          Cerrar
        </button>
      </div>

      <div className="grid gap-3 p-4">
        <div className="flex items-stretch gap-2">
          <code className="flex-1 overflow-hidden truncate rounded-xl bg-zinc-50 px-3 py-2.5 font-mono text-xs text-zinc-700 ring-1 ring-zinc-200/60">
            {link}
          </code>
          <button
            type="button"
            onClick={copy}
            className={cn(
              "inline-flex h-auto items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
              copied
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-zinc-900 text-zinc-50 hover:bg-zinc-800",
            )}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <MessageCircle className="size-3.5" strokeWidth={2} />
            Compartir por WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              const mailHref = `mailto:${result.email}?subject=${encodeURIComponent("Invitación al panel de Pedidos")}&body=${waMessage}`;
              window.location.href = mailHref;
            }}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            Abrir en mail
          </button>
        </div>
        <p className="text-[0.7rem] text-zinc-500">
          El link expira en unas horas según la config de Supabase. Si vence,
          generá otro desde acá.
        </p>
      </div>
    </div>
  );
}
