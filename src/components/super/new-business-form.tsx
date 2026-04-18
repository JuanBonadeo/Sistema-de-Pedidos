"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
import { createBusiness } from "@/lib/platform/actions";

const Schema = z.object({
  name: z.string().min(1, "Requerido.").max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Sólo minúsculas, números y guiones."),
  timezone: z.string().min(1),
  owner_email: z.string().email("Email inválido."),
});

type Values = z.infer<typeof Schema>;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function NewBusinessForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: "",
      slug: "",
      timezone: "America/Argentina/Buenos_Aires",
      owner_email: "",
    },
  });

  const autoSlug = form.watch("slug") === "";
  const nameValue = form.watch("name");

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    try {
      const result = await createBusiness(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Negocio creado. Invitación enviada a ${values.owner_email}.`,
      );
      // Hard navigate to avoid race with the action's revalidatePath.
      window.location.href = `/super/negocios/${result.data.id}`;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-5"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del negocio</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  placeholder="Pizza Napoli"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    if (autoSlug) {
                      form.setValue("slug", slugify(e.target.value), {
                        shouldValidate: false,
                      });
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Slug <span className="text-muted-foreground">(URL)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="pizzanapoli" {...field} />
              </FormControl>
              <FormMessage />
              {nameValue && !field.value && (
                <p className="text-muted-foreground text-xs">
                  Se genera automáticamente desde el nombre.
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zona horaria</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="owner_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email del owner</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="dueno@ejemplo.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-muted-foreground text-xs">
                Le enviamos un mail con un link para que configure su contraseña.
              </p>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creando…" : "Crear e invitar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
