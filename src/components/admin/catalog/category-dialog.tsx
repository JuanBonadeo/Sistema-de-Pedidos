"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  createCategory,
  updateCategory,
} from "@/lib/catalog/category-actions";
import { CategoryInput } from "@/lib/catalog/schemas";
import type { AdminCategory } from "@/lib/admin/catalog-query";

export function CategoryDialog({
  slug,
  category,
  trigger,
}: {
  slug: string;
  category?: AdminCategory;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(CategoryInput),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          sort_order: category.sort_order,
        }
      : { name: "", slug: "", sort_order: 0 },
  });

  const onSubmit = async (values: CategoryInput) => {
    setSubmitting(true);
    try {
      const result = category
        ? await updateCategory(slug, category.id, values)
        : await createCategory(slug, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(category ? "Actualizada." : "Creada.");
      setOpen(false);
      form.reset(values);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
            id="category-form"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} />
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
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="pizzas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="category-form"
            disabled={submitting}
          >
            {submitting ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
