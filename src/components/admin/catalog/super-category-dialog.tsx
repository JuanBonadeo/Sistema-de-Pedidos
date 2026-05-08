"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  COLOR_CLASSES,
  resolveColorClasses,
  resolveSuperCategoryIcon,
} from "@/components/super-categories/visual";
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
import type { AdminSuperCategory } from "@/lib/admin/catalog-query";
import {
  createSuperCategory,
  deleteSuperCategory,
  updateSuperCategory,
} from "@/lib/catalog/super-category-actions";
import { SuperCategoryInput } from "@/lib/catalog/schemas";
import {
  SUPER_CATEGORY_COLORS,
  SUPER_CATEGORY_ICONS,
  type SuperCategoryColorSlug,
  type SuperCategoryIconSlug,
} from "@/lib/super-categories/visual";

export function SuperCategoryDialog({
  slug,
  superCategory,
  trigger,
  defaultSortOrder = 0,
}: {
  slug: string;
  superCategory?: AdminSuperCategory;
  trigger: React.ReactElement;
  defaultSortOrder?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<SuperCategoryInput>({
    resolver: zodResolver(SuperCategoryInput),
    defaultValues: superCategory
      ? {
          name: superCategory.name,
          slug: superCategory.slug,
          sort_order: superCategory.sort_order,
          icon: (superCategory.icon as SuperCategoryIconSlug) ?? "utensils-crossed",
          color: (superCategory.color as SuperCategoryColorSlug) ?? "zinc",
          is_active: superCategory.is_active,
        }
      : {
          name: "",
          slug: "",
          sort_order: defaultSortOrder,
          icon: "utensils-crossed",
          color: "zinc",
          is_active: true,
        },
  });

  const watchedIcon = form.watch("icon");
  const watchedColor = form.watch("color");

  const onSubmit = async (values: SuperCategoryInput) => {
    setSubmitting(true);
    try {
      const result = superCategory
        ? await updateSuperCategory(slug, superCategory.id, values)
        : await createSuperCategory(slug, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(superCategory ? "Actualizada." : "Creada.");
      setOpen(false);
      form.reset(values);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!superCategory) return;
    setSubmitting(true);
    try {
      const result = await deleteSuperCategory(slug, superCategory.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Borrada. Las categorías quedaron sin asignar.");
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
      setConfirmDelete(false);
    }
  };

  const previewColor = resolveColorClasses(watchedColor);
  const PreviewIcon = resolveSuperCategoryIcon(watchedIcon);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {superCategory ? "Editar supercategoría" : "Nueva supercategoría"}
          </DialogTitle>
        </DialogHeader>

        {/* Preview con el ícono + color elegidos */}
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full ${previewColor.bgStrong}`}
          >
            <PreviewIcon className={`h-6 w-6 ${previewColor.text}`} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Cómo se ve
            </p>
            <p className="truncate text-base font-bold text-zinc-900">
              {form.watch("name") || "Nombre"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
            id="super-category-form"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder="ej: Tragos" {...field} />
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
                    <Input placeholder="tragos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon picker */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícono</FormLabel>
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                    {SUPER_CATEGORY_ICONS.map((iconSlug) => {
                      const Icon = resolveSuperCategoryIcon(iconSlug);
                      const isSelected = field.value === iconSlug;
                      return (
                        <button
                          key={iconSlug}
                          type="button"
                          onClick={() => field.onChange(iconSlug)}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-[0.95] ${
                            isSelected
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                          }`}
                          aria-label={iconSlug}
                          aria-pressed={isSelected}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color picker */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {SUPER_CATEGORY_COLORS.map((colorSlug) => {
                      const c = COLOR_CLASSES[colorSlug];
                      const isSelected = field.value === colorSlug;
                      return (
                        <button
                          key={colorSlug}
                          type="button"
                          onClick={() => field.onChange(colorSlug)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${c.bgStrong} transition active:scale-[0.95] ${
                            isSelected
                              ? "ring-2 ring-zinc-900 ring-offset-2"
                              : "ring-1 ring-inset ring-black/5"
                          }`}
                          aria-label={colorSlug}
                          aria-pressed={isSelected}
                        >
                          <span className={`h-3 w-3 rounded-full ${c.text} bg-current`} />
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {superCategory ? (
            confirmDelete ? (
              <div className="flex flex-1 items-center gap-2">
                <span className="text-xs text-red-700">¿Confirmás?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={submitting}
                >
                  Sí, borrar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Borrar
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" form="super-category-form" disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
